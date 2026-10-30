import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import AttitudeCard from '../../../components/ui/AttitudeCard.jsx';
import TechChip from '../../../components/ui/TechChip.jsx';

/**
 * Sección 01 / SOBRE MÍ.
 * - Padding vertical: 110 px arriba y abajo, márgenes laterales 160 px (1120 px centrado).
 * - Encabezado de sección + dos bloques apilados:
 *   1. Primera fila con 64 px entre columnas:
 *      - Izquierda: columna flexible con 3 párrafos y 20 px entre ellos
 *        (1º párrafo Inter 400 20 px / 32 px --texto; 2º y 3º Inter 400 17 px / 28 px --texto-suave).
 *      - Derecha: columna de 400 px con 3 tarjetas de actitud apiladas, 16 px entre ellas.
 *   2. Segundo bloque ("Stack y herramientas"):
 *      - Tarjeta de ancho completo con padding 40 px, radio 24 px, fondo --superficie al 60 %,
 *        borde 1 px --borde y 28 px entre sus elementos.
 *      - Título (Space Grotesk 700, 28 px, -0.4 px) con subtítulo (Inter 400, 16 px, --texto-suave).
 *      - Cuatro filas de categoría (Frontend, Backend, Base de datos, Herramientas):
 *        cada fila centrada en vertical con nombre de categoría en columna fija de 140 px
 *        (JetBrains Mono 500, 12 px, espaciado 1.5 px, mayúsculas, --acento), 24 px de separación
 *        y a su derecha los chips de tecnología grandes con 12 px de separación entre chips.
 */
export default function AboutSection({
  about,
  technologies = [],
  stackCategories = [],
}) {
  return (
    <section id="sobre-mi" className="relative z-10 w-full py-[80px] lg:py-[110px]">
      <div className="mx-auto w-full max-w-[1440px] px-[24px] sm:px-[64px] xl:px-[160px]">
        <SectionHeader
          label={about.sectionLabel}
          title={about.title}
          subtitle={about.subtitle}
        />

        <div className="flex flex-col gap-[64px]">
          {/* Primera fila: textos a la izquierda y 3 tarjetas de actitud a la derecha (64 px entre columnas) */}
          <div className="flex flex-col items-start gap-[40px] lg:flex-row lg:gap-[64px]">
            {/* Columna izquierda flexible: 3 párrafos con 20 px entre ellos */}
            <div className="flex flex-1 flex-col gap-[20px]">
              {about.paragraphs?.map((paragraph, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? 'font-sans-ui text-[20px] font-normal leading-[32px] text-[var(--texto)]'
                      : 'font-sans-ui text-[17px] font-normal leading-[28px] text-[var(--texto-suave)]'
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Columna derecha de 400 px: 3 tarjetas de actitud apiladas con 16 px entre ellas */}
            <div className="flex w-full shrink-0 flex-col gap-[16px] lg:w-[400px]">
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
          </div>

          {/* Segundo bloque: tarjeta Stack y herramientas */}
          <div
            data-interactive-card="true"
            className="flex w-full flex-col gap-[28px] rounded-[24px] border border-[var(--borde)] bg-[var(--stack-bloque-bg)] p-[24px] sm:p-[40px]"
          >
            <div className="flex flex-col gap-[6px]">
              <h3 className="font-heading text-[28px] font-bold leading-[1.2] tracking-[-0.4px] text-[var(--texto)]">
                {about.stackTitle}
              </h3>
              <p className="font-sans-ui text-[16px] font-normal text-[var(--texto-suave)]">
                {about.stackSubtitle}
              </p>
            </div>

            <div className="flex flex-col gap-[24px]">
              {stackCategories.map((cat) => {
                const categoryTechs = technologies.filter(
                  (t) => t.category === cat.id
                );
                return (
                  <div
                    key={cat.id}
                    className="flex flex-col items-start gap-[12px] sm:flex-row sm:items-center sm:gap-[24px]"
                  >
                    <span className="font-mono-ui w-[140px] shrink-0 text-[12px] font-medium uppercase tracking-[1.5px] text-[var(--acento)]">
                      {cat.label}
                    </span>
                    <div className="flex flex-wrap items-center gap-[12px]">
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
