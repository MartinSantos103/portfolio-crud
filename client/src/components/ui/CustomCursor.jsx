import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'a,button,[role="button"],#pj>.card,[data-interactive-card="true"],.sw2,.chip,.tech-chip,label,.dots button,#astro-container';

/**
 * CustomCursor — Puntito luminoso con brillo del color de acento (sin aro alrededor).
 *
 * Reglas de activación:
 * - Solo tras montar el componente (useEffect).
 * - Solo en el sitio público (montado únicamente en PublicShellLayout, nunca en /admin/*).
 * - Solo con mouse (matchMedia('(hover: hover) and (pointer: fine)')).
 * - Se oculta en táctil/celular y dentro de input, textarea o select.
 * - Crece levemente (scale 1.5) sobre elementos clicables.
 */
export default function CustomCursor() {
  const dotRef = useRef(null);

  useEffect(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) return undefined;

    const root = document.documentElement;
    root.classList.add('cc');

    const handlePointerMove = (e) => {
      if (e.pointerType === 'touch') {
        root.classList.remove('cc', 'cv');
        return;
      }
      if (!root.classList.contains('cc')) {
        root.classList.add('cc');
      }
      root.classList.add('cv');

      if (dotRef.current) {
        dotRef.current.style.translate = `${e.clientX}px ${e.clientY}px`;
      }

      const target = e.target;
      if (target && typeof target.closest === 'function') {
        root.classList.toggle('cx-h', Boolean(target.closest(INTERACTIVE_SELECTOR)));
        root.classList.toggle('cx-t', Boolean(target.closest('input,textarea,select')));
      }
    };

    const handlePointerDown = () => {
      root.classList.add('cx-d');
    };

    const handlePointerUp = () => {
      root.classList.remove('cx-d');
    };

    const handlePointerLeave = () => {
      root.classList.remove('cv', 'cx-h', 'cx-d');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('mouseleave', handlePointerLeave);
      root.classList.remove('cc', 'cv', 'cx-h', 'cx-t', 'cx-d');
    };
  }, []);

  return <div ref={dotRef} className="cur cur-d" aria-hidden="true" />;
}
