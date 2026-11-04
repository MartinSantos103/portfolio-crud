import { useState, useMemo } from 'react';
import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import FilterPill from '../../../components/ui/FilterPill.jsx';
import TrajectoryCard from '../../../components/ui/TrajectoryCard.jsx';

export default function TrajectorySection({
  trajectory,
  disableAnimation = false,
  compact = false,
}) {
  const [activeFilter, setActiveFilter] = useState('todo');

  const filteredEntries = useMemo(() => {
    const entries = trajectory.entries || [];
    if (activeFilter === 'todo') return entries;
    return entries.filter((entry) => entry.type === activeFilter);
  }, [trajectory.entries, activeFilter]);

  return (
    <section
      id="trayectoria"
      className={`relative z-10 w-full ${compact ? 'py-6' : 'py-[80px] lg:py-[110px]'}`}
    >
      <div
        className={`mx-auto w-full max-w-[1440px] ${
          compact ? 'px-4' : 'px-[24px] sm:px-[64px] xl:px-[160px]'
        }`}
      >
        {!compact && (
          <SectionHeader
            label={trajectory.sectionLabel}
            title={trajectory.title}
            subtitle={trajectory.subtitle}
          />
        )}

        <div
          role="group"
          aria-label="Filtrar trayectoria"
          className="mb-[36px] flex flex-wrap items-center gap-[10px]"
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

        <div className="relative flex flex-col gap-[32px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 bottom-0 left-1/2 hidden w-[2px] -translate-x-1/2 bg-[var(--borde)] lg:block"
          />

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
              disableAnimation={disableAnimation}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
