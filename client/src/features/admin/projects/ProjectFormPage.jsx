import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import Button from '../../../components/ui/Button.jsx';
import DevIcon, { CURATED_TECH_ICONS } from '../../../components/ui/DevIcon.jsx';
import ImageUploader from '../../../components/uploader/ImageUploader.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';
import { ProjectCardView } from '../../../components/ui/ProjectCard.jsx';
import { ProjectDetailView } from '../../projects/public/ProjectDetail.jsx';
import { resolveTechnologies } from '../../public/data/portfolioData.js';

const projectFormSchema = z.object({
  title: z.string().trim().min(1, 'El título del proyecto es obligatorio').max(140),
  slug: z.string().trim().min(1, 'El slug es obligatorio').max(160),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción corta es obligatoria')
    .max(220, 'La descripción corta no puede superar los 220 caracteres'),
  cover_image_url: z.string().trim().optional().default(''),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  technologies: z.array(z.string()).default([]),
  problem: z.string().trim().max(8000).optional().default(''),
  solution: z.string().trim().max(8000).optional().default(''),
  tech_decisions: z.string().trim().max(8000).optional().default(''),
  images: z
    .array(
      z.object({
        url: z.string().trim().min(1),
        alt: z.string().trim().optional().default(''),
      })
    )
    .default([]),
  repo_url: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Debe comenzar con http:// o https://')
    .optional()
    .default(''),
  live_url: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Debe comenzar con http:// o https://')
    .optional()
    .default(''),
});

function toSlug(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DEFAULT_PROJECT_VALUES = {
  title: '',
  slug: '',
  description: '',
  cover_image_url: '',
  featured: false,
  published: true,
  technologies: ['react', 'nodejs', 'postgresql'],
  problem: '',
  solution: '',
  tech_decisions: '',
  images: [],
  repo_url: '',
  live_url: '',
};

export default function ProjectFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState(isEditing ? 'cargando' : 'con_datos');
  const [errorMsg, setErrorMsg] = useState('');
  const [previewRole, setPreviewRole] = useState('visitor'); // 'visitor' | 'registered'
  const [profileStack, setProfileStack] = useState([]);
  const [projectDemos, setProjectDemos] = useState([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      cover_image_url: '',
      featured: false,
      published: true,
      technologies: ['react', 'nodejs', 'postgresql'],
      problem: '',
      solution: '',
      tech_decisions: '',
      images: [],
      repo_url: '',
      live_url: '',
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
    swap: swapImage,
  } = useFieldArray({ control, name: 'images' });

  const { blocker, bypassBlocker } = useUnsavedChanges(isDirty);

  const loadInitialData = useCallback(async () => {
    setErrorMsg('');
    if (isEditing) setStatus('cargando');

    try {
      const [profileRes, projectRes] = await Promise.all([
        apiFetch('/profile').catch(() => null),
        isEditing ? apiFetch(`/projects/${id}`) : Promise.resolve(null),
      ]);

      // Cargar Stack del Perfil como única fuente de verdad de tecnologías sugeridas
      const stackFromProfile = profileRes?.data?.stack || profileRes?.data?.skills || [];
      if (Array.isArray(stackFromProfile) && stackFromProfile.length > 0) {
        setProfileStack(stackFromProfile);
      } else {
        setProfileStack(
          CURATED_TECH_ICONS.slice(0, 12).map((t) => ({
            id: t.key,
            name: t.label,
            category: t.category,
            icon_key: t.key,
          }))
        );
      }

      if (isEditing && projectRes?.data) {
        const p = projectRes.data;
        setProjectDemos(Array.isArray(p.demos) ? p.demos : []);
        reset({
          title: p.title || '',
          slug: p.slug || toSlug(p.title),
          description: p.description || p.summary || '',
          cover_image_url: p.cover_image_url || '',
          featured: Boolean(p.featured),
          published: Boolean(p.published),
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
          problem: p.problem || '',
          solution: p.solution || '',
          tech_decisions: p.tech_decisions || '',
          images: Array.isArray(p.images)
            ? p.images.map((img) => ({ url: img.url, alt: img.alt || '' }))
            : [],
          repo_url: p.repo_url || '',
          live_url: p.live_url || '',
        });
      }

      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el proyecto.');
      setStatus('error');
    }
  }, [id, isEditing, reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadInitialData]);

  const watchedValues = useWatch({ control });
  const descLength = (watchedValues.description || '').length;

  const handleToggleTechnology = (techKey) => {
    const current = Array.isArray(watchedValues.technologies)
      ? watchedValues.technologies
      : [];
    const exists = current.includes(techKey);
    const next = exists ? current.filter((k) => k !== techKey) : [...current, techKey];
    setValue('technologies', next, { shouldDirty: true });
  };

  const onSubmit = async (formValues) => {
    try {
      const endpoint = isEditing ? `/projects/${id}` : '/projects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify({
          ...formValues,
          summary: formValues.description,
        }),
      });

      bypassBlocker();
      reset(DEFAULT_PROJECT_VALUES);
      toast.success(
        isEditing
          ? (res?.message || 'Proyecto actualizado con éxito')
          : 'Proyecto agregado con éxito'
      );
      navigate('/admin/proyectos');
    } catch (err) {
      toast.error(err.message || 'Error al guardar el proyecto');
    }
  };

  const resolvedPreviewTechs = resolveTechnologies(
    watchedValues.technologies || [],
    profileStack.map((s) => ({
      id: s.icon_key || s.id,
      name: s.name,
      category: s.category,
      icon_key: s.icon_key || s.id,
    }))
  );

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error('Verificá los campos obligatorios del proyecto.');
      })}
      noValidate
      className="flex flex-col gap-6"
    >
      {/* BLOQUE 1 — Previsualización Pública (Tarjeta de Visitante) */}
      <section className="flex flex-col gap-4 rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6">
        <div className="border-b border-[var(--borde)] pb-3">
          <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--acento-texto)]">
            BLOQUE 1 — TARJETA PÚBLICA (VISITANTES)
          </span>
          <h2 className="font-heading mt-0.5 text-[18px] font-bold text-[var(--texto)]">
            Información principal y tecnologías
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              Título del proyecto *
            </label>
            <input
              type="text"
              {...register('title', {
                onChange: (e) => {
                  if (!isEditing) {
                    setValue('slug', toSlug(e.target.value), { shouldDirty: true });
                  }
                },
              })}
              placeholder="Ej. Plataforma E-Commerce"
              className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.title && (
              <p className="mt-1 text-[12px] text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              Slug (identificador URL) *
            </label>
            <input
              type="text"
              {...register('slug')}
              placeholder="plataforma-e-commerce"
              className="font-mono-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[13px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.slug && (
              <p className="mt-1 text-[12px] text-red-400">{errors.slug.message}</p>
            )}
          </div>
        </div>

        {/* Descripción corta con contador en vivo de 220 caracteres */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="font-sans-ui text-[13px] font-medium text-[var(--texto)]">
              Descripción corta (Tarjeta de visitante) *
            </label>
            <span
              className={`font-mono-ui text-[11px] font-medium ${
                descLength > 220
                  ? 'text-red-400'
                  : descLength > 190
                    ? 'text-amber-400'
                    : 'text-[var(--texto-suave)]'
              }`}
            >
              {descLength} / 220 caracteres
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={220}
            {...register('description')}
            placeholder="Resumen conciso del proyecto visible para todos los visitantes..."
            className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
          {errors.description && (
            <p className="mt-1 text-[12px] text-red-400">{errors.description.message}</p>
          )}
        </div>

        {/* Portada principal */}
        <ImageUploader
          label="Imagen de portada principal (Cloudinary)"
          value={watchedValues.cover_image_url}
          onChange={(url) => setValue('cover_image_url', url, { shouldDirty: true })}
          folder="portfolio/projects"
        />

        {/* Selector de Tecnologías sincronizado con el Stack del Perfil */}
        <div>
          <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
            Selector de Tecnologías (sincronizado con el Stack de tu Perfil)
          </label>
          <div className="flex flex-wrap gap-2 rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] p-3.5">
            {profileStack.map((tech) => {
              const key = tech.icon_key || tech.id;
              const isSelected = (watchedValues.technologies || []).includes(key);
              return (
                <button
                  key={tech.id || key}
                  type="button"
                  onClick={() => handleToggleTechnology(key)}
                  className={`font-mono-ui inline-flex cursor-pointer items-center gap-2 rounded-[9px] border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    isSelected
                      ? 'border-[var(--acento)] bg-[var(--tile-icono-bg)] text-[var(--texto)]'
                      : 'border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto-suave)] hover:text-[var(--texto)]'
                  }`}
                >
                  <DevIcon name={key} size={15} />
                  <span>{tech.name}</span>
                  {isSelected && <Check size={13} className="text-[var(--acento-texto)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interruptores Destacado y Publicado */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-4 py-3">
            <div>
              <p className="font-sans-ui text-[13px] font-semibold text-[var(--texto)]">
                Proyecto Destacado
              </p>
              <p className="font-sans-ui text-[11px] text-[var(--texto-suave)]">
                Resalta este trabajo en el listado.
              </p>
            </div>
            <input
              type="checkbox"
              {...register('featured')}
              className="h-4 w-4 accent-[var(--acento)]"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-4 py-3">
            <div>
              <p className="font-sans-ui text-[13px] font-semibold text-[var(--texto)]">
                Publicado
              </p>
              <p className="font-sans-ui text-[11px] text-[var(--texto-suave)]">
                Si se desactiva, queda guardado como Borrador.
              </p>
            </div>
            <input
              type="checkbox"
              {...register('published')}
              className="h-4 w-4 accent-[var(--acento)]"
            />
          </label>
        </div>
      </section>

      {/* BLOQUE 2 — Detalle Completo (Exclusivo Usuarios Registrados) */}
      <section className="flex flex-col gap-4 rounded-[18px] border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6">
        <div className="border-b border-[var(--borde)] pb-3">
          <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--acento-texto)]">
            BLOQUE 2 — DETALLE TÉCNICO (USUARIOS REGISTRADOS)
          </span>
          <h2 className="font-heading mt-0.5 text-[18px] font-bold text-[var(--texto)]">
            Caso de estudio en Markdown simple, galería y enlaces
          </h2>
        </div>

        <div>
          <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
            1. El Problema (Markdown simple: soporta **negrita**, `código` y listas con -)
          </label>
          <textarea
            rows={4}
            {...register('problem')}
            placeholder="¿Qué necesidad o cuello de botella resolvía este proyecto?"
            className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        <div>
          <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
            2. La Solución (Markdown simple)
          </label>
          <textarea
            rows={4}
            {...register('solution')}
            placeholder="¿Qué arquitectura y funcionalidades se implementaron?"
            className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        <div>
          <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
            3. Decisiones Técnicas (Markdown simple)
          </label>
          <textarea
            rows={4}
            {...register('tech_decisions')}
            placeholder="¿Por qué elegiste estas herramientas, patrones o estructura de datos?"
            className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
          />
        </div>

        {/* Galería de imágenes secundarias */}
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)] p-4">
          <ImageUploader
            label="Agregar imagen a la galería secundaria (project_images)"
            value={newGalleryUrl}
            onChange={(url) => {
              if (url) {
                appendImage({ url, alt: watchedValues.title || 'Captura del proyecto' });
                setNewGalleryUrl('');
              }
            }}
            folder="portfolio/project-gallery"
          />

          {imageFields.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {imageFields.map((img, idx) => (
                <div
                  key={img.id}
                  className="group relative overflow-hidden rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)]"
                >
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="h-28 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="font-mono-ui text-[10px] text-[var(--texto-suave)]">
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => swapImage(idx, idx - 1)}
                        aria-label="Mover antes"
                        className="cursor-pointer rounded p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] disabled:opacity-30"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === imageFields.length - 1}
                        onClick={() => swapImage(idx, idx + 1)}
                        aria-label="Mover después"
                        className="cursor-pointer rounded p-1 text-[var(--texto-suave)] hover:bg-[var(--superficie-alta)] disabled:opacity-30"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Eliminar imagen"
                        className="cursor-pointer rounded p-1 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enlaces opcionales validados */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              URL del repositorio (GitHub)
            </label>
            <input
              type="url"
              {...register('repo_url')}
              placeholder="https://github.com/usuario/proyecto"
              className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.repo_url && (
              <p className="mt-1 text-[12px] text-red-400">{errors.repo_url.message}</p>
            )}
          </div>

          <div>
            <label className="font-sans-ui mb-1.5 block text-[13px] font-medium text-[var(--texto)]">
              URL de despliegue en vivo
            </label>
            <input
              type="url"
              {...register('live_url')}
              placeholder="https://mi-proyecto.vercel.app"
              className="font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-3.5 py-2.5 text-[14px] text-[var(--texto)] focus:border-[var(--acento)] focus:outline-none"
            />
            {errors.live_url && (
              <p className="mt-1 text-[12px] text-red-400">{errors.live_url.message}</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--borde)] pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/proyectos')}
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
                  : 'Crear proyecto'}
            </span>
          </Button>
        </div>
      </section>
    </form>
  );

  const previewContent =
    previewRole === 'visitor' ? (
      <div className="mx-auto max-w-[380px]">
        <ProjectCardView
          project={{
            ...watchedValues,
            summary: watchedValues.description,
          }}
          technologies={resolvedPreviewTechs}
          isAuthenticated={false}
        />
      </div>
    ) : (
      <ProjectDetailView
        project={{
          ...watchedValues,
          summary: watchedValues.description,
        }}
        technologies={resolvedPreviewTechs}
        demos={projectDemos}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos')}
            aria-label="Volver al listado de proyectos"
            className="cursor-pointer rounded-[10px] border border-[var(--borde)] bg-[var(--superficie)] p-2 text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)]"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-heading text-[24px] font-bold tracking-tight text-[var(--texto)]">
              {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h1>
            <p className="font-sans-ui text-[13px] text-[var(--texto-suave)]">
              Alterná el rol en el cabezal derecho para previsualizar la Tarjeta de Visitante o el Detalle Técnico.
            </p>
          </div>
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
          previewTitle="Vista previa del proyecto"
          showRoleSelector={true}
          previewRole={previewRole}
          onPreviewRoleChange={(role) => setPreviewRole(role)}
        />
      </DataState>

      <UnsavedChangesModal blocker={blocker} />
    </div>
  );
}
