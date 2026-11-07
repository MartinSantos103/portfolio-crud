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
    title: z
      .string()
      .trim()
      .min(1, 'El título de la demo es obligatorio')
      .max(140),
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

      const projList = Array.isArray(projectsRes?.data)
        ? projectsRes.data
        : [];
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
      setErrorMsg(
        err.message || 'No se pudo cargar la configuración de la demo.'
      );
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
      toast.error(
        'Ingresá primero una URL con https:// para verificar sus cabeceras'
      );
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
        isEditing
          ? res?.message || 'Demo actualizada con éxito'
          : 'Demo creada con éxito'
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
      className="adm-card flex flex-col gap-5"
    >
      <div>
        <label className="adm-label">Proyecto asociado *</label>
        <select {...register('project_id')} className="adm-select">
          <option value="">Seleccionar proyecto...</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.title}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="mt-1 text-[12px] text-[var(--bad)]">
            {errors.project_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="adm-label">Título de la demo *</label>
        <input
          type="text"
          {...register('title')}
          placeholder="Ej. Entorno interactivo de tienda en línea"
          className="adm-input"
        />
        {errors.title && (
          <p className="mt-1 text-[12px] text-[var(--bad)]">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label className="adm-label">Descripción breve (opcional)</label>
        <input
          type="text"
          {...register('description')}
          placeholder="Instrucciones o credenciales de prueba para el visitante..."
          className="adm-input"
        />
      </div>

      {/* Selector de Tipo de Demo */}
      <div>
        <label className="adm-label">Tipo de demostración *</label>
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
                    ? 'border-[var(--adm-acento)] bg-[var(--adm-superficie-alta)]'
                    : 'border-[var(--adm-borde)] bg-[#090b20] hover:border-[var(--adm-acento)]'
                }`}
              >
                <p className="font-heading text-[14px] font-bold text-[var(--adm-texto)]">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--adm-texto-suave)]">
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
            <label className="adm-label">
              Dirección URL de la aplicación desplegada (Vercel / GitHub Pages) *
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                {...register('url')}
                placeholder="https://mi-app.vercel.app"
                className="adm-input flex-1"
              />
              <button
                type="button"
                disabled={checkingHeaders}
                onClick={handleCheckIframeHeaders}
                className="adm-btn secondary sm shrink-0"
              >
                <SearchCheck size={15} />
                <span>
                  {checkingHeaders
                    ? 'Inspeccionando...'
                    : 'Verificar cabeceras'}
                </span>
              </button>
            </div>
            {errors.url && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.url.message}
              </p>
            )}
          </div>

          {headerCheckResult && (
            <div
              className={`flex items-start gap-2.5 rounded-[12px] border p-3.5 text-[13px] ${
                headerCheckResult.embeddable
                  ? 'border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.1)] text-[var(--adm-texto)]'
                  : 'border-[rgba(251,191,36,0.45)] bg-[rgba(251,191,36,0.12)] text-[var(--adm-texto)]'
              }`}
            >
              {headerCheckResult.embeddable ? (
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-[var(--ok)]"
                />
              ) : (
                <ShieldAlert
                  size={17}
                  className="mt-0.5 shrink-0 text-[var(--warn)]"
                />
              )}
              <span>{headerCheckResult.message}</span>
            </div>
          )}
        </div>
      )}

      {watchedValues.type === 'video' && (
        <div>
          <label className="adm-label">
            Enlace externo de inserción (YouTube o Loom) *
          </label>
          <input
            type="url"
            {...register('url')}
            placeholder="https://www.youtube.com/watch?v=... o https://www.loom.com/share/..."
            className="adm-input"
          />
          <p className="adm-sub mt-1.5">
            Se convierte automáticamente a formato embed sin consumir cuota de
            video en Cloudinary.
          </p>
          {errors.url && (
            <p className="mt-1 text-[12px] text-[var(--bad)]">
              {errors.url.message}
            </p>
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
                const current = Array.isArray(watchedValues.urls)
                  ? watchedValues.urls
                  : [];
                setValue('urls', [...current, url], { shouldDirty: true });
                setTempImageUrl('');
              }
            }}
            folder="portfolio/demos"
          />
          {errors.urls && (
            <p className="text-[12px] text-[var(--bad)]">
              {errors.urls.message}
            </p>
          )}

          {(watchedValues.urls || []).length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(watchedValues.urls || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-[10px] border border-[var(--adm-borde)] bg-[#090b20]"
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="h-24 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-2.5 py-1.5">
                    <span className="adm-mono text-[11px]">
                      Pantalla #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (watchedValues.urls || []).filter(
                          (_, i) => i !== idx
                        );
                        setValue('urls', next, { shouldDirty: true });
                      }}
                      aria-label="Quitar imagen"
                      className="adm-iconbtn danger !h-6 !w-6"
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

      <div className="flex items-center justify-end gap-3 border-t border-[var(--adm-borde)] pt-4">
        <button
          type="button"
          onClick={() => navigate('/admin/demos')}
          className="adm-btn secondary"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="adm-btn primary"
        >
          <Save size={16} />
          <span>
            {isSubmitting
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : 'Crear demo'}
          </span>
        </button>
      </div>
    </form>
  );

  const previewContent = (
    <div className="flex flex-col gap-4">
      {/* Aviso fijo obligatorio de verificación humana cuando el tipo es iframe (Sección 5.4) */}
      {watchedValues.type === 'iframe' && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-[14px] border border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] p-4 text-[13px] leading-relaxed text-[var(--adm-texto)]"
        >
          <ShieldAlert
            size={19}
            className="mt-0.5 shrink-0 text-[var(--warn)]"
          />
          <p>
            «Verifica visualmente que la aplicación cargue aquí abajo. Si ves un
            recuadro en blanco o un aviso de conexión rechazada, el sitio
            externo prohíbe ser incrustado en un iframe: en ese caso cambia el
            tipo de demo a Video o Imágenes».
          </p>
        </div>
      )}

      <DemoViewer demo={watchedValues} />
    </div>
  );

  return (
    <div id="v-demos" className="adm-view is-on flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/demos')}
          aria-label="Volver al listado de demos"
          className="adm-iconbtn !h-9 !w-9"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="adm-h1 !text-[24px]">
            {isEditing
              ? 'Editar Demostración'
              : 'Nueva Demostración Interactiva'}
          </h1>
          <p className="adm-sub">
            Probá en vivo el entorno interactivo antes de publicarlo en el
            proyecto.
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
