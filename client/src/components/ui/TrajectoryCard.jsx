import { motion as Motion, useReducedMotion } from 'framer-motion';

/**
 * Entrada y tarjeta de trayectoria con variante de lado izquierdo ('left') y derecho ('right').
 * - Tarjeta: 460 px de ancho, padding 22 px vertical y 24 px horizontal, 8 px entre elementos, radio 16 px.
 * - Etiqueta de tipo: píldora 999 px, fondo --acento al 14 %, texto --acento, JetBrains Mono 500, 11 px, espaciado 1.5 px.
 * - Título: Space Grotesk 500, 20 px.
 * - Lugar: Inter 500, 14 px, --texto-suave.
 * - Descripción: Inter 400, 14 px, interlineado 22 px, --texto.
 * - Fecha: JetBrains Mono 500, 14 px, --acento.
 * - Celda central fija de 56 px con punto de 16 px en --acento dentro de halo circular de 32 px (--acento al 18 %).
 */
export default function TrajectoryCard({ entry, side = 'left', index = 0 }) {
  const prefersReducedMotion = useReducedMotion();
  const isLeft = side === 'left';

  const cardElement = (
    <article
      data-interactive-card="true"
      className=" flex w-full max-w-[460px] flex-col gap-[8px] rounded-[16px] border border-[var(--borde)] bg-[var(--superficie)] px-[24px] py-[22px]"
    >
      <span className="font-mono-ui inline-flex w-fit items-center rounded-full bg-[var(--etiqueta-tipo-bg)] px-[10px] py-[3px] text-[11px] font-medium uppercase tracking-[1.5px] text-[var(--acento)]">
        {entry.typeLabel || (entry.type === 'formacion' ? 'FORMACIÓN' : 'EXPERIENCIA')}
      </span>
      <h3 className="font-heading text-[20px] font-medium leading-[1.3] text-[var(--texto)]">
        {entry.title}
      </h3>
      <p className="font-sans-ui text-[14px] font-medium leading-[1.4] text-[var(--texto-suave)]">
        {entry.place}
      </p>
      <p className="font-sans-ui text-[14px] font-normal leading-[22px] text-[var(--texto)]">
        {entry.description}
      </p>
    </article>
  );

  const dateElement = (
    <span className="font-mono-ui text-[14px] font-medium text-[var(--acento)]">
      {entry.date}
    </span>
  );

  return (
    <Motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex w-full items-center"
    >
      {/* Vista de escritorio (>= 1024px): 3 celdas (izquierda flexible, centro 56px, derecha flexible) */}
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

      {/* Vista móvil y tablet (< 1024px): línea de tiempo a un solo lado */}
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
    </Motion.div>
  );
}
