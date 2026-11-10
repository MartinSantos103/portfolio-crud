import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Search,
  Star,
  GitFork,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import {
  fetchGitHubRepos,
  fetchGitHubRepoDetails,
  formatRepoTitle,
  matchRepoTechnologies,
} from '../../../services/github.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import DevIcon, {
  CURATED_TECH_ICONS,
} from '../../../components/ui/DevIcon.jsx';
import ImageUploader from '../../../components/uploader/ImageUploader.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';
import { ProjectCardView } from '../../../components/ui/ProjectCard.jsx';
import { ProjectDetailView } from '../../projects/public/ProjectDetail.jsx';
import { resolveTechnologies } from '../../public/data/portfolioData.js';
import {
  VALIDATION_MESSAGES,
  URL_REGEX,
} from '../../../utils/validationConstants.js';

const projectFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título del proyecto es obligatorio')
    .max(140),
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
    .max(300)
    .refine((v) => !v || URL_REGEX.test(v), VALIDATION_MESSAGES.URL_INVALID)
    .optional()
    .default(''),
  live_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || URL_REGEX.test(v), VALIDATION_MESSAGES.URL_INVALID)
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

  // Estados para el selector de repositorios de GitHub
  const [githubOpen, setGithubOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubImporting, setGithubImporting] = useState(null);
  const [githubError, setGithubError] = useState('');
  const [githubSearch, setGithubSearch] = useState('');
  const [selectedRepoName, setSelectedRepoName] = useState('');

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
      const stackFromProfile =
        profileRes?.data?.stack || profileRes?.data?.skills || [];
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

  const loadGitHubRepositories = useCallback(async () => {
    setGithubLoading(true);
    setGithubError('');
    try {
      const list = await fetchGitHubRepos();
      setGithubRepos(list);
    } catch (err) {
      setGithubError(
        err.message || 'No se pudieron obtener los repositorios desde GitHub.'
      );
    } finally {
      setGithubLoading(false);
    }
  }, []);

  const handleToggleGitHubSelector = () => {
    const nextOpen = !githubOpen;
    setGithubOpen(nextOpen);
    if (nextOpen && githubRepos.length === 0 && !githubLoading) {
      loadGitHubRepositories();
    }
  };

  const filteredGitHubRepos = useMemo(() => {
    const q = githubSearch.trim().toLowerCase();
    if (!q) return githubRepos;
    return githubRepos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(q) ||
        (repo.description && repo.description.toLowerCase().includes(q)) ||
        (repo.language && repo.language.toLowerCase().includes(q))
    );
  }, [githubRepos, githubSearch]);

  const watchedValues = useWatch({ control });
  const descLength = (watchedValues.description || '').length;

  const handleSelectGitHubRepo = async (repo) => {
    setGithubImporting(repo.name);
    try {
      const details = await fetchGitHubRepoDetails(repo.owner, repo.name).catch(
        () => repo
      );
      const source = details || repo;

      const formattedTitle = formatRepoTitle(source.name);
      const generatedSlug = toSlug(source.name);
      const rawDesc =
        (source.description || '').trim() ||
        `Repositorio ${formattedTitle} desarrollado y publicado en GitHub.`;
      const shortDescription = rawDesc.slice(0, 220);

      setValue('title', formattedTitle, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('slug', generatedSlug, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('description', shortDescription, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue('repo_url', source.html_url || '', {
        shouldDirty: true,
        shouldValidate: true,
      });

      if (source.homepage && /^https?:\/\//i.test(source.homepage.trim())) {
        setValue('live_url', source.homepage.trim(), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      const matchedTechs = matchRepoTechnologies(source, profileStack);
      if (matchedTechs.length > 0) {
        setValue('technologies', matchedTechs, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      setSelectedRepoName(source.full_name || source.name);
      setGithubOpen(false);
      toast.success(
        `Campos autocompletados desde el repositorio "${source.name}"`
      );
    } catch (err) {
      toast.error(err.message || 'No se pudo autocompletar desde GitHub');
    } finally {
      setGithubImporting(null);
    }
  };

  const handleToggleTechnology = (techKey) => {
    const current = Array.isArray(watchedValues.technologies)
      ? watchedValues.technologies
      : [];
    const exists = current.includes(techKey);
    const next = exists
      ? current.filter((k) => k !== techKey)
      : [...current, techKey];
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
          ? res?.message || 'Proyecto actualizado con éxito'
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
      className="flex flex-col gap-5"
    >
      {/* BLOQUE 1 — Previsualización Pública (Tarjeta de Visitante) */}
      <section className="adm-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--adm-borde)] pb-3">
          <div>
            <span className="adm-eyebrow !text-[var(--ac2)]">
              BLOQUE 1 — TARJETA PÚBLICA (VISITANTES)
            </span>
            <h2 className="adm-h2 mt-0.5">
              Información principal y tecnologías
            </h2>
          </div>

          <button
            type="button"
            onClick={handleToggleGitHubSelector}
            className="adm-btn secondary sm"
          >
            <DevIcon name="github" size={14} colored={false} />
            <span>
              {selectedRepoName
                ? `Repo: ${selectedRepoName}`
                : 'Autocompletar desde GitHub'}
            </span>
            {githubOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Panel desplegable de selección de repositorio de GitHub con buscador por nombre */}
        {githubOpen && (
          <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--adm-borde)] bg-[#090b20] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="adm-h3">
                  Seleccionar repositorio de tu cuenta de GitHub
                </h3>
                <p className="adm-sub">
                  Elegí un repositorio para rellenar automáticamente título,
                  slug, descripción, URL y tecnologías.
                </p>
              </div>
              <button
                type="button"
                onClick={loadGitHubRepositories}
                disabled={githubLoading}
                className="adm-btn secondary sm"
              >
                <RefreshCw
                  size={12}
                  className={githubLoading ? 'animate-spin' : ''}
                />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Buscador de repositorios por nombre */}
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--adm-texto-suave)]"
              />
              <input
                type="text"
                maxLength={100}
                value={githubSearch}
                onChange={(e) => setGithubSearch(e.target.value)}
                placeholder="Buscar repositorio por nombre..."
                className="adm-input !pl-9"
              />
            </div>

            {githubLoading ? (
              <div className="adm-mono py-6 text-center text-[12px] text-[var(--adm-texto-suave)]">
                Consultando repositorios de tu perfil de GitHub...
              </div>
            ) : githubError ? (
              <div className="rounded-[10px] border border-[rgba(251,113,133,0.3)] bg-[rgba(251,113,133,0.1)] px-3.5 py-2.5 text-[12.5px] text-[var(--bad)]">
                {githubError}
              </div>
            ) : filteredGitHubRepos.length === 0 ? (
              <div className="py-5 text-center text-[12.5px] text-[var(--adm-texto-suave)]">
                No se encontraron repositorios que coincidan con &quot;
                {githubSearch}&quot;.
              </div>
            ) : (
              <div className="max-h-64 divide-y divide-[var(--adm-borde)] overflow-y-auto rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)]">
                {filteredGitHubRepos.map((repo) => {
                  const isImportingThis = githubImporting === repo.name;
                  return (
                    <button
                      key={repo.id || repo.name}
                      type="button"
                      disabled={Boolean(githubImporting)}
                      onClick={() => handleSelectGitHubRepo(repo)}
                      className="flex w-full cursor-pointer items-start justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-[var(--adm-superficie-alta)] disabled:opacity-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="adm-mono text-[13px] font-semibold !text-[var(--adm-texto)]">
                            {repo.name}
                          </span>
                          {repo.language && (
                            <span className="adm-chip accent">
                              {repo.language}
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--adm-texto-suave)]">
                            {repo.description}
                          </p>
                        )}
                      </div>

                      <div className="adm-mono flex shrink-0 items-center gap-2.5 pt-0.5 text-[11px] text-[var(--adm-texto-suave)]">
                        <span
                          className="inline-flex items-center gap-1"
                          title="Estrellas"
                        >
                          <Star size={12} className="text-[var(--warn)]" />
                          {repo.stargazers_count ?? 0}
                        </span>
                        <span
                          className="inline-flex items-center gap-1"
                          title="Forks"
                        >
                          <GitFork size={12} />
                          {repo.forks_count ?? 0}
                        </span>
                        <span className="adm-chip accent">
                          {isImportingThis ? 'Cargando...' : 'Elegir'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="adm-label">Título del proyecto *</label>
            <input
              type="text"
              maxLength={140}
              {...register('title', {
                onChange: (e) => {
                  if (!isEditing) {
                    setValue('slug', toSlug(e.target.value), {
                      shouldDirty: true,
                    });
                  }
                },
              })}
              placeholder="Ej. Plataforma E-Commerce"
              className="adm-input"
            />
            {errors.title && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="adm-label">Slug (identificador URL) *</label>
            <input
              type="text"
              maxLength={160}
              {...register('slug')}
              placeholder="plataforma-e-commerce"
              className="adm-input adm-mono"
            />
            {errors.slug && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.slug.message}
              </p>
            )}
          </div>
        </div>

        {/* Descripción corta con contador en vivo de 220 caracteres */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="adm-label !m-0">
              Descripción corta (Tarjeta de visitante) *
            </label>
            <span
              className={`adm-mono text-[11px] font-medium ${
                descLength > 220
                  ? '!text-[var(--bad)]'
                  : descLength > 190
                    ? '!text-[var(--warn)]'
                    : ''
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
            className="adm-textarea !min-h-[82px]"
          />
          {errors.description && (
            <p className="mt-1 text-[12px] text-[var(--bad)]">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Portada principal */}
        <ImageUploader
          label="Imagen de portada principal (Cloudinary)"
          value={watchedValues.cover_image_url}
          onChange={(url) =>
            setValue('cover_image_url', url, { shouldDirty: true })
          }
          folder="portfolio/projects"
        />

        {/* Selector de Tecnologías sincronizado con el Stack del Perfil */}
        <div>
          <label className="adm-label">
            Selector de Tecnologías (sincronizado con el Stack de tu Perfil)
          </label>
          <div className="flex flex-wrap gap-2 rounded-[12px] border border-[var(--adm-borde)] bg-[#090b20] p-3.5">
            {profileStack.map((tech) => {
              const key = tech.icon_key || tech.id;
              const isSelected = (watchedValues.technologies || []).includes(
                key
              );
              return (
                <button
                  key={tech.id || key}
                  type="button"
                  onClick={() => handleToggleTechnology(key)}
                  className={`adm-chip cursor-pointer transition-colors ${
                    isSelected ? 'accent' : ''
                  }`}
                >
                  <DevIcon name={key} size={14} />
                  <span>{tech.name}</span>
                  {isSelected && (
                    <Check size={12} className="text-[var(--ac2)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interruptor Publicado */}
        <div>
          <label className="adm-check cursor-pointer">
            <div>
              <b className="block font-semibold text-[var(--adm-texto)]">
                Publicado
              </b>
              <small className="adm-sub-line">
                Si se desactiva, queda guardado como Borrador.
              </small>
            </div>
            <input
              type="checkbox"
              {...register('published')}
              className="adm-switch"
            />
          </label>
        </div>
      </section>

      {/* BLOQUE 2 — Detalle Completo (Exclusivo Usuarios Registrados) */}
      <section className="adm-card flex flex-col gap-4">
        <div className="border-b border-[var(--adm-borde)] pb-3">
          <span className="adm-eyebrow !text-[var(--ac2)]">
            BLOQUE 2 — DETALLE TÉCNICO (USUARIOS REGISTRADOS)
          </span>
          <h2 className="adm-h2 mt-0.5">
            Caso de estudio en Markdown simple, galería y enlaces
          </h2>
        </div>

        <div>
          <label className="adm-label">
            1. El Problema (Markdown simple: soporta **negrita**, `código` y
            listas con -)
          </label>
          <textarea
            rows={4}
            maxLength={8000}
            {...register('problem')}
            placeholder="¿Qué necesidad o cuello de botella resolvía este proyecto?"
            className="adm-textarea"
          />
        </div>

        <div>
          <label className="adm-label">2. La Solución (Markdown simple)</label>
          <textarea
            rows={4}
            maxLength={8000}
            {...register('solution')}
            placeholder="¿Qué arquitectura y funcionalidades se implementaron?"
            className="adm-textarea"
          />
        </div>

        <div>
          <label className="adm-label">
            3. Decisiones Técnicas (Markdown simple)
          </label>
          <textarea
            rows={4}
            maxLength={8000}
            {...register('tech_decisions')}
            placeholder="¿Por qué elegiste estas herramientas, patrones o estructura de datos?"
            className="adm-textarea"
          />
        </div>

        {/* Galería de imágenes secundarias */}
        <div className="flex flex-col gap-3 rounded-[14px] border border-[var(--adm-borde)] bg-[#090b20] p-4">
          <ImageUploader
            label="Agregar imagen a la galería secundaria (project_images)"
            value={newGalleryUrl}
            onChange={(url) => {
              if (url) {
                appendImage({
                  url,
                  alt: watchedValues.title || 'Captura del proyecto',
                });
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
                  className="group relative overflow-hidden rounded-[10px] border border-[var(--adm-borde)] bg-[var(--adm-superficie)]"
                >
                  <img
                    src={img.url}
                    alt={img.alt || ''}
                    className="h-28 w-full object-cover"
                  />
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="adm-mono text-[10px]">#{idx + 1}</span>
                    <div className="adm-order">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => swapImage(idx, idx - 1)}
                        aria-label="Mover antes"
                        className="adm-iconbtn !h-6 !min-w-[24px] !px-1"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === imageFields.length - 1}
                        onClick={() => swapImage(idx, idx + 1)}
                        aria-label="Mover después"
                        className="adm-iconbtn !h-6 !min-w-[24px] !px-1"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Eliminar imagen"
                        className="adm-iconbtn danger !h-6 !min-w-[24px] !px-1"
                      >
                        <Trash2 size={12} />
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
            <label className="adm-label">URL del repositorio (GitHub)</label>
            <input
              type="url"
              maxLength={300}
              {...register('repo_url')}
              placeholder="https://github.com/usuario/proyecto"
              className="adm-input"
            />
            {errors.repo_url && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.repo_url.message}
              </p>
            )}
          </div>

          <div>
            <label className="adm-label">URL de despliegue en vivo</label>
            <input
              type="url"
              maxLength={300}
              {...register('live_url')}
              placeholder="https://mi-proyecto.vercel.app"
              className="adm-input"
            />
            {errors.live_url && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.live_url.message}
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--adm-borde)] pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos')}
            className="adm-btn secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="adm-btn primary"
          >
            <Save size={15} />
            <span>
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear proyecto'}
            </span>
          </button>
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
    <div id="v-proyectos" className="adm-view is-on flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/proyectos')}
            aria-label="Volver al listado de proyectos"
            className="adm-iconbtn !h-9 !w-9"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="adm-h1 !text-[24px]">
              {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h1>
            <p className="adm-sub">
              Alterná el rol en el cabezal derecho para previsualizar la Tarjeta
              de Visitante o el Detalle Técnico.
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
