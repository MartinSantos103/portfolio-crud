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

  const cardElement = (
    <article
      data-interactive-card="true"
      className="flex w-full max-w-[460px] flex-col gap-[8px] rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] px-[24px] py-[22px]"
    >
      <span className="font-mono-ui inline-flex w-fit items-center gap-[6px] rounded-full bg-[var(--etiqueta-tipo-bg)] px-[10px] py-[4px] text-[11px] font-medium uppercase tracking-[1.5px] text-[var(--acento-texto)]">
        <IconSlot
          size={12}
          name={isFormacion ? 'formacion' : 'experiencia'}
          strokeWidth={2}
        />
        <span>{entry.typeLabel || (isFormacion ? 'FORMACIÓN' : 'EXPERIENCIA')}</span>
      </span>
      <h3 className="font-heading text-[20px] font-medium leading-[1.3] text-[var(--texto)]">
        {entry.title}
      </h3>
      <p className="font-sans-ui text-[14px] font-medium leading-[1.4] text-[var(--texto-suave)]">
        {entry.place || entry.organization}
      </p>
      <p className="font-sans-ui text-[14px] font-normal leading-[22px] text-[var(--texto)]">
        {entry.description}
      </p>
    </article>
  );

  const dateElement = (
    <span className="font-mono-ui text-[14px] font-medium text-[var(--acento-texto)]">
      {entry.date}
    </span>
  );

  const innerContent = (
    <>
      <div className="hidden w-full items-center lg:flex">
        <div className="flex flex-1 justify-end pr-[12px]">
          {isLeft ? cardElement : dateElement}
        </div>

        <div className="relative z-10 flex w-[56px] shrink-0 items-center justify-center">
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[var(--halo-punto-bg)]">
            <div className="h-[16px] w-[16px] rounded-full bg-[var(--acento)]" />
          </div>
        </div>

        <div className="flex flex-1 justify-start pl-[12px]">
          {isLeft ? dateElement : cardElement}
        </div>
      </div>

      <div className="flex w-full items-start gap-[16px] lg:hidden">
        <div className="relative z-10 mt-[20px] flex w-[36px] shrink-0 items-center justify-center">
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[var(--halo-punto-bg)]">
            <div className="h-[16px] w-[16px] rounded-full bg-[var(--acento)]" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-[8px]">
          {dateElement}
          {cardElement}
        </div>
      </div>
    </>
  );

  if (disableAnimation || prefersReducedMotion) {
    return <div className="relative flex w-full items-center">{innerContent}</div>;
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex w-full items-center"
    >
      {innerContent}
    </Motion.div>
  );
}
