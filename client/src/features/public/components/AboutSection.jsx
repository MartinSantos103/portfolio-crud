import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import AttitudeCard from '../../../components/ui/AttitudeCard.jsx';
import TechChip from '../../../components/ui/TechChip.jsx';

/**
 * Sección 01 / SOBRE MÍ según el prototipo Portfolio_animado_v4.html:
 * - Eyebrow (.ey), título (h2), subtítulo (.sub)
 * - Tres párrafos (.p1 de mayor jerarquía y dos .p2 en --mut)
 * - Grilla de 3 tarjetas de actitudes (.grid .g3)
 * - Tarjeta de ancho completo para "Stack y herramientas" con filas por categoría
 */
export default function AboutSection({
  about,
  technologies = [],
  stackCategories = [],
}) {
  return (
    <section id="sobre-mi" className="relative z-10 w-full py-[72px] lg:py-[90px]">
      <div className="mx-auto w-full max-w-[1080px] px-[20px]">
        <SectionHeader
          label={about.sectionLabel}
          title={about.title}
          subtitle={about.subtitle}
        />

        {/* Párrafos de biografía */}
        <div className="flex flex-col">
          {about.paragraphs?.map((paragraph, index) => (
            <p
              key={index}
              className={
                index === 0
                  ? 'mb-[14px] max-w-[62ch] font-sans-ui text-[clamp(18px,2.6vw,22px)] leading-[1.55] text-[var(--tx)]'
                  : 'mb-[12px] max-w-[62ch] font-sans-ui text-[16px] leading-[1.6] text-[var(--mut)]'
              }
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Grilla de 3 tarjetas de actitud */}
        <div className="mt-[26px] grid grid-cols-1 gap-[16px] md:grid-cols-3">
          {about.attitudes?.map((attitude) => (
            <AttitudeCard
              key={attitude.id}
              iconId={attitude.id}
              title={attitude.title}
              description={attitude.description}
              iconUrl={attitude.iconUrl}
            />
          ))}
        </div>

        {/* Tarjeta Stack y herramientas */}
        <div data-interactive-card="true" className="card mt-[22px]">
          <div className="cb">
            <h3 className="mb-[6px] font-heading text-[24px] font-medium text-white">
              {about.stackTitle}
            </h3>
            <p className="font-sans-ui text-[14.5px] text-[#b8bddf]">
              {about.stackSubtitle}
            </p>

            <div className="mt-[10px] flex flex-col gap-[12px]">
              {stackCategories.map((cat) => {
                const categoryTechs = technologies.filter(
                  (t) => t.category === cat.id
                );
                return (
                  <div
                    key={cat.id}
                    className="mt-[4px] flex flex-wrap items-center gap-x-[12px] gap-y-[10px]"
                  >
                    <em className="min-w-[120px] font-mono-ui text-[11px] font-medium not-italic uppercase tracking-[0.14em] text-[var(--ac)]">
                      {cat.label}
                    </em>
                    <div className="flex flex-wrap items-center gap-[10px]">
                      {categoryTechs.map((tech) => (
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
