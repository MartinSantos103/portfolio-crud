import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StarfieldCanvas from '../../../components/ui/StarfieldCanvas.jsx';
import Navbar from '../../../components/layout/Navbar.jsx';
import Footer from '../../../components/layout/Footer.jsx';
import Button from '../../../components/ui/Button.jsx';
import TechChip from '../../../components/ui/TechChip.jsx';
import IconSlot from '../../../components/ui/IconSlot.jsx';
import DemoViewer from '../../demos/DemoViewer.jsx';
import { usePortfolioData } from '../../public/hooks/usePortfolioData.js';
import { resolveTechnologies } from '../../public/data/portfolioData.js';
import { apiFetch } from '../../../services/api.js';
import { trackPortfolioEvent } from '../../../services/analytics.js';

/**
 * Renderizador seguro de Markdown simple (párrafos, viñetas, negritas y código en línea)
 * sin dangerouslySetInnerHTML para prevenir XSS (Regla 5.3.B).
 */
export function SimpleMarkdownBlock({ text }) {
  if (!text || !String(text).trim()) return null;

  const lines = String(text).split(/\r?\n/);
  const blocks = [];
  let currentList = [];

  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono-ui rounded bg-[var(--bg2)] px-1.5 py-0.5 text-[13px] text-[var(--ac2)]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line) {
      if (currentList.length > 0) {
        blocks.push({ type: 'ul', items: [...currentList], key: `ul-${idx}` });
        currentList = [];
      }
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.slice(2));
    } else {
      if (currentList.length > 0) {
        blocks.push({ type: 'ul', items: [...currentList], key: `ul-${idx}` });
        currentList = [];
      }
      blocks.push({ type: 'p', content: line, key: `p-${idx}` });
    }
  });

  if (currentList.length > 0) {
    blocks.push({ type: 'ul', items: currentList, key: 'ul-final' });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {blocks.map((b) =>
        b.type === 'ul' ? (
          <ul
            key={b.key}
            className="font-sans-ui list-disc space-y-1.5 pl-5 text-[14.5px] leading-[1.6] text-[#c5cae9]"
          >
            {b.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        ) : (
          <p
            key={b.key}
            className="font-sans-ui text-[14.5px] font-normal leading-[1.6] text-[#c5cae9]"
          >
            {renderInline(b.content)}
          </p>
        )
      )}
    </div>
  );
}

/**
 * ProjectDetailView - Componente Presentacional Puro (Sección 4.2.3).
 * Implementa el diseño exacto de #pd-section de Portfolio_animado_v4.html:
 * - Escenario superior (.pd-stage) con agujero negro (.pd-bh, .pd-disk, .pd-hole)
 * - Ventana (.pd-window) con imagen 16:9 (.has-img) o maqueta estática (.pd-dots, .pd-bar, .pd-grid-mock)
 * - 3 cajas (.pd-box): 01 / EL PROBLEMA, 02 / LA SOLUCIÓN, 03 / DECISIONES TÉCNICAS
 * - Tecnologías utilizadas, galería, demos y botones de acción.
 */
export function ProjectDetailView({
  project = {},
  technologies = [],
  demos = [],
}) {
  const images = Array.isArray(project.images) ? project.images : [];
  const hasImage = Boolean(project.cover_image_url);
  const slugLabel = (project.slug || project.title || 'PROYECTO')
    .toString()
    .toUpperCase();

  return (
    <article
      data-interactive-card="true"
      className="card pd-card overflow-hidden"
    >
      {/* Escenario superior con Agujero Negro y Mockup estático / Imagen */}
      <div className="pd-stage">
        <div className="pd-bh" aria-hidden="true">
          <div className="pd-disk" />
          <div className="pd-hole" />
        </div>

        <div className={`pd-window ${hasImage ? 'has-img' : ''}`}>
          {hasImage ? (
            <img
              src={project.cover_image_url}
              alt={project.title || 'Portada del proyecto'}
              className="pd-img"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <>
              <div className="pd-dots">
                <i />
                <i />
                <i />
              </div>
              <div className="pd-bar" />
              <div className="pd-grid-mock">
                <i />
                <i />
                <i />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo del detalle técnico (.pd-body) */}
      <div className="cb px-[20px] py-[26px] sm:px-[34px] sm:py-[36px]">
        <p className="ey mb-[10px] tracking-[0.18em]">
          DETALLE TÉCNICO DE PROYECTO / {slugLabel}
        </p>

        <h1 className="mb-[12px] font-heading text-[clamp(30px,4.6vw,46px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
          {project.title || 'Título del proyecto'}
        </h1>

        <p className="mb-[28px] max-w-[68ch] font-sans-ui text-[clamp(16px,2vw,18.5px)] leading-[1.6] text-[#d6daf0]">
          {project.description || project.summary || 'Resumen general del proyecto.'}
        </p>

        {/* Tarjetas 01 / 02 / 03 */}
        <div className="mb-[30px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
          <div className="card pd-box">
            <div className="cb !p-[22px]">
              <p className="ey mb-[10px] !text-[11px] !tracking-[0.15em] !text-[var(--ac2)]">
                01 / EL PROBLEMA
              </p>
              <SimpleMarkdownBlock
                text={project.problem || 'Sin especificación cargada.'}
              />
            </div>
          </div>

          <div className="card pd-box">
            <div className="cb !p-[22px]">
              <p className="ey mb-[10px] !text-[11px] !tracking-[0.15em] !text-[var(--ac2)]">
                02 / LA SOLUCIÓN
              </p>
              <SimpleMarkdownBlock
                text={project.solution || 'Sin especificación cargada.'}
              />
            </div>
          </div>

          <div className="card pd-box">
            <div className="cb !p-[22px]">
              <p className="ey mb-[10px] !text-[11px] !tracking-[0.15em] !text-[var(--ac2)]">
                03 / DECISIONES TÉCNICAS
              </p>
              <SimpleMarkdownBlock
                text={project.tech_decisions || 'Sin especificación cargada.'}
              />
            </div>
          </div>
        </div>

        {/* Tecnologías utilizadas */}
        <div className="mb-[28px]">
          <p className="mb-[14px] font-mono-ui text-[11.5px] font-medium uppercase tracking-[0.16em] text-[var(--mut)]">
            TECNOLOGÍAS UTILIZADAS
          </p>
          <div className="flex flex-wrap gap-[10px]">
            {technologies.map((tech) => (
              <TechChip
                key={tech.id || tech.name}
                name={tech.name || tech}
                iconId={tech.icon_key || tech.id || tech.name || tech}
                iconUrl={tech.iconUrl}
                size="lg"
              />
            ))}
          </div>
        </div>

        {/* Galería de imágenes secundarias */}
        {images.length > 0 && (
          <div className="mb-[28px] flex flex-col gap-3">
            <p className="font-mono-ui text-[11.5px] font-medium uppercase tracking-[0.16em] text-[var(--mut)]">
              GALERÍA DEL PROYECTO
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="overflow-hidden rounded-[14px] border border-[var(--bd)] bg-[var(--bg)]"
                >
                  <img
                    src={img.url}
                    alt={img.alt || `${project.title} captura ${idx + 1}`}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Demos interactivas asociadas */}
        {Array.isArray(demos) && demos.length > 0 && (
          <div className="mb-[28px] flex flex-col gap-4">
            <p className="font-mono-ui text-[11.5px] font-medium uppercase tracking-[0.16em] text-[var(--mut)]">
              DEMOSTRACIONES INTERACTIVAS
            </p>
            <div className="flex flex-col gap-6">
              {demos.map((demo, idx) => (
                <DemoViewer key={demo.id || idx} demo={demo} />
              ))}
            </div>
          </div>
        )}

        {/* Acciones inferiores (.pd-actions) */}
        <div className="mt-[8px] flex flex-wrap items-center gap-[12px] border-t border-[var(--bd)] pt-[22px]">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer"
              className="btn p"
            >
              <span>Ver demo en vivo</span>
              <IconSlot size={16} name="external-demo" />
            </a>
          )}
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              <span>Repositorio GitHub</span>
              <IconSlot size={17} name="repo-github" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Contenedor de página pública (/proyectos/:id) para usuarios con sesión activa.
 * Soporta el botón atrás del navegador y el botón "Volver a Proyectos".
 */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { navLinks, profile, projectsSection, technologies, footer } = usePortfolioData();
  const [remoteProject, setRemoteProject] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    trackPortfolioEvent({
      type: 'project_view',
      path: `/proyectos/${id}`,
      projectId: Number(id),
    });

    apiFetch(`/projects/${id}`)
      .then((res) => {
        if (isMounted && res?.data) {
          setRemoteProject(res.data);
        }
      })
      .catch(() => {
        // Fallback al listado cargado en memoria
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const project =
    remoteProject ||
    projectsSection.items?.find(
      (item) => String(item.id) === String(id) || String(item.slug) === String(id)
    ) ||
    projectsSection.items?.[0];

  if (!project) {
    return null;
  }

  const projectTechs = resolveTechnologies(
    project.technologies || project.technologyIds || [],
    technologies
  );

  const handleBackToProjects = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/proyectos');
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--tx)]">
      <StarfieldCanvas />
      <Navbar developerName={profile.fullName} navLinks={navLinks} />

      <main className="relative z-10 mx-auto w-full max-w-[980px] px-[20px] pt-[104px] pb-[60px]">
        <section id="pd-section" aria-live="polite" className="!p-0">
          <div className="mb-[22px] flex items-center justify-start">
            <Button
              variant="secondary"
              onClick={handleBackToProjects}
              className="!rounded-[12px] !bg-[rgba(10,12,27,0.78)] !px-[18px] !py-[10px] !text-[14.5px] backdrop-blur-md"
            >
              <IconSlot size={16} name="arrow-left" />
              <span>Volver a Proyectos</span>
            </Button>
          </div>

          <ProjectDetailView
            project={project}
            technologies={projectTechs}
            demos={project.demos || []}
          />
        </section>
      </main>

      <Footer copyright={footer.copyright} socialLinks={profile.socialLinks} />
    </div>
  );
}
