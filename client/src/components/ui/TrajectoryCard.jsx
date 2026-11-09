import { motion as Motion, useReducedMotion } from 'framer-motion';
import IconSlot from './IconSlot.jsx';

export default function TrajectoryCard({
  entry,
  side = 'left',
  index = 0,
  disableAnimation = false,
}) {
  const prefersReducedMotion = useReducedMotion();
  const isLeft = side === 'left';
  const isFormacion = entry.type === 'formacion' || entry.type === 'educacion';
  const sideClass = isLeft ? 'lf' : 'rt';

  const content = (
    <>
      <span className="dot" aria-hidden="true" />
      <p className="yr">{entry.date}</p>
      <div data-interactive-card="true" className="card">
        <div className="cb px-4 py-4 sm:!px-[30px] sm:!py-[26px]">
          <span className="tag mb-[10px]">
            <IconSlot
              size={12}
              name={isFormacion ? 'formacion' : 'experiencia'}
              strokeWidth={2}
            />
            <span>{entry.typeLabel || (isFormacion ? 'Formación' : 'Experiencia')}</span>
          </span>
          <h3 className="mb-[4px] font-heading text-[clamp(20px,2.4vw,25px)] font-bold leading-[1.2] text-white">
            {entry.title}
          </h3>
          <p className="org mb-[10px] font-sans-ui text-[16px] text-[var(--mut)]">
            {entry.place || entry.organization}
          </p>
          <p className="font-sans-ui text-[15.5px] leading-[1.6] text-[#dfe1f6]">
            {entry.description}
          </p>
        </div>
      </div>
    </>
  );

  if (disableAnimation || prefersReducedMotion) {
    return <div className={`it ${sideClass}`}>{content}</div>;
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`it ${sideClass}`}
    >
      {content}
    </Motion.div>
  );
}
