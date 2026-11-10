import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  User,
  Cpu,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { apiFetch } from '../../../services/api.js';
import { useToast } from '../../../components/ui/Toast.jsx';
import DataState from '../../../components/ui/DataState.jsx';
import IconPicker from '../../../components/ui/IconPicker.jsx';
import ImageUploader from '../../../components/uploader/ImageUploader.jsx';
import DevIcon from '../../../components/ui/DevIcon.jsx';
import TechChip from '../../../components/ui/TechChip.jsx';
import FilterPill from '../../../components/ui/FilterPill.jsx';
import Button from '../../../components/ui/Button.jsx';
import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import AttitudeCard from '../../../components/ui/AttitudeCard.jsx';
import TrajectoryCard from '../../../components/ui/TrajectoryCard.jsx';
import LivePreviewLayout from '../components/LivePreviewLayout.jsx';
import { fetchGitHubProfile } from '../../../services/github.js';
import {
  useUnsavedChanges,
  UnsavedChangesModal,
} from '../hooks/useUnsavedChanges.jsx';
import {
  updatePortfolioProfileCache,
  compareMilestonesChronological,
} from '../../public/hooks/usePortfolioData.js';
import {
  PROFILE_DATA,
  ABOUT_DATA,
  TRAJECTORY_DATA,
  STACK_CATEGORIES,
} from '../../public/data/portfolioData.js';
import {
  VALIDATION_MESSAGES,
  URL_REGEX,
} from '../../../utils/validationConstants.js';

const stackItemSchema = z.object({
  id: z.string().trim().min(1, 'ID requerido'),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la tecnología es obligatorio')
    .max(80),
  category: z.enum(['frontend', 'backend', 'database', 'tools']),
  icon_key: z.string().trim().min(1, 'Seleccioná un ícono del catálogo'),
});

const milestoneSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(['experiencia', 'educacion']),
  title: z.string().trim().min(1, 'El rol o título es obligatorio').max(140),
  organization: z
    .string()
    .trim()
    .min(1, 'La organización o institución es obligatoria')
    .max(140),
  start_date: z
    .string()
    .trim()
    .min(1, 'El año/fecha de inicio es obligatorio')
    .max(40),
  end_date: z.string().trim().max(40).optional().default(''),
  current: z.boolean().optional().default(false),
  description: z.string().trim().max(600).optional().default(''),
});

const socialLinkSchema = z.object({
  id: z.string().trim().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la red es obligatorio')
    .max(50),
  url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => URL_REGEX.test(v), VALIDATION_MESSAGES.URL_INVALID),
});

const profileFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'El nombre completo es obligatorio')
    .max(120),
  headline: z
    .string()
    .trim()
    .min(1, 'El titular profesional es obligatorio')
    .max(160),
  short_bio: z
    .string()
    .trim()
    .max(300, 'Máximo 300 caracteres')
    .optional()
    .default(''),
  bio: z
    .string()
    .trim()
    .max(5000, 'Máximo 5000 caracteres')
    .optional()
    .default(''),
  photo_url: z.string().trim().nullable().optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  contact_email: z
    .string()
    .trim()
    .min(1, 'El correo de contacto es obligatorio')
    .max(100)
    .email(VALIDATION_MESSAGES.EMAIL_INVALID),
  cv_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || URL_REGEX.test(v), VALIDATION_MESSAGES.URL_INVALID)
    .optional()
    .default(''),
  stack: z.array(stackItemSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
  social_links_list: z.array(socialLinkSchema).default([]),
});

const TABS = [
  { id: 'identidad', label: '1. Identidad', icon: User },
  { id: 'stack', label: '2. Tecnologías ', icon: Cpu },
  { id: 'trayectoria', label: '3. Trayectoria', icon: GraduationCap },
];

const CATEGORY_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Base de Datos',
  tools: 'Herramientas',
};

const DEFAULT_HERO_PREFIX = 'Desarrollo software';
const DEFAULT_HERO_WORDS = [
  'robusto',
  'eficiente',
  'escalable',
  'intuitivo',
  'seguro',
  'mantenible',
];

function HeroPreviewTypewriter() {
  const cleanPrefix = DEFAULT_HERO_PREFIX;
  const words = DEFAULT_HERO_WORDS;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const [typedPrefix, setTypedPrefix] = useState(() =>
    prefersReducedMotion ? cleanPrefix : ''
  );
  const [typedWord, setTypedWord] = useState(() =>
    prefersReducedMotion ? words[0] : ''
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    let timerId = null;
    let isCancelled = false;

    let prefixIndex = 0;
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const TYPE_PREFIX_SPEED = 35;
    const TYPE_WORD_SPEED = 65;
    const DELETE_SPEED = 40;
    const PAUSE_BEFORE_DELETE = 1800;
    const PAUSE_BEFORE_NEXT_WORD = 350;

    function scheduleNext(delay) {
      if (isCancelled) return;
      if (timerId) clearTimeout(timerId);
      if (typeof document !== 'undefined' && document.hidden) return;
      timerId = setTimeout(step, delay);
    }

    function step() {
      if (isCancelled) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      if (prefixIndex < cleanPrefix.length) {
        if (prefixIndex === 0) setTypedWord('');
        prefixIndex += 1;
        setTypedPrefix(cleanPrefix.slice(0, prefixIndex));
        scheduleNext(TYPE_PREFIX_SPEED);
        return;
      }

      const currentFullWord = words[wordIndex] || '';

      if (!isDeleting) {
        if (charIndex < currentFullWord.length) {
          charIndex += 1;
          setTypedWord(currentFullWord.slice(0, charIndex));
          scheduleNext(TYPE_WORD_SPEED);
        } else if (words.length > 1) {
          isDeleting = true;
          scheduleNext(PAUSE_BEFORE_DELETE);
        }
      } else {
        if (charIndex > 0) {
          charIndex -= 1;
          setTypedWord(currentFullWord.slice(0, charIndex));
          scheduleNext(DELETE_SPEED);
        } else {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          scheduleNext(PAUSE_BEFORE_NEXT_WORD);
        }
      }
    }

    const handleVisibilityChange = () => {
      if (isCancelled) return;
      if (document.hidden) {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
      } else if (!timerId) {
        scheduleNext(PAUSE_BEFORE_NEXT_WORD);
      }
    };

    scheduleNext(TYPE_PREFIX_SPEED);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isCancelled = true;
      if (timerId) clearTimeout(timerId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [cleanPrefix, words, prefersReducedMotion]);

  return (
    <p className="font-sans-ui max-w-[520px] text-[15px] leading-[1.6] text-[var(--mut)]">
      <span>
        <span>{typedPrefix}</span>
        {typedWord && (
          <>
            <span>&nbsp;</span>
            <b className="font-medium text-[var(--ac)]">{typedWord}</b>
          </>
        )}
      </span>
      <span aria-hidden="true" className="typing-cursor" />
    </p>
  );
}

/**
 * IdentityAndAboutLandingPreview - Renderiza las secciones de Inicio (#inicio)
 * y Sobre mí (#sobre-mi, sin la card del Stack) con el mismo diseño de la landing,
 * colores lisos de fondo y adaptado al contenedor lateral sin recortes.
 */
function IdentityAndAboutLandingPreview({ values }) {
  const {
    full_name = '',
    headline = '',
    bio = '',
    photo_url = '',
    cv_url = '',
    social_links_list = [],
  } = values || {};

  const paragraphs = useMemo(() => {
    if (typeof bio === 'string' && bio.trim()) {
      const split = bio
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (split.length > 0) return split;
    }
    return ABOUT_DATA.paragraphs || [];
  }, [bio]);

  return (
    <div className="flex flex-col">
      {/* 1. Sección Inicio (Hero) fiel a HeroSection.jsx */}
      <section className="relative w-full pb-8 pt-2">
        <div className="grid w-full grid-cols-1 items-center gap-7 @xl:grid-cols-[1.15fr_0.85fr]">
          {/* Columna de texto del Hero */}
          <div className="flex min-w-0 flex-col items-start">
            <p className="font-sans-ui text-[16px] text-[var(--mut)]">
              {PROFILE_DATA.greeting}
            </p>

            <h1 className="font-heading mt-0.5 max-w-full break-words text-[clamp(30px,6.8cqw,52px)] font-bold leading-[1.06] tracking-[-0.02em] text-[var(--tx)]">
              {full_name || PROFILE_DATA.fullName}
            </h1>

            <p className="role my-[8px] font-heading text-[clamp(18px,3.6cqw,25px)] font-medium text-[var(--ac)]">
              {headline || PROFILE_DATA.role}
            </p>

            <HeroPreviewTypewriter />

            {/* Botones principales de la landing */}
            <div className="my-[20px] mb-[16px] flex flex-wrap items-center gap-[10px]">
              <Button variant="primary" className="pointer-events-none !px-4 !py-2.5 !text-[14px]">
                <span>{PROFILE_DATA.primaryCtaLabel}</span>
                <IconSlot size={15} name="hero-arrow-right" />
              </Button>

              <Button variant="secondary" className="pointer-events-none !px-4 !py-2.5 !text-[14px]">
                <span>{PROFILE_DATA.secondaryCtaLabel}</span>
              </Button>
            </div>

            {/* Enlaces de redes sociales y descarga de CV del Hero */}
            <div className="flex flex-wrap items-center gap-[16px] text-[var(--mut)]">
              {(social_links_list || []).map((social, idx) => {
                const socialKey = (
                  social.id ||
                  social.name ||
                  'github'
                ).toLowerCase();
                return (
                  <a
                    key={social.id || idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.name || socialKey}
                    title={social.name || socialKey}
                    className="inline-flex items-center gap-[6px] font-mono-ui text-[12px] text-[var(--mut)] transition-all duration-200 hover:-translate-y-[2px] hover:text-[var(--ac2)]"
                  >
                    <DevIcon name={socialKey} size={19} colored={false} />
                  </a>
                );
              })}

              <a
                href={cv_url || PROFILE_DATA.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-[6px] font-mono-ui text-[12px] text-[var(--mut)] no-underline transition-all duration-200 hover:-translate-y-[2px] hover:text-[var(--ac2)]"
              >
                <IconSlot size={14} name="download-cv" />
                <span>{PROFILE_DATA.cvLabel}</span>
              </a>
            </div>
          </div>

          {/* Columna derecha: Foto de perfil en orbe (.orb con .av) adaptada sin cortes */}
          <div className="flex flex-col items-center justify-center overflow-hidden px-6 py-4">
            <div
              className="orb"
              style={{ width: 'min(200px, 56cqw)' }}
            >
              <div className="orb-disk" aria-hidden="true" />
              <div className="orb-disk d2" aria-hidden="true" />
              <div className="orb-hole" aria-hidden="true" />
              <div className="av">
                {photo_url ? (
                  <img
                    src={photo_url}
                    alt={full_name || PROFILE_DATA.fullName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-[6px] px-2 text-[var(--mut)]">
                    <IconSlot size={42} name="profile-photo-placeholder" />
                    <span className="font-mono-ui text-[9px] text-[var(--mut)]">
                      {PROFILE_DATA.photoPlaceholderLabel || 'Foto del profesional'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sección Sobre mí (sin la parte del Stack) fiel a AboutSection.jsx */}
      <section className="relative w-full border-t border-[var(--bd)]/50 pt-8">
        <SectionHeader
          label={ABOUT_DATA.sectionLabel}
          title={ABOUT_DATA.title}
          subtitle={ABOUT_DATA.subtitle}
        />

        {/* Párrafos de biografía */}
        <div className="flex flex-col">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? 'mb-[14px] max-w-[62ch] font-sans-ui text-[clamp(16.5px,2.4cqw,20px)] leading-[1.55] text-[var(--tx)]'
                  : 'mb-[12px] max-w-[62ch] font-sans-ui text-[15px] leading-[1.6] text-[var(--mut)]'
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Grilla de 3 tarjetas de actitud adaptada al ancho del contenedor */}
        <div className="mt-[22px] grid grid-cols-1 gap-[14px] @2xl:grid-cols-3">
          {ABOUT_DATA.attitudes?.map((attitude) => (
            <AttitudeCard
              key={attitude.id}
              iconId={attitude.id}
              title={attitude.title}
              description={attitude.description}
              iconUrl={attitude.iconUrl}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * StackLandingSection - Renderiza únicamente la card "Stack y herramientas"
 * con el diseño exacto de AboutSection.jsx en la landing page.
 */
function StackLandingSection({ values }) {
  const stack = values?.stack || [];

  return (
    <div data-interactive-card="true" className="card w-full">
      <div className="cb">
        <h3 className="mb-[6px] font-heading text-[24px] font-medium text-white">
          {ABOUT_DATA.stackTitle}
        </h3>
        <p className="font-sans-ui text-[14.5px] text-[#b8bddf]">
          {ABOUT_DATA.stackSubtitle}
        </p>

        <div className="mt-[10px] flex flex-col gap-[12px]">
          {STACK_CATEGORIES.map((cat) => {
            const categoryTechs = stack.filter((t) => t.category === cat.id);
            return (
              <div
                key={cat.id}
                className="mt-[4px] flex flex-wrap items-center gap-x-[12px] gap-y-[10px]"
              >
                <em className="min-w-[120px] font-mono-ui text-[11px] font-medium not-italic uppercase tracking-[0.14em] text-[var(--ac)]">
                  {cat.label}
                </em>
                <div className="flex flex-wrap items-center gap-[10px]">
                  {categoryTechs.length > 0 ? (
                    categoryTechs.map((tech) => (
                      <TechChip
                        key={tech.id}
                        name={tech.name}
                        iconId={tech.icon_key || tech.id}
                        iconUrl={tech.iconUrl}
                        size="lg"
                      />
                    ))
                  ) : (
                    <span className="font-mono-ui text-[11.5px] text-[var(--mut)]/60 italic">
                      Sin tecnologías asignadas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * TrajectoryLandingSection - Renderiza la sección Trayectoria (#trayectoria)
 * con el mismo diseño, filtros y TrajectoryCard de la landing page,
 * adaptada a 1 columna mediante .tl-panel para no cortarse en el panel lateral.
 */
function TrajectoryLandingSection({ values }) {
  const [activeFilter, setActiveFilter] = useState('todo');
  const rawMilestones = values?.milestones;

  const entries = useMemo(() => {
    const milestones = Array.isArray(rawMilestones)
      ? [...rawMilestones].sort(compareMilestonesChronological)
      : [];
    return milestones.map((item, idx) => {
      const isEdu = item.type === 'educacion' || item.type === 'formacion';
      const endLabel = item.current ? 'Actualidad' : item.end_date || '';
      const dateLabel = item.start_date
        ? endLabel && endLabel !== item.start_date
          ? `${item.start_date} — ${endLabel}`
          : item.start_date
        : 'Año / Período';

      return {
        id: item.id || `item-${idx}`,
        type: isEdu ? 'formacion' : 'experiencia',
        typeLabel: isEdu ? 'FORMACIÓN' : 'EXPERIENCIA',
        title: item.title || 'Rol o Título',
        place: item.organization || item.place || 'Organización o Institución',
        description: item.description || '',
        date: dateLabel,
      };
    });
  }, [rawMilestones]);

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'todo') return entries;
    return entries.filter((entry) => entry.type === activeFilter);
  }, [entries, activeFilter]);

  return (
    <section className="relative w-full">
      <SectionHeader
        label={TRAJECTORY_DATA.sectionLabel}
        title={TRAJECTORY_DATA.title}
        subtitle={TRAJECTORY_DATA.subtitle}
      />

      <div
        role="group"
        aria-label="Filtrar trayectoria"
        className="mb-[32px] flex flex-wrap items-center gap-[8px]"
      >
        {TRAJECTORY_DATA.filters?.map((filter) => (
          <FilterPill
            key={filter.id}
            label={filter.label}
            active={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className="!px-[18px] !py-[9px] !text-[14px]"
          />
        ))}
      </div>

      {filteredEntries.length > 0 ? (
        <div className="tl tl-panel">
          <div aria-hidden="true" className="fill" />

          {filteredEntries.map((entry, idx) => (
            <TrajectoryCard
              key={entry.id || idx}
              entry={entry}
              side={idx % 2 === 0 ? 'left' : 'right'}
              index={idx}
              disableAnimation={true}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--bd)] p-6 text-center">
          <p className="font-sans-ui text-[13px] text-[var(--mut)]">
            No hay hitos para mostrar con el filtro seleccionado.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * ProfileLivePreview - Contenedor del contenido de la vista previa del perfil.
 * Renderiza sobre fondo oscuro liso (#000000 / var(--bg)) las secciones de la landing
 * correspondientes a la pestaña activa del formulario, sin selector de sección manual.
 */
function ProfileLivePreview({ activeTab = 'identidad', values }) {
  return (
    <div className="@container w-full overflow-x-hidden rounded-[14px] border border-[var(--bd)]/60 bg-[var(--bg)] p-5 sm:p-6 text-[var(--tx)]">
      {activeTab === 'identidad' && (
        <IdentityAndAboutLandingPreview values={values} />
      )}
      {activeTab === 'stack' && <StackLandingSection values={values} />}
      {activeTab === 'trayectoria' && (
        <TrajectoryLandingSection values={values} />
      )}
    </div>
  );
}

export default function ProfileEditPage() {
  const toast = useToast();
  const [status, setStatus] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('identidad');

  // Estado temporal para agregar un nuevo ítem al Stack desde el catálogo curado
  const [newTechName, setNewTechName] = useState('');
  const [newTechCategory, setNewTechCategory] = useState('frontend');
  const [newTechIcon, setNewTechIcon] = useState('react');

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: '',
      headline: '',
      short_bio: 'Desarrollo software robusto, eficiente, escalable, intuitivo, seguro y mantenible.',
      bio: '',
      photo_url: '',
      location: '',
      contact_email: '',
      cv_url: '',
      stack: [],
      milestones: [],
      social_links_list: [
        { id: 'github', name: 'GitHub', url: 'https://github.com' },
        { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com' },
      ],
    },
  });

  const {
    fields: stackFields,
    append: appendStack,
    remove: removeStack,
    swap: swapStack,
  } = useFieldArray({ control, name: 'stack' });

  const {
    fields: milestoneFields,
    remove: removeMilestone,
  } = useFieldArray({ control, name: 'milestones' });

  const {
    fields: socialFields,
    remove: removeSocial,
  } = useFieldArray({ control, name: 'social_links_list' });

  const { blocker } = useUnsavedChanges(isDirty);

  const loadProfile = useCallback(async () => {
    setStatus('cargando');
    setErrorMsg('');
    try {
      const res = await apiFetch('/profile');
      const data = res?.data || {};

      const expItems = (
        Array.isArray(data.experience) ? data.experience : []
      ).map((m, i) => ({
        id: m.id || `exp-${i}`,
        type: 'experiencia',
        title: m.title || '',
        organization: m.organization || m.place || '',
        start_date:
          m.start_date || (m.date ? m.date.split('—')[0].trim() : '2024'),
        end_date: m.end_date || '',
        current: Boolean(
          m.current ?? m.date?.toLowerCase().includes('actualidad')
        ),
        description: m.description || '',
      }));

      const eduItems = (
        Array.isArray(data.education) ? data.education : []
      ).map((m, i) => ({
        id: m.id || `edu-${i}`,
        type: 'educacion',
        title: m.title || '',
        organization: m.organization || m.place || '',
        start_date:
          m.start_date || (m.date ? m.date.split('—')[0].trim() : '2023'),
        end_date: m.end_date || '',
        current: Boolean(
          m.current ?? m.date?.toLowerCase().includes('actualidad')
        ),
        description: m.description || '',
      }));

      let socialList = [];
      if (Array.isArray(data.social_links)) {
        socialList = data.social_links;
      } else if (data.social_links && typeof data.social_links === 'object') {
        socialList = Object.entries(data.social_links)
          .filter(([, url]) => typeof url === 'string' && url.trim())
          .map(([key, url]) => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            url,
          }));
      }
      if (socialList.length === 0) {
        socialList = [
          { id: 'github', name: 'GitHub', url: 'https://github.com' },
          { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com' },
        ];
      }

      if (res?.data) {
        updatePortfolioProfileCache(res.data);
      }

      reset({
        full_name: data.full_name || '',
        headline: data.headline || '',
        short_bio: data.short_bio || 'Desarrollo software robusto, eficiente, escalable, intuitivo, seguro y mantenible.',
        bio: data.bio || '',
        photo_url: data.photo_url || '',
        location: data.location || '',
        contact_email: data.contact_email || '',
        cv_url: data.cv_url || '',
        stack: Array.isArray(data.stack) ? data.stack : [],
        milestones: [...expItems, ...eduItems].sort(compareMilestonesChronological),
        social_links_list: socialList,
      });
      setStatus('con_datos');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cargar el perfil.');
      setStatus('error');
    }
  }, [reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfile]);

  const watchedValues = useWatch({ control });
  const [importingGitHub, setImportingGitHub] = useState(false);
  const [selectedStackCategory, setSelectedStackCategory] = useState('frontend');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryDropdownOpen]);

  const handleImportGitHubAvatar = async () => {
    setImportingGitHub(true);
    try {
      const githubLink = (watchedValues.social_links_list || []).find(
        (s) => s.url && s.url.toLowerCase().includes('github.com')
      );
      let candidateUser = '';
      if (githubLink?.url) {
        const match = githubLink.url.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
        if (match && match[1]) {
          candidateUser = match[1];
        }
      }

      const profileData = await fetchGitHubProfile(candidateUser);
      if (profileData?.avatar_url) {
        setValue('photo_url', profileData.avatar_url, { shouldDirty: true });
        toast.success(
          `Foto de perfil importada desde GitHub (@${profileData.username || candidateUser || 'configurado'})`
        );
      } else {
        toast.error('No se pudo obtener la imagen de perfil de GitHub.');
      }
    } catch (err) {
      toast.error(
        err.message || 'Error al consultar GitHub API. Verificá la configuración del servidor.'
      );
    } finally {
      setImportingGitHub(false);
    }
  };

  const onSubmit = async (formValues) => {
    try {
      const sortedMilestones = [...formValues.milestones].sort(
        compareMilestonesChronological
      );
      const experience = sortedMilestones.filter(
        (m) => m.type === 'experiencia'
      );
      const education = sortedMilestones.filter(
        (m) => m.type === 'educacion'
      );

      const social_links = {};
      formValues.social_links_list.forEach((item) => {
        const key =
          item.id || item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        social_links[key] = item.url;
      });

      const payload = {
        full_name: formValues.full_name,
        headline: formValues.headline,
        short_bio:
          'Desarrollo software robusto, eficiente, escalable, intuitivo, seguro y mantenible.',
        bio: formValues.bio,
        photo_url: formValues.photo_url || null,
        location: formValues.location,
        contact_email: formValues.contact_email,
        cv_url: formValues.cv_url,
        stack: formValues.stack,
        experience,
        education,
        social_links,
      };

      const res = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res?.data) {
        updatePortfolioProfileCache(res.data);
      }

      reset(formValues);
      toast.success(res?.message || 'Perfil guardado correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al guardar el perfil');
    }
  };

  const handleAddTech = () => {
    const cleanName = newTechName.trim();
    if (!cleanName) {
      toast.error(
        'Ingresá el nombre de la tecnología o seleccioná un ícono del catálogo'
      );
      return;
    }
    const id =
      newTechIcon || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
    appendStack({
      id: `${id}-${Date.now().toString(36).slice(-3)}`,
      name: cleanName,
      category: newTechCategory,
      icon_key: newTechIcon,
    });
    setSelectedStackCategory(newTechCategory);
    setNewTechName('');
  };

  const handleAddMilestone = () => {
    const newMilestone = {
      id: `hito-${Date.now()}`,
      type: 'experiencia',
      title: '',
      organization: '',
      start_date: new Date().getFullYear().toString(),
      end_date: '',
      current: true,
      description: '',
    };
    const currentList = getValues('milestones') || [];
    const sorted = [...currentList, newMilestone].sort(
      compareMilestonesChronological
    );
    setValue('milestones', sorted, { shouldDirty: true });
  };

  const previewTitleByTab = {
    identidad: 'Vista previa — Inicio y Sobre mí',
    stack: 'Vista previa — Stack y herramientas',
    trayectoria: 'Vista previa — Trayectoria',
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error(
          'Revisá los campos con errores antes de guardar el perfil.'
        );
      })}
      noValidate
      className="adm-card flex flex-col gap-5"
    >
      {/* Navegación de las 3 pestañas */}
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="adm-tabs border-b border-[var(--adm-borde)] pb-3.5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`adm-tab ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PESTAÑA 1: Identidad y Presentación (incluye Redes Sociales) */}
      {activeTab === 'identidad' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <ImageUploader
              label="Avatar / Foto profesional"
              value={watchedValues.photo_url || ''}
              onChange={(url) =>
                setValue('photo_url', url, { shouldDirty: true })
              }
              folder="portfolio/profile"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleImportGitHubAvatar}
                disabled={importingGitHub}
                className="adm-btn ghost text-[12px]"
              >
                <DevIcon name="github" size={14} />
                <span>
                  {importingGitHub
                    ? 'Importando de GitHub...'
                    : 'Importar foto de GitHub'}
                </span>
              </button>
              {watchedValues.photo_url && (
                <button
                  type="button"
                  onClick={() =>
                    setValue('photo_url', '', { shouldDirty: true })
                  }
                  className="adm-btn danger-ghost text-[12px]"
                >
                  <Trash2 size={13} />
                  <span>Quitar foto</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-[var(--mut)]">
              Podés subir una imagen directamente a Cloudinary o sincronizar automáticamente la foto oficial desde la cuenta vinculada de GitHub.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="adm-label">Nombre completo *</label>
              <input
                type="text"
                maxLength={120}
                {...register('full_name')}
                placeholder="Ej. Lucas Andrade"
                className="adm-input"
              />
              {errors.full_name && (
                <p className="mt-1 text-[12px] text-[var(--bad)]">
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="adm-label">Titular profesional *</label>
              <input
                type="text"
                maxLength={160}
                {...register('headline')}
                placeholder="Ej. Desarrollador Web Full Stack"
                className="adm-input"
              />
              {errors.headline && (
                <p className="mt-1 text-[12px] text-[var(--bad)]">
                  {errors.headline.message}
                </p>
              )}
            </div>
          </div>



          <div>
            <label className="adm-label">
              Texto extendido «Sobre mí» (Markdown simple — separar párrafos con
              línea en blanco)
            </label>
            <textarea
              rows={6}
              maxLength={5000}
              {...register('bio')}
              placeholder="Escribí tu presentación profesional..."
              className="adm-textarea"
            />
            {errors.bio && (
              <p className="mt-1 text-[12px] text-[var(--bad)]">
                {errors.bio.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="adm-label">Ubicación</label>
              <input
                type="text"
                maxLength={120}
                {...register('location')}
                placeholder="Salta, Argentina"
                className="adm-input"
              />
            </div>

            <div>
              <label className="adm-label">Correo de contacto público *</label>
              <input
                type="email"
                maxLength={100}
                {...register('contact_email')}
                placeholder="contacto@ejemplo.com"
                className="adm-input"
              />
              {errors.contact_email && (
                <p className="mt-1 text-[12px] text-[var(--bad)]">
                  {errors.contact_email.message}
                </p>
              )}
            </div>

            <div>
              <label className="adm-label">URL al CV en PDF</label>
              <input
                type="url"
                maxLength={500}
                {...register('cv_url')}
                placeholder="https://.../cv.pdf"
                className="adm-input"
              />
              {errors.cv_url && (
                <p className="mt-1 text-[12px] text-[var(--bad)]">
                  {errors.cv_url.message}
                </p>
              )}
            </div>
          </div>

          {/* Bloque integrado de Redes Sociales dentro de Identidad y Presentación */}
          <div className="mt-2 flex flex-col gap-4 border-t border-[var(--adm-borde)] pt-5">
            <div>
              <h3 className="adm-h3">
                Enlaces Profesionales y Redes Sociales
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {socialFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 items-start gap-3 rounded-[12px] border border-[var(--adm-borde)] bg-[#090b20] p-3.5 sm:grid-cols-12"
                >
                  <div className="sm:col-span-4">
                    <label className="adm-label">Red / Etiqueta</label>
                    <input
                      type="text"
                      maxLength={50}
                      {...register(`social_links_list.${index}.name`)}
                      placeholder="GitHub / LinkedIn"
                      className="adm-input"
                    />
                    {errors.social_links_list?.[index]?.name && (
                      <p className="mt-1 text-[11px] text-[var(--bad)]">
                        {errors.social_links_list[index].name.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-7">
                    <label className="adm-label">
                      URL completa (https://...)
                    </label>
                    <input
                      type="url"
                      maxLength={300}
                      {...register(`social_links_list.${index}.url`)}
                      placeholder="https://github.com/usuario"
                      className="adm-input"
                    />
                    {errors.social_links_list?.[index]?.url && (
                      <p className="mt-1 text-[11px] text-[var(--bad)]">
                        {errors.social_links_list[index].url.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end justify-end pt-6 sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeSocial(index)}
                      aria-label="Eliminar red social"
                      className="adm-iconbtn danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: Stack Tecnológico */}
      {activeTab === 'stack' && (
        <div className="flex flex-col gap-5">
          <div className="rounded-[14px] border border-[var(--adm-borde)] bg-[#090b20] p-4">
            <h3 className="adm-h3">
              Agregar tecnología al Stack
            </h3>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="adm-label">Nombre visible</label>
                <input
                  type="text"
                  maxLength={80}
                  value={newTechName}
                  onChange={(e) => setNewTechName(e.target.value)}
                  placeholder="Ej. React, PostgreSQL..."
                  className="adm-input"
                />
              </div>

              <div>
                <label className="adm-label">Categoría</label>
                <select
                  value={newTechCategory}
                  onChange={(e) => setNewTechCategory(e.target.value)}
                  className="adm-select"
                >
                  <option value="frontend">Frontend</option>
                  <option value="backend">Backend</option>
                  <option value="database">Base de Datos</option>
                  <option value="tools">Herramientas</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <IconPicker
                mode="tech"
                label="Seleccionar ícono del catálogo curado (Devicon)"
                value={newTechIcon}
                onChange={(key, item) => {
                  setNewTechIcon(key);
                  if (!newTechName.trim() && item?.label) {
                    setNewTechName(item.label);
                  }
                  if (item?.category) {
                    setNewTechCategory(item.category);
                  }
                }}
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleAddTech}
                className="adm-btn secondary sm"
              >
                <Plus size={14} />
                <span>Añadir al Stack</span>
              </button>
            </div>
          </div>

          {/* Lista del Stack: una sola categoría a la vez con selector desplegable */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="adm-h3 !mb-0">
                Tecnologías cargadas ({stackFields.length})
              </h3>

              {/* Botón selector desplegable de categorías al final a la derecha */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                  aria-expanded={isCategoryDropdownOpen}
                  aria-haspopup="listbox"
                  className="adm-btn secondary sm !gap-2 !px-3 !py-1.5 font-mono-ui !text-[12px] min-w-[190px] justify-between"
                >
                  <span className="text-[var(--adm-texto-suave)]">Categoría:</span>
                  <span className="font-semibold text-[var(--ac2)] truncate max-w-[85px]">
                    {CATEGORY_LABELS[selectedStackCategory] || selectedStackCategory}
                  </span>
                  <span className="rounded-full bg-[rgba(var(--ar),0.18)] px-1.5 py-0.2 font-mono-ui text-[11px] text-[var(--ac)]">
                    {
                      stackFields.filter(
                        (item) => item.category === selectedStackCategory
                      ).length
                    }
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${
                      isCategoryDropdownOpen
                        ? 'rotate-180 text-[var(--ac)]'
                        : 'text-[var(--adm-texto-suave)]'
                    }`}
                  />
                </button>

                {/* Menú flotante de categorías con posición fija y animación suave */}
                {isCategoryDropdownOpen && (
                  <div
                    role="listbox"
                    aria-label="Seleccionar categoría de tecnologías"
                    className="absolute right-0 top-full z-30 mt-1.5 w-[210px] origin-top-right overflow-hidden rounded-[12px] border border-[var(--adm-borde)] bg-[#0c0d22] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2 py-1 font-mono-ui text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--adm-texto-suave)]/70">
                      Categorías
                    </div>
                    {STACK_CATEGORIES.map((cat) => {
                      const count = stackFields.filter(
                        (item) => item.category === cat.id
                      ).length;
                      const isSelected = selectedStackCategory === cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedStackCategory(cat.id);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-[12.5px] transition-colors ${
                            isSelected
                              ? 'bg-[var(--adm-acento)] font-medium text-white'
                              : 'text-[var(--adm-texto)] hover:bg-white/[0.06]'
                          }`}
                        >
                          <span>{CATEGORY_LABELS[cat.id] || cat.label}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-mono-ui text-[11px] ${
                              isSelected
                                ? 'bg-black/30 font-semibold text-white'
                                : 'bg-[rgba(var(--ar),0.12)] text-[var(--ac)]'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {stackFields.length === 0 ? (
              <div className="adm-empty rounded-[14px] border border-dashed border-[var(--adm-borde)]">
                <strong>No hay tecnologías cargadas</strong>
                Usá el selector superior para agregar la primera.
              </div>
            ) : (() => {
              const activeCategoryItems = stackFields
                .map((field, globalIndex) => ({ field, globalIndex }))
                .filter((item) => item.field.category === selectedStackCategory);

              return (
                <div className="flex flex-col gap-2 rounded-[14px] border border-[var(--adm-borde)] bg-[#090b20] p-3.5">
                  <div className="flex items-center justify-between border-b border-[var(--adm-borde)]/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-ui text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ac2)]">
                        {CATEGORY_LABELS[selectedStackCategory] || selectedStackCategory}
                      </span>
                      <span className="rounded-full bg-[rgba(var(--ar),0.12)] px-2 py-0.5 font-mono-ui text-[11px] font-medium text-[var(--ac)]">
                        {activeCategoryItems.length}
                      </span>
                    </div>
                  </div>

                  {activeCategoryItems.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="font-mono-ui text-[12.5px] italic text-[var(--adm-texto-suave)]/70">
                        No hay tecnologías registradas en la categoría{' '}
                        <strong className="not-italic text-[var(--ac2)]">
                          {CATEGORY_LABELS[selectedStackCategory] || selectedStackCategory}
                        </strong>.
                      </p>
                      <p className="mt-1 text-[11.5px] text-[var(--adm-texto-suave)]/50">
                        Podés agregar una nueva seleccionando esta categoría arriba.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--adm-borde)]/50 overflow-hidden rounded-[10px] border border-[var(--adm-borde)]/60 bg-[var(--adm-superficie)]">
                      {activeCategoryItems.map((item, catIndex) => (
                        <div
                          key={item.field.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2.5">
                            <DevIcon
                              name={item.field.icon_key || item.field.name}
                              size={18}
                            />
                            <span className="text-[13.5px] font-medium text-[var(--adm-texto)]">
                              {item.field.name}
                            </span>
                          </div>

                          <div className="adm-order">
                            <button
                              type="button"
                              disabled={catIndex === 0}
                              onClick={() =>
                                swapStack(
                                  item.globalIndex,
                                  activeCategoryItems[catIndex - 1].globalIndex
                                )
                              }
                              aria-label={`Subir ${item.field.name} en ${CATEGORY_LABELS[selectedStackCategory] || selectedStackCategory}`}
                              title={
                                catIndex === 0
                                  ? 'Primer elemento de la categoría'
                                  : 'Subir en esta categoría'
                              }
                              className="adm-iconbtn"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              disabled={catIndex === activeCategoryItems.length - 1}
                              onClick={() =>
                                swapStack(
                                  item.globalIndex,
                                  activeCategoryItems[catIndex + 1].globalIndex
                                )
                              }
                              aria-label={`Bajar ${item.field.name} en ${CATEGORY_LABELS[selectedStackCategory] || selectedStackCategory}`}
                              title={
                                catIndex === activeCategoryItems.length - 1
                                  ? 'Último elemento de la categoría'
                                  : 'Bajar en esta categoría'
                              }
                              className="adm-iconbtn"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStack(item.globalIndex)}
                              aria-label={`Quitar ${item.field.name}`}
                              title="Quitar tecnología"
                              className="adm-iconbtn danger"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Trayectoria — Experiencia y Educación */}
      {activeTab === 'trayectoria' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="adm-h3">Hitos de Experiencia y Educación</h3>
              <p className="adm-sub">
                Los hitos se ordenan cronológicamente de forma automática (los más actuales arriba y los menos actuales abajo).
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="adm-btn secondary sm"
            >
              <Plus size={14} />
              <span>Nuevo hito</span>
            </button>
          </div>

          {milestoneFields.length === 0 ? (
            <div className="adm-empty rounded-[14px] border border-dashed border-[var(--adm-borde)]">
              <strong>No hay hitos cargados en tu trayectoria</strong>
              Agregá tu primer hito de experiencia o educación.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {milestoneFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex flex-col gap-3 rounded-[14px] border border-[var(--adm-borde)] bg-[#090b20] p-4"
                >
                  <div className="flex items-center justify-between border-b border-[var(--adm-borde)] pb-2.5">
                    <span className="adm-eyebrow !text-[var(--ac2)]">
                      Hito #{index + 1}
                    </span>
                    <div className="adm-order">
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        aria-label="Eliminar hito"
                        title="Eliminar hito"
                        className="adm-iconbtn danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="adm-label">Tipo</label>
                      <select
                        {...register(`milestones.${index}.type`)}
                        className="adm-select"
                      >
                        <option value="experiencia">Experiencia</option>
                        <option value="educacion">Educación</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="adm-label">Rol o Título *</label>
                      <input
                        type="text"
                        maxLength={140}
                        {...register(`milestones.${index}.title`)}
                        placeholder="Ej. Desarrollador Full Stack"
                        className="adm-input"
                      />
                      {errors.milestones?.[index]?.title && (
                        <p className="mt-1 text-[11px] text-[var(--bad)]">
                          {errors.milestones[index].title.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="adm-label">
                        Organización / Institución *
                      </label>
                      <input
                        type="text"
                        maxLength={140}
                        {...register(`milestones.${index}.organization`)}
                        placeholder="Empresa o Universidad"
                        className="adm-input"
                      />
                      {errors.milestones?.[index]?.organization && (
                        <p className="mt-1 text-[11px] text-[var(--bad)]">
                          {errors.milestones[index].organization.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="adm-label">Inicio *</label>
                      <input
                        type="text"
                        maxLength={40}
                        {...register(`milestones.${index}.start_date`)}
                        placeholder="2024"
                        className="adm-input"
                      />
                      {errors.milestones?.[index]?.start_date && (
                        <p className="mt-1 text-[11px] text-[var(--bad)]">
                          {errors.milestones[index].start_date.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="adm-label">Fin</label>
                      <input
                        type="text"
                        maxLength={40}
                        {...register(`milestones.${index}.end_date`)}
                        disabled={watchedValues.milestones?.[index]?.current}
                        placeholder="2025"
                        className="adm-input disabled:opacity-50"
                      />
                      <label className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--adm-texto-suave)]">
                        <input
                          type="checkbox"
                          {...register(`milestones.${index}.current`)}
                          className="accent-[var(--ac)]"
                        />
                        <span>En curso (Actualidad)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="adm-label">Descripción breve</label>
                    <textarea
                      rows={2}
                      maxLength={600}
                      {...register(`milestones.${index}.description`)}
                      placeholder="Principales logros o materias..."
                      className="adm-textarea !min-h-[68px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Barra inferior de guardado */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--adm-borde)] pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="adm-btn primary"
        >
          <Save size={15} />
          <span>
            {isSubmitting
              ? 'Guardando perfil...'
              : 'Guardar cambios del perfil'}
          </span>
        </button>
      </div>
    </form>
  );

  const previewContent = (
    <ProfileLivePreview activeTab={activeTab} values={watchedValues} />
  );

  return (
    <div id="v-perfil" className="adm-view is-on flex flex-col gap-5">
      <div className="adm-pagehead">
        <div className="adm-pagehead-left">
          <span className="adm-planet-orb" aria-hidden="true" />
          <div>
            <h1 className="adm-h1">Edición del Perfil Profesional</h1>
            <p className="adm-sub">
              Administrá tu identidad, stack tecnológico curado y trayectoria
              en tiempo real.
            </p>
          </div>
        </div>
      </div>

      <DataState
        status={status}
        skeletonType="form"
        errorMessage={errorMsg}
        onRetry={loadProfile}
      >
        <LivePreviewLayout
          formContent={formContent}
          previewContent={previewContent}
          previewTitle={
            previewTitleByTab[activeTab] || 'Vista previa en vivo'
          }
        />
      </DataState>

      <UnsavedChangesModal blocker={blocker} />
    </div>
  );
}
