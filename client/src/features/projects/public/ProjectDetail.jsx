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
          <strong key={i} className="font-semibold text-[var(--texto)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="font-mono-ui rounded bg-[var(--superficie-alta)] px-1.5 py-0.5 text-[13px] text-[var(--acento-texto)]"
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
    <div className="flex flex-col gap-3">
      {blocks.map((b) =>
        b.type === 'ul' ? (
          <ul
            key={b.key}
            className="font-sans-ui list-disc space-y-1.5 pl-5 text-[15px] leading-[24px] text-[var(--texto-suave)]"
          >
            {b.items.map((item, i) => (
              <li key={i}>{renderInline(item)}</li>
            ))}
          </ul>
        ) : (
          <p
            key={b.key}
            className="font-sans-ui text-[15px] font-normal leading-[25px] text-[var(--texto-suave)]"
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
 * Recibe absolutamente todos sus datos por props. No llama a la API, no monta
 * el fondo de estrellas ni dispara eventos de analítica.
 */
export function ProjectDetailView({
  project = {},
  technologies = [],
  demos = [],
}) {
  const images = Array.isArray(project.images) ? project.images : [];
  const hasTechSections =
    Boolean(project.problem?.trim()) ||
    Boolean(project.solution?.trim()) ||
    Boolean(project.tech_decisions?.trim());

  return (
    <article
      data-interactive-card="true"
      className="overflow-hidden rounded-[24px] border border-[var(--borde)] bg-[var(--superficie)]"
    >
      {/* Zona de portada / imagen Cloudinary */}
      <div className="relative flex h-[240px] w-full items-center justify-center bg-[var(--superficie-alta)] p-[24px] sm:h-[340px]">
        {project.cover_image_url ? (
          <img
            src={project.cover_image_url}
            alt={project.title || 'Portada del proyecto'}
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

      <div className="flex flex-col gap-[24px] p-[24px] sm:p-[36px]">
        <div className="flex flex-col gap-[10px]">
          <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[2px] text-[var(--acento-texto)]">
            DETALLE TÉCNICO DE PROYECTO {project.slug ? `/ ${project.slug}` : ''}
          </span>
          <h1 className="font-heading text-[28px] font-bold tracking-[-0.8px] text-[var(--texto)] sm:text-[38px]">
            {project.title || 'Título del proyecto'}
          </h1>
        </div>

        <p className="font-sans-ui max-w-[820px] text-[17px] font-normal leading-[27px] text-[var(--texto)]">
          {project.description || project.summary || 'Resumen general del proyecto.'}
        </p>

        {/* Tres secciones de detalle exclusivo para usuarios registrados */}
        {hasTechSections && (
          <div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-3">
            <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--fondo)] p-5">
              <span className="font-mono-ui mb-2 block text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--acento-texto)]">
                01 / EL PROBLEMA
              </span>
              <SimpleMarkdownBlock
                text={project.problem || 'Sin especificación cargada.'}
              />
            </div>

            <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--fondo)] p-5">
              <span className="font-mono-ui mb-2 block text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--acento-texto)]">
                02 / LA SOLUCIÓN
              </span>
              <SimpleMarkdownBlock
                text={project.solution || 'Sin especificación cargada.'}
              />
            </div>

            <div className="rounded-[16px] border border-[var(--borde)] bg-[var(--fondo)] p-5">
              <span className="font-mono-ui mb-2 block text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--acento-texto)]">
                03 / DECISIONES TÉCNICAS
              </span>
              <SimpleMarkdownBlock
                text={project.tech_decisions || 'Sin especificación cargada.'}
              />
            </div>
          </div>
        )}

        {/* Tecnologías utilizadas */}
        <div className="flex flex-col gap-[12px]">
          <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento-texto)]">
            TECNOLOGÍAS UTILIZADAS
          </span>
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
          <div className="flex flex-col gap-3 pt-2">
            <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento-texto)]">
              GALERÍA DEL PROYECTO
            </span>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, idx) => (
                <div
                  key={img.id || idx}
                  className="overflow-hidden rounded-[14px] border border-[var(--borde)] bg-[var(--fondo)]"
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
          <div className="flex flex-col gap-4 pt-2">
            <span className="font-mono-ui text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento-texto)]">
              DEMOSTRACIONES INTERACTIVAS
            </span>
            <div className="flex flex-col gap-6">
              {demos.map((demo, idx) => (
                <DemoViewer key={demo.id || idx} demo={demo} />
              ))}
            </div>
          </div>
        )}

        {/* Enlaces al repositorio y despliegue */}
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
  );
}

/**
 * Contenedor de página pública (/proyectos/:id) para usuarios con sesión activa.
 */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { navLinks, profile, projectsSection, technologies, footer } = usePortfolioData();
  const [remoteProject, setRemoteProject] = useState(null);

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
    projectsSection.items?.find((item) => String(item.id) === String(id)) ||
    projectsSection.items?.[0];

  if (!project) {
    return null;
  }

  const projectTechs = resolveTechnologies(
    project.technologies || project.technologyIds || [],
    technologies
  );

  return (
    <div className="relative min-h-screen bg-[var(--fondo)] text-[var(--texto)]">
      <StarfieldCanvas />
      <Navbar developerName={profile.fullName} navLinks={navLinks} />

      <main className="relative z-10 mx-auto w-full max-w-[1440px] px-[24px] pt-[128px] pb-[110px] sm:px-[64px] xl:px-[160px]">
        <div className="mb-[32px]">
          <Button variant="secondary" onClick={() => navigate('/#proyectos')}>
            <IconSlot size={16} name="arrow-left" />
            <span>Volver a Proyectos</span>
          </Button>
        </div>

        <ProjectDetailView
          project={project}
          technologies={projectTechs}
          demos={project.demos || []}
        />
      </main>

      <Footer copyright={footer.copyright} socialLinks={profile.socialLinks} />
    </div>
  );
}
