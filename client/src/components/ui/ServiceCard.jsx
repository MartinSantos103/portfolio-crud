import { motion as Motion, useReducedMotion } from 'framer-motion';
import IconSlot from './IconSlot.jsx';
import Button from './Button.jsx';

/**
 * ServiceCardView - Componente Presentacional Puro (Sección 4.2.3).
 * Consumido por la sección pública de Servicios y por el Live Preview de /admin/servicios.
 */
export function ServiceCardView({
  service = {},
  ctaLabel = 'Solicitar cotización',
  onRequestQuote,
}) {
  const iconName = service.icon
    ? `service-${service.icon}`
    : `service-${service.id || 'sitios-landing'}`;

  return (
    <div className="flex h-full flex-col gap-[20px] rounded-[20px] border border-[var(--borde)] bg-[var(--superficie)] p-[32px]">
      <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--tile-icono-bg)] text-[var(--acento)]">
        <IconSlot size={28} name={iconName} iconUrl={service.iconUrl} />
      </div>

      <h3 className="font-heading text-[24px] font-bold leading-[1.25] tracking-[-0.3px] text-[var(--texto)]">
        {service.title || 'Título del servicio'}
      </h3>

      <p className="font-sans-ui text-[15px] font-normal leading-[24px] text-[var(--texto-suave)]">
        {service.description || 'Descripción concisa del servicio profesional.'}
      </p>

      {Array.isArray(service.items) && service.items.filter(Boolean).length > 0 && (
        <ul className="flex flex-col gap-[10px]">
          {service.items.filter(Boolean).map((itemText, idx) => (
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
    </div>
  );
}

export default function ServiceCard({
  service,
  ctaLabel = 'Solicitar cotización',
  onRequestQuote,
  index = 0,
  disableAnimation = false,
}) {
  const prefersReducedMotion = useReducedMotion();

  if (disableAnimation || prefersReducedMotion) {
    return (
      <article data-interactive-card="true" className="h-full">
        <ServiceCardView
          service={service}
          ctaLabel={ctaLabel}
          onRequestQuote={onRequestQuote}
        />
      </article>
    );
  }

  return (
    <Motion.article
      data-interactive-card="true"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <ServiceCardView
        service={service}
        ctaLabel={ctaLabel}
        onRequestQuote={onRequestQuote}
      />
    </Motion.article>
  );
}
