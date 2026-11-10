import { useState, useRef } from 'react';
import { UploadCloud, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react';
import { apiFetch } from '../../services/api.js';
import { useToast } from '../ui/Toast.jsx';
import { VALIDATION_MESSAGES, URL_REGEX } from '../../utils/validationConstants.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * ImageUploader - Componente reutilizable de subida de imágenes a Cloudinary (POST /api/uploads)
 * con validación cliente/servidor de MIME y peso, vista previa y entrada opcional por URL.
 */
export default function ImageUploader({
  label = 'Imagen',
  value,
  onChange,
  folder = 'portfolio',
  helperText = 'JPG, PNG, WebP o AVIF hasta 5 MB.',
}) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlMode, setShowUrlMode] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  const processFile = async (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setInlineError(VALIDATION_MESSAGES.IMAGE_FORMAT_INVALID);
      toast.error(VALIDATION_MESSAGES.IMAGE_FORMAT_INVALID);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setInlineError(VALIDATION_MESSAGES.IMAGE_SIZE_EXCEEDED);
      toast.error(VALIDATION_MESSAGES.IMAGE_SIZE_EXCEEDED);
      return;
    }

    setInlineError('');
    setUploading(true);
    try {
      const base64DataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
        reader.readAsDataURL(file);
      });

      const res = await apiFetch('/uploads', {
        method: 'POST',
        body: JSON.stringify({
          image: base64DataUrl,
          folder,
        }),
      });

      if (res?.url) {
        onChange?.(res.url);
        toast.success('Imagen cargada correctamente');
      }
    } catch (err) {
      const msg = err.message || 'No se pudo subir la imagen';
      setInlineError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDropFile = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!URL_REGEX.test(trimmed)) {
      setInlineError(VALIDATION_MESSAGES.URL_INVALID);
      toast.error(VALIDATION_MESSAGES.URL_INVALID);
      return;
    }
    setInlineError('');
    onChange?.(trimmed);
    setUrlInput('');
    setShowUrlMode(false);
    toast.success('URL de imagen aplicada');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            setShowUrlMode((prev) => !prev);
            setInlineError('');
          }}
          className="font-mono-ui inline-flex cursor-pointer items-center gap-1 text-[11px] text-[var(--acento-texto)] hover:underline"
        >
          <LinkIcon size={12} />
          <span>{showUrlMode ? 'Subir archivo' : 'Pegar URL externa'}</span>
        </button>
      </div>

      {value ? (
        <div className="relative flex items-center gap-4 rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] p-3">
          <img
            src={value}
            alt="Vista previa"
            className="h-16 w-24 shrink-0 rounded-[8px] border border-[var(--borde)] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono-ui truncate text-[12px] text-[var(--texto)]">
              {value.startsWith('data:') ? 'Imagen subida (almacenada)' : value}
            </p>
            <p className="font-sans-ui mt-0.5 text-[12px] text-[var(--texto-suave)]">
              Lista para publicar
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange?.('');
              setInlineError('');
            }}
            aria-label="Quitar imagen"
            className="cursor-pointer rounded-[8px] border border-[var(--borde)] bg-[var(--superficie)] p-2 text-red-400 hover:border-red-500/40 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : showUrlMode ? (
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (inlineError) setInlineError('');
              }}
              placeholder="https://res.cloudinary.com/..."
              maxLength={500}
              className={`font-sans-ui flex-1 rounded-[12px] border bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:outline-none ${
                inlineError
                  ? 'border-[var(--bad)] focus:border-[var(--bad)]'
                  : 'border-[var(--borde)] focus:border-[var(--acento)]'
              }`}
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              className="font-sans-ui cursor-pointer rounded-[12px] bg-[var(--acento)] px-4 py-2.5 text-[13px] font-semibold text-[var(--sobre-acento)] hover:bg-[var(--acento-hover)]"
            >
              Aplicar
            </button>
          </div>
          {inlineError && (
            <span role="alert" className="font-sans-ui text-[12px] font-medium text-[var(--bad)] mt-1 block leading-tight">
              {inlineError}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropFile}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed bg-[var(--fondo)] px-4 py-5 text-center transition-colors hover:bg-[var(--superficie-alta)]/50 ${
              inlineError
                ? 'border-[var(--bad)] hover:border-[var(--bad)]'
                : 'border-[var(--borde)] hover:border-[var(--acento)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
              disabled={uploading}
              className="sr-only"
            />
            {uploading ? (
              <>
                <Loader2 size={22} className="animate-spin text-[var(--acento-texto)]" />
                <span className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
                  Subiendo imagen...
                </span>
              </>
            ) : (
              <>
                <UploadCloud size={22} className="text-[var(--acento-texto)]" />
                <span className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
                  Hacé clic para subir una imagen a Cloudinary
                </span>
                <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
                  {helperText}
                </span>
              </>
            )}
          </label>
          {inlineError && (
            <span role="alert" className="font-sans-ui text-[12px] font-medium text-[var(--bad)] mt-1 block leading-tight">
              {inlineError}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
