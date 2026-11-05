import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import ProjectCard from '../../../components/ui/ProjectCard.jsx';
import { resolveTechnologies } from '../data/portfolioData.js';

/**
 * Sección 03 / PROYECTOS según el prototipo Portfolio_animado_v4.html.
 */
export default function ProjectsSection({
  projectsSection,
  technologies = [],
  isAuthenticated = false,
  onSelectProject,
}) {
  return (
    <section id="proyectos" className="relative z-10 w-full py-[72px] lg:py-[90px]">
      <div className="mx-auto w-full max-w-[1080px] px-[20px]">
        <SectionHeader
          label={projectsSection.sectionLabel}
          title={projectsSection.title}
          subtitle={projectsSection.subtitle}
        />

        <div id="pj" className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
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
                lockBadgeLabel={projectsSection.lockBadgeLabel || 'Ver detalle técnico'}
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
