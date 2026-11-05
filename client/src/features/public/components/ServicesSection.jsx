import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import ServiceCard from '../../../components/ui/ServiceCard.jsx';

/**
 * Sección 04 / SERVICIOS según el prototipo Portfolio_animado_v4.html.
 */
export default function ServicesSection({ servicesSection, onRequestQuote }) {
  return (
    <section id="servicios" className="relative z-10 w-full py-[72px] lg:py-[90px]">
      <div className="mx-auto w-full max-w-[1080px] px-[20px]">
        <SectionHeader
          label={servicesSection.sectionLabel}
          title={servicesSection.title}
          subtitle={servicesSection.subtitle}
        />

        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-3">
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
