import { useState, useMemo } from 'react';
import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import FilterPill from '../../../components/ui/FilterPill.jsx';
import TrajectoryCard from '../../../components/ui/TrajectoryCard.jsx';

/**
 * Sección 02 / TRAYECTORIA.
 * - Encabezado de sección
 * - Fila de 3 filtros en píldora con 10 px de separación (Todo, Formación, Experiencia)
 * - Línea de tiempo: columna de entradas con 40 px entre ellas y línea vertical de 2 px en --borde por el centro
 * - Las entradas alternan de lado (izquierda / derecha) y en móvil pasan a un solo lado.
 */
export default function TrajectorySection({ trajectory }) {
  const [activeFilter, setActiveFilter] = useState('todo');

  const filteredEntries = useMemo(() => {
    const entries = trajectory.entries || [];
    if (activeFilter === 'todo') return entries;
    return entries.filter((entry) => entry.type === activeFilter);
  }, [trajectory.entries, activeFilter]);

  return (
    <section id="trayectoria" className="relative z-10 w-full py-[80px] lg:py-[110px]">
      <div className="mx-auto w-full max-w-[1440px] px-[24px] sm:px-[64px] xl:px-[160px]">
        <SectionHeader
          label={trajectory.sectionLabel}
          title={trajectory.title}
          subtitle={trajectory.subtitle}
        />

        {/* Fila de tres filtros en píldora con 10 px de separación */}
        <div
          role="group"
          aria-label="Filtrar trayectoria"
          className="mb-[48px] flex flex-wrap items-center gap-[10px]"
        >
          {trajectory.filters?.map((filter) => (
            <FilterPill
              key={filter.id}
              label={filter.label}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
            />
          ))}
        </div>

        {/* Línea de tiempo con línea vertical de 2 px en --borde */}
        <div className="relative flex flex-col gap-[40px]">
          {/* Línea central en escritorio (>= 1024px) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-[2px] -translate-x-1/2 bg-[var(--borde)] lg:block"
          />

          {/* Línea lateral en móvil/tablet (< 1024px) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-[17px] block w-[2px] bg-[var(--borde)] lg:hidden"
          />

          {filteredEntries.map((entry, idx) => (
            <TrajectoryCard
              key={entry.id || idx}
              entry={entry}
              side={idx % 2 === 0 ? 'left' : 'right'}
              index={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
