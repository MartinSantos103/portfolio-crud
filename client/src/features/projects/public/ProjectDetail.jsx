import { useParams, useNavigate } from 'react-router-dom';
import StarfieldCanvas from '../../../components/ui/StarfieldCanvas.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Footer from '../../../components/layout/Footer.jsx';
import Button from '../../../components/ui/Button.jsx';
import TechChip from '../../../components/ui/TechChip.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import { usePortfolioData } from '../../public/hooks/usePortfolioData.js';
import { resolveTechnologies } from '../../public/data/portfolioData.js';

/**
 * Página de detalle de proyecto (/proyectos/:id) para usuarios con sesión activa.
 */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { navLinks, profile, projectsSection, technologies, footer } = usePortfolioData();

  const project =
    projectsSection.items?.find((item) => String(item.id) === String(id)) ||
    projectsSection.items?.[0];

  if (!project) {
    return null;
  }

  const projectTechs = resolveTechnologies(
    project.technologyIds || project.technologies || [],
    technologies
  );

  return (
    <div className="relative min-h-screen bg-[var(--fondo)] text-[var(--texto)]">
      <StarfieldCanvas />
      <Navbar developerName={profile.fullName} navLinks={navLinks} />

      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-[24px] pt-[128px] pb-[110px] sm:px-[64px] xl:px-[160px]">
        <div className="mb-[32px]">
          <Button variant="secondary" onClick={() => navigate('/#proyectos')}>
            <span>← Volver a Proyectos</span>
          </Button>
        </div>

        <article
          data-interactive-card="true"
          className="overflow-hidden rounded-[24px] border border-[var(--borde)] bg-[var(--superficie)]"
        >
          {/* Zona de vista previa / imagen Cloudinary */}
          <div className="relative flex h-[280px] w-full items-center justify-center bg-[var(--superficie-alta)] p-[32px] sm:h-[380px]">
            {project.cover_image_url ? (
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full max-w-[760px] flex-col rounded-[16px] border border-[var(--borde)] bg-[var(--fondo)] p-[24px]">
                <div className="mb-[20px] flex items-center gap-[6px]">
                  <span className="h-[8px] w-[8px] rounded-full bg-[var(--borde)]" />
                  <span className="h-[8px] w-[8px] rounded-full bg-[var(--borde)]" />
                  <span className="h-[8px] w-[8px] rounded-full bg-[var(--borde)]" />
                </div>
                <div className="flex flex-1 flex-col justify-between gap-[16px]">
                  <div className="h-[16px] w-[40%] rounded-[6px] bg-[var(--acento)] opacity-85" />
                  <div className="grid flex-1 grid-cols-3 gap-[16px]">
                    <div className="rounded-[8px] bg-[var(--superficie-alta)]" />
                    <div className="rounded-[8px] bg-[var(--superficie-alta)]" />
                    <div className="rounded-[8px] bg-[var(--superficie-alta)]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-[24px] p-[28px] sm:p-[40px]">
            <div className="flex flex-col gap-[12px]">
              <span className="font-mono-ui text-[13px] font-medium uppercase tracking-[2px] text-[var(--acento)]">
                DETALLE DE PROYECTO / #{project.id}
              </span>
              <h1 className="font-heading text-[34px] font-bold tracking-[-0.8px] text-[var(--texto)] sm:text-[44px]">
                {project.title}
              </h1>
            </div>

            <p className="font-sans-ui max-w-[780px] text-[18px] font-normal leading-[28px] text-[var(--texto)]">
              {project.description || project.summary}
            </p>

            <div className="flex flex-col gap-[12px]">
              <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento)]">
                TECNOLOGÍAS UTILIZADAS
              </span>
              <div className="flex flex-wrap gap-[12px]">
                {projectTechs.map((tech) => (
                  <TechChip
                    key={tech.id}
                    name={tech.name}
                    iconId={tech.id}
                    iconUrl={tech.iconUrl}
                    size="lg"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-[16px] pt-[8px]">
              {project.live_url && (
                <a href={project.live_url} target="_blank" rel="noreferrer">
                  <Button variant="primary">
                    <span>Ver demo en vivo</span>
                    <IconSlot size={18} name="external-demo" />
                  </Button>
                </a>
              )}
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noreferrer">
                  <Button variant="secondary">
                    <span>Repositorio GitHub</span>
                    <IconSlot size={18} name="repo-github" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </article>
      </main>

      <Footer copyright={footer.copyright} socialLinks={profile.socialLinks} />
    </div>
  );
}
