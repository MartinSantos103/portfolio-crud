/**
 * Encabezado de sección reutilizable según el prototipo Portfolio_animado_v4.html:
 * - Etiqueta (.ey) con estrella (✦) en JetBrains Mono, mayúsculas y color --ac
 * - Título de sección en Bricolage Grotesque 700, clamp(32px, 5vw, 46px)
 * - Subtítulo en DM Sans, color --mut
 */
export default function SectionHeader({ label, title, subtitle, className = '' }) {
  return (
    <div className={`mb-[28px] flex flex-col ${className}`}>
      {label && <p className="ey">{label}</p>}
      {title && (
        <h2 className="my-[8px] font-heading text-[clamp(32px,5vw,46px)] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--tx)]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="font-sans-ui max-w-[64ch] text-[16px] text-[var(--mut)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
