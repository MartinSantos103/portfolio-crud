import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  SearchCheck,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Button from '../../../components/ui/Button.jsx';
import ImageUploader from '../../../components/uploader/ImageUploader.jsx';
import DemoViewer from '../../demos/DemoViewer.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';

const demoFormSchema = z
  .object({
    project_id: z.string().min(1, 'Debes seleccionar el proyecto asociado'),
    title: z.string().trim().min(1, 'El título de la demo es obligatorio').max(140),
    description: z.string().trim().max(1000).optional().default(''),
    type: z.enum(['iframe', 'video', 'imagenes']),
    url: z.string().trim().optional().default(''),
    urls: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((val, ctx) => {
    if ((val.type === 'iframe' || val.type === 'video') && !val.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'Ingresá una dirección URL válida (https://...)',
      });
    }
    if (
      (val.type === 'iframe' || val.type === 'video') &&
      val.url &&
      !/^https?:\/\//i.test(val.url)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'La URL debe comenzar con http:// o https://',
      });
    }
    if (val.type === 'imagenes' && (!val.urls || val.urls.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['urls'],
        message: 'Cargá al menos una imagen para la galería interactiva',
      });
    }
  });

const DEFAULT_DEMO_VALUES = {
  project_id: '',
  title: '',
  description: '',
  type: 'iframe',
  url: '',
  urls: [],
};

export default function DemoFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('project_id') || '';
  const toast = useToast();

  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [projects, setProjects] = useState([]);
  const [headerCheckResult, setHeaderCheckResult] = useState(null);
  const [checkingHeaders, setCheckingHeaders] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      project_id: preselectedProjectId,
      title: '',
      description: '',
      type: 'iframe',
      url: '',
      urls: [],
    },
  });

  const { blocker, bypassBlocker } = useUnsavedChanges(isDirty);

  const loadInitialData = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const [projectsRes, demoRes] = await Promise.all([
        apiFetch('/projects?admin=true'),
        isEditing ? apiFetch(`/demos/${id}`) : Promise.resolve(null),
      ]);

      const projList = Array.isArray(projectsRes?.data) ? projectsRes.data : [];
      setProjects(projList);

      if (isEditing && demoRes?.data) {
        const d = demoRes.data;
        reset({
          project_id: String(d.project_id || ''),
          title: d.title || '',
          description: d.description || '',
          type: d.type === 'images' ? 'imagenes' : d.type || 'iframe',
          url: d.url || '',
          urls: Array.isArray(d.urls) ? d.urls : d.url ? [d.url] : [],
        });
      } else if (!preselectedProjectId && projList[0]?.id) {
        setValue('project_id', String(projList[0].id));
      }

      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar la configuración de la demo.');
      setStatus('error');
    }
  }, [id, isEditing, preselectedProjectId, reset, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInitialData]);

  const watchedValues = useWatch({ control });

  const handleCheckIframeHeaders = async () => {
    const targetUrl = (watchedValues.url || '').trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      toast.error('Ingresá primero una URL con https:// para verificar sus cabeceras');
      return;
    }

    setCheckingHeaders(true);
    setHeaderCheckResult(null);
    try {
      const res = await apiFetch(
        `/demos/check-headers?url=${encodeURIComponent(targetUrl)}`
      );
      setHeaderCheckResult(res);
    } catch (err) {
      toast.error(err.message || 'No se pudo verificar la URL');
    } finally {
      setCheckingHeaders(false);
    }
  };

  const onSubmit = async (formValues) => {
    try {
      const endpoint = isEditing ? `/demos/${id}` : '/demos';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formValues,
        project_id: Number(formValues.project_id),
      };

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      bypassBlocker();
      reset(DEFAULT_DEMO_VALUES);
      toast.success(
        isEditing ? (res?.message || 'Demo actualizada con \u00e9xito') : 'Demo creada con \u00e9xito'
      );
      navigate('/admin/demos');
    } catch (err) {
      toast.error(err.message || 'Error al guardar la demo');
    }
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error('Revisá los campos requeridos de la demo.');
      })}
      noValidate
      className="flex flex-col gap-5 rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
    >
      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Proyecto asociado *
        </label>
        <select
          {...register('project_id')}
          className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
        >
          <option value="">Seleccionar proyecto...</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.title}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="mt-1 text-[12px] text-red-400">{errors.project_id.message}</p>
        )}
      </div>

      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Título de la demo *
        </label>
        <input
          type="text"
          {...register('title')}
          placeholder="Ej. Entorno interactivo de tienda en línea"
          className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
        />
        {errors.title && (
          <p className="mt-1 text-[12px] text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Descripción breve (opcional)
        </label>
        <input
          type="text"
          {...register('description')}
          placeholder="Instrucciones o credenciales de prueba para el visitante..."
          className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
        />
      </div>

      {/* Selector de Tipo de Demo */}
      <div>
        <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
          Tipo de demostración *
        </label>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {[
            {
              id: 'iframe',
              title: 'Iframe (Prioritario)',
              desc: 'App desplegada en Vercel o GitHub Pages',
            },
            {
              id: 'video',
              title: 'Video Externo',
              desc: 'Enlace de YouTube o Loom (cuota cero)',
            },
            {
              id: 'imagenes',
              title: 'Galería de Imágenes',
              desc: 'Secuencia interactiva en Cloudinary',
            },
          ].map((opt) => {
            const isSelected = watchedValues.type === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setValue('type', opt.id, { shouldDirty: true });
                  setHeaderCheckResult(null);
                }}
                className={`cursor-pointer rounded-[12px] border p-3.5 text-left transition-colors ${
                  isSelected
                    ? 'border-[var(--acento)] bg-[var(--tile-icono-bg)]'
                    : 'border-[var(--borde)] bg-[var(--fondo)] hover:border-[var(--acento)]/50'
                }`}
              >
                <p className="font-heading text-[14px] font-bold text-[var(--texto)]">
                  {opt.title}
                </p>
                <p className="font-sans-ui mt-0.5 text-[11px] text-[var(--texto-suave)]">
                  {opt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Campos según el tipo elegido */}
      {watchedValues.type === 'iframe' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              Dirección URL de la aplicación desplegada (Vercel / GitHub Pages) *
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                {...register('url')}
                placeholder="https://mi-app.vercel.app"
                className="font-sans-ui flex-1 rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={checkingHeaders}
                onClick={handleCheckIframeHeaders}
                className="!px-3.5 !py-2 !text-[12px]"
              >
                <SearchCheck size={15} />
                <span>
                  {checkingHeaders ? 'Inspeccionando...' : 'Verificar cabeceras'}
                </span>
              </Button>
            </div>
            {errors.url && (
              <p className="mt-1 text-[12px] text-red-400">{errors.url.message}</p>
            )}
          </div>

          {headerCheckResult && (
            <div
              className={`flex items-start gap-2.5 rounded-[12px] border p-3.5 text-[13px] ${
                headerCheckResult.embeddable
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-[var(--texto)]'
                  : 'border-amber-500/45 bg-amber-500/15 text-[var(--texto)]'
              }`}
            >
              {headerCheckResult.embeddable ? (
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-400" />
              )}
              <span>{headerCheckResult.message}</span>
            </div>
          )}
        </div>
      )}

      {watchedValues.type === 'video' && (
        <div>
          <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
            Enlace externo de inserción (YouTube o Loom) *
          </label>
          <input
            type="url"
            {...register('url')}
            placeholder="https://www.youtube.com/watch?v=... o https://www.loom.com/share/..."
            className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
          <p className="font-sans-ui mt-1.5 text-[12px] text-[var(--texto-suave)]">
            Se convierte automáticamente a formato embed sin consumir cuota de video en Cloudinary.
          </p>
          {errors.url && (
            <p className="mt-1 text-[12px] text-red-400">{errors.url.message}</p>
          )}
        </div>
      )}

      {watchedValues.type === 'imagenes' && (
        <div className="flex flex-col gap-3">
          <ImageUploader
            label="Subir captura a la galería interactiva (urls JSONB)"
            value={tempImageUrl}
            onChange={(url) => {
              if (url) {
                const current = Array.isArray(watchedValues.urls) ? watchedValues.urls : [];
                setValue('urls', [...current, url], { shouldDirty: true });
                setTempImageUrl('');
              }
            }}
            folder="portfolio/demos"
          />
          {errors.urls && (
            <p className="text-[12px] text-red-400">{errors.urls.message}</p>
          )}

          {(watchedValues.urls || []).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(watchedValues.urls || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-[10px] border border-[var(--borde)] bg-[var(--fondo)]"
                >
                  <img src={imgUrl} alt="" className="h-24 w-full object-cover" />
                  <div className="flex items-center justify-between px-2.5 py-1.5">
                    <span className="font-mono-ui text-[11px] text-[var(--texto-suave)]">
                      Pantalla #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (watchedValues.urls || []).filter((_, i) => i !== idx);
                        setValue('urls', next, { shouldDirty: true });
                      }}
                      aria-label="Quitar imagen"
                      className="cursor-pointer rounded p-1 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-[var(--borde)] pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/admin/demos')}
          className="!px-4 !py-2.5 !text-[14px]"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="!px-5 !py-2.5 !text-[14px]"
        >
          <Save size={16} />
          <span>
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear demo'}
          </span>
        </Button>
      </div>
    </form>
  );

  const previewContent = (
    <div className="flex flex-col gap-4">
      {/* Aviso fijo obligatorio de verificación humana cuando el tipo es iframe (Sección 5.4) */}
      {watchedValues.type === 'iframe' && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-[14px] border border-amber-500/40 bg-amber-500/10 p-4 text-[13px] leading-relaxed text-[var(--texto)]"
        >
          <ShieldAlert size={19} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="font-sans-ui">
            «Verifica visualmente que la aplicación cargue aquí abajo. Si ves un recuadro en blanco o un aviso de conexión rechazada, el sitio externo prohíbe ser incrustado en un iframe: en ese caso cambia el tipo de demo a Video o Imágenes».
          </p>
        </div>
      )}

      <DemoViewer demo={watchedValues} />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/demos')}
          aria-label="Volver al listado de demos"
          className="cursor-pointer rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-heading text-[24px] font-bold tracking-tight text-[var(--texto)]">
            {isEditing ? 'Editar Demostración' : 'Nueva Demostración Interactiva'}
          </h1>
          <p className="font-sans-ui text-[13px] text-[var(--texto-suave)]">
            Probá en vivo el entorno interactivo antes de publicarlo en el proyecto.
          </p>
        </div>
      </div>

      <DataState
        status={status}
        skeletonType="form"
        errorMessage={errorMsg}
        onRetry={loadInitialData}
      >
        <LivePreviewLayout
          formContent={formContent}
          previewContent={previewContent}
          previewTitle="Entorno de verificación visual"
        />
      </DataState>

      <UnsavedChangesModal blocker={blocker} />
    </div>
  );
}
