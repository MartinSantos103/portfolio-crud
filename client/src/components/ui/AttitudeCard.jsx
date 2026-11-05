import IconSlot from './IconSlot.jsx';

/**
 * Tarjeta de actitud en la sección Sobre mí (.card .cb .vc).
 * - Usa el contenedor cósmico .card con .cb y .vc
 * - Ícono de 40x40 px en .ic con fondo rgba(var(--ar), 0.16) y color --ac2
 */
export default function AttitudeCard({ title, description, iconId = 'attitude', iconUrl = null }) {
  return (
    <article data-interactive-card="true" className="card">
      <div className="cb flex items-start gap-[14px]">
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--tile-icono-bg)] text-[var(--ac2)]">
          <IconSlot size={20} name={`attitude-${iconId}`} iconUrl={iconUrl} />
        </div>
        <div className="flex flex-col">
          <h3 className="mb-[6px] font-heading text-[19px] font-medium leading-[1.2] text-white">
            {title}
          </h3>
          <p className="font-sans-ui text-[14.5px] leading-[1.55] text-[#b8bddf]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
}
