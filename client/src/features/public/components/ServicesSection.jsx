import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import ServiceCard from '../../../components/ui/ServiceCard.jsx';

/**
 * Sección 04 / SERVICIOS.
 * - Encabezado de sección
 * - Fila de 3 tarjetas con 24 px de separación y la misma altura (2 columnas en tablet, 1 en celular).
 * - El botón "Solicitar cotización" baja a Contacto y deja preseleccionado ese servicio en el formulario.
 */
export default function ServicesSection({ servicesSection, onRequestQuote }) {
  return (
    <section id="servicios" className="relative z-10 w-full py-[80px] lg:py-[110px]">
      <div className="mx-auto w-full max-w-[1440px] px-[24px] sm:px-[64px] xl:px-[160px]">
        <SectionHeader
          label={servicesSection.sectionLabel}
          title={servicesSection.title}
          subtitle={servicesSection.subtitle}
        />

        <div className="grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-3">
          {servicesSection.items?.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              ctaLabel={servicesSection.ctaLabel}
              onRequestQuote={onRequestQuote}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
