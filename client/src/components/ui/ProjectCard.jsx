import { motion as Motion, useReducedMotion } from 'framer-motion';
import IconSlot from './IconSlot.jsx';
import TechChip from './TechChip.jsx';

/**
 * ProjectCardView - Componente Presentacional Puro (Sección 4.2.3).
 * Vista previa de proyectos según Portfolio_animado_v4.html:
 * - Sin efectos animados en la vista previa (.pv estático)
 * - Imagen 16:9 opcional por proyecto (.pv.has-img); si no hay imagen, recuadro liso (#07091a) con 3 puntos
 * - Insignia superior derecha (.lock / .lock.u)
 */
export function ProjectCardView({
  project = {},
  technologies = [],
  isAuthenticated = false,
  lockBadgeLabel = 'Ver detalle técnico',
  onSelect,
  index = 0,
}) {
  const hasImage = Boolean(project.cover_image_url);
  const projectNumber = String(index + 1).padStart(2, '0');

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
      className="card group flex h-full w-full cursor-pointer flex-col text-left focus:outline-none"
    >
      {/* Insignia de detalle técnico / candado */}
      <span className={`lock ${isAuthenticated ? 'u' : ''}`}>
        <IconSlot size={10} name={isAuthenticated ? 'check' : 'lock-badge'} />
        <span>{isAuthenticated ? 'Detalle disponible' : lockBadgeLabel}</span>
      </span>

      {/* Zona de vista previa estática: 16:9 cuando hay imagen, o recuadro liso de 112px */}
      <div className={`pv w-full shrink-0 ${hasImage ? 'has-img' : ''}`}>
        <div className="d">
          <i />
          <i />
          <i />
        </div>
        {!hasImage && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[8px] left-[50px] font-mono-ui text-[10px] font-medium tracking-[0.16em] text-[var(--ac2)] opacity-75"
          >
            {projectNumber}
          </span>
        )}
        {hasImage && (
          <img
            src={project.cover_image_url}
            alt={project.title || 'Portada del proyecto'}
            loading="lazy"
            decoding="async"
          />
        )}
      </div>

      {/* Cuerpo de la tarjeta (.cb) */}
      <div className="cb flex flex-1 flex-col">
        <div className="mb-[6px] flex items-start justify-between gap-2">
          <h3 className="font-heading text-[19px] font-medium leading-[1.2] text-white transition-colors group-hover:text-[var(--ac2)]">
            {project.title || 'Título del proyecto'}
          </h3>
          {project.featured && (
            <span className="font-mono-ui shrink-0 rounded-md border border-[var(--bd)] bg-[var(--bg2)] px-2 py-0.5 text-[10px] font-medium text-[var(--ac2)]">
              ★ Destacado
            </span>
          )}
        </div>

        <p className="font-sans-ui line-clamp-3 text-[14.5px] leading-[1.55] text-[#b8bddf]">
          {project.summary || project.description || 'Descripción breve del proyecto para visitantes.'}
        </p>

        <div
          className="mt-auto flex flex-wrap gap-[6px] pt-[12px]"
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
  lockBadgeLabel = 'Ver detalle técnico',
  onSelect,
  index = 0,
  disableAnimation = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  if (disableAnimation || prefersReducedMotion) {
    return (
      <article data-interactive-card="true" className="h-full w-full">
        <ProjectCardView
          project={project}
          technologies={technologies}
          isAuthenticated={isAuthenticated}
          lockBadgeLabel={lockBadgeLabel}
          onSelect={onSelect}
          index={index}
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
      className="h-full w-full"
    >
      <ProjectCardView
        project={project}
        technologies={technologies}
        isAuthenticated={isAuthenticated}
        lockBadgeLabel={lockBadgeLabel}
        onSelect={onSelect}
        index={index}
      />
    </Motion.article>
  );
}
