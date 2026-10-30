import IconSlot from './IconSlot.jsx';

/**
 * Chip de tecnología en tamaño grande ('lg') y chico ('sm').
 * - Grande: icono 20 px, separación 10 px, JetBrains Mono 500 13 px, padding 10px 16px 10px 14px, radio 12 px.
 * - Chico: icono 14 px, separación 6 px, JetBrains Mono 500 12 px, padding 6px 10px 6px 8px, radio 8 px.
 * - Hover: se eleva, borde pasa a --acento, fondo a --superficie-alta y sombra violeta.
 */
export default function TechChip({
  name,
  iconUrl = null,
  iconId = 'tech',
  size = 'lg',
  className = '',
}) {
  const isSmall = size === 'sm';

  return (
    <span
      className={`tech-chip inline-flex items-center select-none ${
        isSmall
          ? 'gap-[6px] rounded-[8px] pt-[6px] pr-[10px] pb-[6px] pl-[8px] text-[12px] leading-none'
          : 'gap-[10px] rounded-[12px] pt-[10px] pr-[16px] pb-[10px] pl-[14px] text-[13px] leading-none'
      } ${className}`}
    >
      <IconSlot
        size={isSmall ? 14 : 20}
        name={`tech-${iconId || name}`}
        iconUrl={iconUrl}
        className="text-[var(--texto-suave)]"
      />
      <span>{name}</span>
    </span>
  );
}
