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
    <div className="card flex h-full flex-col">
      <div className="cb flex h-full flex-col">
        <div className="mb-[12px] flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--tile-icono-bg)] text-[var(--ac2)]">
          <IconSlot size={20} name={iconName} iconUrl={service.iconUrl} />
        </div>

        <h3 className="mb-[6px] font-heading text-[19px] font-medium leading-[1.2] text-white">
          {service.title || 'Título del servicio'}
        </h3>

        <p className="font-sans-ui text-[14.5px] leading-[1.55] text-[#b8bddf]">
          {service.description || 'Descripción concisa del servicio profesional.'}
        </p>

        {Array.isArray(service.items) && service.items.filter(Boolean).length > 0 && (
          <ul className="my-[14px] flex flex-col gap-[6px] p-0">
            {service.items.filter(Boolean).map((itemText, idx) => (
              <li
                key={idx}
                className="font-sans-ui flex items-center gap-[8px] text-[13.5px] text-[var(--tx)]"
              >
                <span className="inline-flex shrink-0 text-[var(--ac)]">
                  <IconSlot size={14} name="check" />
                </span>
                <span>{itemText}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto pt-[6px]">
          <Button
            variant="secondary"
            size="service"
            fullWidth
            onClick={() => onRequestQuote?.(service)}
          >
            <span>{ctaLabel}</span>
            <IconSlot size={15} name="arrow-right" />
          </Button>
        </div>
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
