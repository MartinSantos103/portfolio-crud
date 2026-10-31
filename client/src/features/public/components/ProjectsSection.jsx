import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import ProjectCard from '../../../components/ui/ProjectCard.jsx';
import { resolveTechnologies } from '../data/portfolioData.js';

/**
 * Sección 03 / PROYECTOS.
 * - Encabezado de sección
 * - Grilla de 3 columnas por 2 filas en escritorio (>= 1024px), 2 columnas en tablet y 1 en celular, con 24 px de separación.
 * - Las tarjetas de una misma fila tienen la misma altura.
 * - Sin sesión iniciada, al tocar una tarjeta se abre el login emergente y luego redirige a ese proyecto.
 * - Con sesión iniciada, abre la página de detalle del proyecto (/proyectos/:id).
 */
export default function ProjectsSection({
  projectsSection,
  technologies = [],
  isAuthenticated = false,
  onSelectProject,
}) {
  return (
    <section id="proyectos" className="relative z-10 w-full py-[80px] lg:py-[110px]">
      <div className="mx-auto w-full max-w-[1440px] px-[24px] sm:px-[64px] xl:px-[160px]">
        <SectionHeader
          label={projectsSection.sectionLabel}
          title={projectsSection.title}
          subtitle={projectsSection.subtitle}
        />

        <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
          {projectsSection.items?.map((project, index) => {
            const projectTechs = resolveTechnologies(
              project.technologyIds || project.technologies || [],
              technologies
            );
            return (
              <ProjectCard
                key={project.id}
                project={project}
                technologies={projectTechs}
                isAuthenticated={isAuthenticated}
                lockBadgeLabel={projectsSection.lockBadgeLabel}
                onSelect={onSelectProject}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
