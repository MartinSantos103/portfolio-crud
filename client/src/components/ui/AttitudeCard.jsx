import IconSlot from './IconSlot.jsx';

/**
 * Tarjeta de actitud en la sección Sobre mí.
 * - Fila con padding 20 px, 16 px de separación, centrada en vertical, radio 16 px, borde 1 px --borde
 * - Tile cuadrado de 44 px (radio 12 px, fondo --acento al 15 %) con espacio de icono de 22 px
 * - Columna de título (Space Grotesk 500, 18 px) y descripción (Inter 400, 14 px, interlineado 21 px) de 296 px de ancho
 */
export default function AttitudeCard({ title, description, iconId = 'attitude', iconUrl = null }) {
  return (
    <article
      data-interactive-card="true"
      className="flex items-center gap-[16px] rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] p-[20px]"
    >
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[var(--tile-icono-bg)] text-[var(--acento)]">
        <IconSlot size={22} name={`attitude-${iconId}`} iconUrl={iconUrl} />
      </div>
      <div className="flex w-full max-w-[296px] flex-col gap-[4px]">
        <h3 className="font-heading text-[18px] font-medium leading-[1.3] text-[var(--texto)]">
          {title}
        </h3>
        <p className="font-sans-ui text-[14px] font-normal leading-[21px] text-[var(--texto-suave)]">
          {description}
        </p>
      </div>
    </article>
  );
}
