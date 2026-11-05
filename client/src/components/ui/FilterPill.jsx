/**
 * Pastilla de filtro para la sección Trayectoria y barras de herramientas.
 * - Tipografía: DM Sans (--font-sans), 14 px
 * - Radio: 999 px (píldora)
 * - Activo: fondo --ac y texto #0a0c1b
 * - Inactivo: borde 1 px --bd y fondo --bg2, texto --mut
 */
export default function FilterPill({ label, active = false, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`fbtn ${active ? 'on' : ''} ${className}`}
    >
      {label}
    </button>
  );
}
