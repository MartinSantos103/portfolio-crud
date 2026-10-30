import { motion as Motion, useReducedMotion } from 'framer-motion';
import IconSlot from './IconSlot.jsx';
import Button from './Button.jsx';

/**
 * Tarjeta de servicio reutilizable.
 * - Columna con padding 32 px y 20 px entre elementos, radio 20 px, borde 1 px --borde.
 * - Tile de 56 px (radio 14 px, fondo --acento al 15 %) con icono de 28 px.
 * - Título: Space Grotesk 700, 24 px, -0.3 px.
 * - Descripción: Inter 400, 15 px, interlineado 24 px, --texto-suave.
 * - Lista de 3 ítems: cada ítem es una fila con tilde de 16 px y texto (Inter 500, 14 px), 10 px de separación, y 10 px entre ítems.
 * - Botón secundario de ancho completo (Inter 600, 15 px) con "Solicitar cotización" y flecha de 16 px.
 */
export default function ServiceCard({
  service,
  ctaLabel = 'Solicitar cotización',
  onRequestQuote,
  index = 0,
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Motion.article
      data-interactive-card="true"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col gap-[20px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-[32px]"
    >
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--tile-icono-bg)] text-[var(--acento)]">
        <IconSlot size={28} name={`service-${service.id}`} iconUrl={service.iconUrl} />
      </div>

      <h3 className="font-heading text-[24px] font-bold leading-[1.25] tracking-[-0.3px] text-[var(--texto)]">
        {service.title}
      </h3>

      <p className="font-sans-ui text-[15px] font-normal leading-[24px] text-[var(--texto-suave)]">
        {service.description}
      </p>

      {Array.isArray(service.items) && service.items.length > 0 && (
        <ul className="flex flex-col gap-[10px]">
          {service.items.map((itemText, idx) => (
            <li
              key={idx}
              className="font-sans-ui flex items-center gap-[10px] text-[14px] font-medium text-[var(--texto)]"
            >
              <span className="inline-flex text-[var(--acento)]">
                <IconSlot size={16} name="check" />
              </span>
              <span>{itemText}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-[4px]">
        <Button
          variant="secondary"
          size="service"
          fullWidth
          onClick={() => onRequestQuote?.(service)}
        >
          <span>{ctaLabel}</span>
          <IconSlot size={16} name="arrow-right" />
        </Button>
      </div>
    </Motion.article>
  );
}
