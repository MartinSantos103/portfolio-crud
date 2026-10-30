/**
 * Encabezado de sección reutilizable.
 * Tres líneas con 12 px de separación entre ellas y 56 px hacia el contenido inferior:
 * 1. Etiqueta numerada (JetBrains Mono 500, 13 px, espaciado 2 px, mayúsculas, --acento)
 * 2. Título de sección (Space Grotesk 700, 44 px, -0.8 px, --texto)
 * 3. Subtítulo de sección (Inter 400, 18 px, interlineado 28 px, --texto-suave, máx 640 px)
 */
export default function SectionHeader({ label, title, subtitle, className = '' }) {
  return (
    <div className={`mb-[56px] flex flex-col gap-[12px] ${className}`}>
      {label && (
        <span className="font-mono-ui text-[13px] font-medium uppercase tracking-[2px] text-[var(--acento)]">
          {label}
        </span>
      )}
      {title && (
        <h2 className="font-heading text-[34px] font-bold leading-[1.15] tracking-[-0.8px] text-[var(--texto)] sm:text-[44px]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans-ui max-w-[640px] text-[18px] font-normal leading-[28px] text-[var(--texto-suave)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
