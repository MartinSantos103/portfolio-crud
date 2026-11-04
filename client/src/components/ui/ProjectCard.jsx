import { motion as Motion, useReducedMotion } from 'framer-motion';
import IconSlot from './IconSlot.jsx';
import TechChip from './TechChip.jsx';

/**
 * Maqueta decorativa de ventana de navegador para la vista previa de proyectos
 * cuando no hay imagen de Cloudinary cargada.
 */
function BrowserMockup({ variant = 'store' }) {
  return (
    <div className="flex h-full w-full flex-col rounded-t-[12px] border-x border-t border-[var(--borde)] bg-[var(--fondo)] p-[14px]">
      <div className="mb-[14px] flex items-center gap-[5px]">
        <span className="h-[6px] w-[6px] rounded-full bg-[var(--borde)]" />
        <span className="h-[6px] w-[6px] rounded-full bg-[var(--borde)]" />
        <span className="h-[6px] w-[6px] rounded-full bg-[var(--borde)]" />
      </div>

      {variant === 'store' && (
        <div className="flex flex-1 flex-col justify-between gap-[10px]">
          <div className="flex flex-col gap-[8px]">
            <div className="h-[12px] w-[42%] rounded-[4px] bg-[var(--acento)] opacity-85" />
            <div className="h-[6px] w-full rounded-[4px] bg-[var(--superficie-alta)]" />
            <div className="h-[6px] w-[68%] rounded-[4px] bg-[var(--superficie-alta)]" />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-[10px] pt-[4px]">
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
          </div>
        </div>
      )}

      {variant === 'cards' && (
        <div className="flex flex-1 flex-col justify-between gap-[12px]">
          <div className="grid h-[58px] grid-cols-3 gap-[10px]">
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
            <div className="rounded-[6px] bg-[var(--superficie-alta)]" />
          </div>
          <div className="flex flex-col gap-[8px] pb-[6px]">
            <div className="h-[8px] w-full rounded-[4px] bg-[var(--superficie-alta)]" />
            <div className="h-[6px] w-[54%] rounded-[4px] bg-[var(--acento)] opacity-80" />
          </div>
        </div>
      )}

      {variant === 'chart' && (
        <div className="flex flex-1 flex-col justify-end gap-[10px] pb-[6px]">
          <div className="flex h-[84px] items-end gap-[10px] pr-[30%]">
            <div className="h-[42%] flex-1 rounded-t-[4px] bg-[var(--acento)] opacity-80" />
            <div className="h-[66%] flex-1 rounded-t-[4px] bg-[var(--acento)] opacity-85" />
            <div className="h-[95%] flex-1 rounded-t-[4px] bg-[var(--acento)]" />
            <div className="h-[58%] flex-1 rounded-t-[4px] bg-[var(--acento)] opacity-80" />
            <div className="h-[82%] flex-1 rounded-t-[4px] bg-[var(--acento)] opacity-90" />
          </div>
          <div className="h-[6px] w-[58%] rounded-[4px] bg-[var(--superficie-alta)]" />
        </div>
      )}
    </div>
  );
}

/**
 * ProjectCardView - Componente Presentacional Puro (Sección 4.2.3).
 * No ejecuta llamadas a la API, no monta animaciones de scroll ni dispara analítica.
 * Es consumido tanto por la tarjeta pública como por el Live Preview de /admin/proyectos.
 */
export function ProjectCardView({
  project = {},
  technologies = [],
  isAuthenticated = false,
  lockBadgeLabel = 'Detalle con sesión',
  onSelect,
}) {
  return (
    <div
      onClick={() => onSelect?.(project)}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(project);
              }
            }
          : undefined
      }
      className="group flex min-h-[368px] w-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-0 text-left transition-colors duration-200 hover:border-[var(--acento)] focus:outline-none focus-visible:border-[var(--acento)]"
    >
      {/* Zona de vista previa: 200 px de alto fijo */}
      <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-[var(--superficie-alta)] px-[24px] pt-[24px] pb-0">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.title || 'Portada del proyecto'}
            className="absolute inset-0 h-[200px] w-full object-cover"
          />
        ) : (
          <BrowserMockup variant={project.mockupVariant || 'store'} />
        )}

        {/* Insignia de candado: visible solo cuando no hay sesión iniciada */}
        {!isAuthenticated && (
          <div className="font-mono-ui absolute top-[12px] right-[12px] z-10 inline-flex items-center gap-[6px] rounded-full border border-[var(--borde)] bg-[var(--insignia-candado-bg)] px-[10px] py-[4px] text-[11px] font-medium text-[var(--texto-suave)] backdrop-blur-xs">
            <IconSlot size={12} name="lock-badge" />
            <span>{lockBadgeLabel}</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="flex flex-1 flex-col gap-[12px] px-[22px] pt-[20px] pb-[22px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-[20px] font-medium leading-[1.3] text-[var(--texto)] transition-colors group-hover:text-[var(--acento-hover)]">
            {project.title || 'Título del proyecto'}
          </h3>
          {project.featured && (
            <span className="font-mono-ui shrink-0 rounded-md border border-[var(--borde)] bg-[var(--superficie-alta)] px-2 py-0.5 text-[10px] font-medium text-[var(--acento-texto)]">
              Destacado
            </span>
          )}
        </div>

        <p className="font-sans-ui line-clamp-3 text-[14px] font-normal leading-[22px] text-[var(--texto-suave)]">
          {project.description || project.summary || 'Descripción breve del proyecto para visitantes.'}
        </p>

        <div
          className="mt-auto flex flex-wrap gap-[8px] pt-[4px]"
          onClick={(e) => e.stopPropagation()}
        >
          {technologies.map((tech) => (
            <TechChip
              key={tech.id || tech.name}
              name={tech.name || tech}
              iconId={tech.icon_key || tech.id || tech.name || tech}
              iconUrl={tech.iconUrl}
              size="sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectCard({
  project,
  technologies = [],
  isAuthenticated = false,
  lockBadgeLabel = 'Detalle con sesión',
  onSelect,
  index = 0,
  disableAnimation = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  if (disableAnimation || prefersReducedMotion) {
    return (
      <article data-interactive-card="true" className="w-full">
        <ProjectCardView
          project={project}
          technologies={technologies}
          isAuthenticated={isAuthenticated}
          lockBadgeLabel={lockBadgeLabel}
          onSelect={onSelect}
        />
      </article>
    );
  }

  return (
    <Motion.article
      data-interactive-card="true"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <ProjectCardView
        project={project}
        technologies={technologies}
        isAuthenticated={isAuthenticated}
        lockBadgeLabel={lockBadgeLabel}
        onSelect={onSelect}
      />
    </Motion.article>
  );
}
