/**
 * Pastilla de filtro para la sección Trayectoria.
 * - Tipografía: Inter 500, 14 px
 * - Radio: 999 px (píldora)
 * - Padding: 8 px vertical y 18 px horizontal
 * - Activo: fondo --acento y texto --sobre-acento
 * - Inactivo: borde 1 px --borde y fondo --superficie, texto --texto-suave
 */
export default function FilterPill({ label, active = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-sans-ui cursor-pointer rounded-full px-[18px] py-[8px] text-[14px] font-medium transition-colors duration-200 ${
        active
          ? 'border border-[var(--acento)] bg-[var(--acento)] text-[var(--sobre-acento)]'
          : 'border border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto-suave)] hover:border-[var(--acento)] hover:text-[var(--texto)]'
      } ${className}`}
    >
      {label}
    </button>
  );
}
