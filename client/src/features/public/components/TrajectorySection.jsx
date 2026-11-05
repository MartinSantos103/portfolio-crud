import { useState, useMemo, useRef, useEffect } from 'react';
import SectionHeader from '../../../components/ui/SectionHeader.jsx';
import FilterPill from '../../../components/ui/FilterPill.jsx';
import TrajectoryCard from '../../../components/ui/TrajectoryCard.jsx';

export default function TrajectorySection({
  trajectory,
  disableAnimation = false,
  compact = false,
}) {
  const [activeFilter, setActiveFilter] = useState('todo');
  const tlRef = useRef(null);
  const fillRef = useRef(null);

  const filteredEntries = useMemo(() => {
    const entries = trajectory.entries || [];
    if (activeFilter === 'todo') return entries;
    return entries.filter((entry) => entry.type === activeFilter);
  }, [trajectory.entries, activeFilter]);

  useEffect(() => {
    const tlEl = tlRef.current;
    const fillEl = fillRef.current;
    if (!tlEl || !fillEl) return;

    const updateTimelineProgress = () => {
      const rect = tlEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const p = Math.min(1, Math.max(0, (vh * 0.65 - rect.top) / Math.max(rect.height, 1)));
      fillEl.style.height = `calc(${p * 100}% - 12px)`;

      const items = tlEl.querySelectorAll('.it');
      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        item.classList.toggle('act', itemRect.top < vh * 0.65);
      });
    };

    updateTimelineProgress();
    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    window.addEventListener('resize', updateTimelineProgress);
    return () => {
      window.removeEventListener('scroll', updateTimelineProgress);
      window.removeEventListener('resize', updateTimelineProgress);
    };
  }, [filteredEntries]);

  return (
    <section
      id="trayectoria"
      className={`relative z-10 w-full ${compact ? 'py-6' : 'py-[72px] lg:py-[90px]'}`}
    >
      <div
        className={`mx-auto w-full max-w-[1080px] ${
          compact ? 'px-4' : 'px-[20px]'
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
          className="mb-[48px] flex flex-wrap items-center gap-[8px]"
        >
          {trajectory.filters?.map((filter) => (
            <FilterPill
              key={filter.id}
              label={filter.label}
              active={activeFilter === filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className="!px-[24px] !py-[12px] !text-[15px]"
            />
          ))}
        </div>

        <div ref={tlRef} className="tl">
          <div ref={fillRef} aria-hidden="true" className="fill" />

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
