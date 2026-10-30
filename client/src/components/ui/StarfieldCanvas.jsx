import { useEffect, useRef } from 'react';

const STAR_COUNT = 280;
const ATTRACTION_RADIUS = 110;
const HOLD_RADIUS = 140;

function isOverInteractiveElement(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(
    target.closest(
      'button, a, input, select, textarea, label, header, [data-interactive-card], [role="dialog"], [role="menu"]'
    )
  );
}

/**
 * Fondo interactivo de estrellas en un único canvas fijo detrás del contenido.
 * - 280 estrellas: 92% de 1.2 a 2.8 px, 8% de 3.0 a 4.2 px, opacidad entre 0.2 y 0.9.
 * - Movimiento lento continuo.
 * - Puntero dibujado como disco pequeño con halo violeta suave (sin ocultar el cursor del sistema).
 * - Atrae despacio a las estrellas en un radio de ~110 px.
 * - Con click sostenido sobre el fondo, el disco se agranda y agrupa a las estrellas cercanas.
 * - Al soltar, esas estrellas cercanas se dispersan por la pantalla y las lejanas no se mueven.
 * - No se activa sobre botones, tarjetas ni campos.
 * - En celular solo funciona el toque sostenido.
 * - Respeta prefers-reduced-motion.
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const createStars = (w, h) => {
      const list = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const isLarge = i < Math.round(STAR_COUNT * 0.08);
        const size = isLarge
          ? 3 + Math.random() * 1.2 // 3.0 a 4.2 px
          : 1.2 + Math.random() * 1.6; // 1.2 a 2.8 px
        const opacity = 0.2 + Math.random() * 0.7; // 0.2 a 0.9
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.18;

        list.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size,
          opacity,
          baseVx: Math.cos(angle) * speed,
          baseVy: Math.sin(angle) * speed,
          vx: 0,
          vy: 0,
          gathered: false,
        });
      }
      return list;
    };

    let stars = createStars(width, height);

    const pointer = {
      x: -9999,
      y: -9999,
      active: false,
      holding: false,
      isTouch: false,
      discRadius: 5,
    };

    const getThemeColors = () => {
      const styles = getComputedStyle(document.documentElement);
      const starColor = styles.getPropertyValue('--estrellas').trim() || '#FFFFFF';
      const accentColor = styles.getPropertyValue('--acento').trim() || '#8B7CFF';
      return { starColor, accentColor };
    };

    let { starColor, accentColor } = getThemeColors();

    const disperseGatheredStars = () => {
      for (const s of stars) {
        if (s.gathered) {
          const dx = s.x - pointer.x;
          const dy = s.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          const angle =
            dist > 1 ? Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
          const impulse = 3.5 + Math.random() * 5.5;
          s.vx = Math.cos(angle) * impulse;
          s.vy = Math.sin(angle) * impulse;
          s.gathered = false;
        }
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      ({ starColor, accentColor } = getThemeColors());
      if (prefersReducedMotion) {
        drawStatic();
      }
    };

    const handleMouseMove = (e) => {
      if (prefersReducedMotion || pointer.isTouch) return;
      const blocked = isOverInteractiveElement(e.target);
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (blocked && !pointer.holding) {
        pointer.active = false;
      } else {
        pointer.active = true;
      }
    };

    const handleMouseDown = (e) => {
      if (prefersReducedMotion || e.button !== 0) return;
      pointer.isTouch = false;
      if (isOverInteractiveElement(e.target)) {
        pointer.active = false;
        pointer.holding = false;
        return;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      pointer.holding = true;
    };

    const handleMouseUp = () => {
      if (pointer.holding) {
        disperseGatheredStars();
      }
      pointer.holding = false;
    };

    const handleMouseLeave = () => {
      if (pointer.holding) {
        disperseGatheredStars();
      }
      pointer.active = false;
      pointer.holding = false;
    };

    let touchHoldTimer = null;

    const handleTouchStart = (e) => {
      if (prefersReducedMotion) return;
      pointer.isTouch = true;
      if (isOverInteractiveElement(e.target)) {
        pointer.active = false;
        pointer.holding = false;
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;

      // En celular solo funciona el toque sostenido
      clearTimeout(touchHoldTimer);
      touchHoldTimer = setTimeout(() => {
        pointer.active = true;
        pointer.holding = true;
      }, 180);
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
    };

    const handleTouchEnd = () => {
      clearTimeout(touchHoldTimer);
      if (pointer.holding) {
        disperseGatheredStars();
      }
      pointer.holding = false;
      pointer.active = false;
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = starColor;
      for (const s of stars) {
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let animationFrameId = null;

    const renderLoop = () => {
      if (prefersReducedMotion) {
        drawStatic();
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const targetRadius = pointer.holding ? 12 : 5;
      pointer.discRadius += (targetRadius - pointer.discRadius) * 0.18;

      const activeRadius = pointer.holding ? HOLD_RADIUS : ATTRACTION_RADIUS;

      ctx.fillStyle = starColor;

      for (const s of stars) {
        // Movimiento lento base + velocidad de dispersión amortiguada
        s.x += s.baseVx + s.vx;
        s.y += s.baseVy + s.vy;

        s.vx *= 0.94;
        s.vy *= 0.94;
        if (Math.abs(s.vx) < 0.01) s.vx = 0;
        if (Math.abs(s.vy) < 0.01) s.vy = 0;

        // Atracción hacia el puntero si está activo
        if (pointer.active && (!pointer.isTouch || pointer.holding)) {
          const dx = pointer.x - s.x;
          const dy = pointer.y - s.y;
          const dist = Math.hypot(dx, dy);

          if (dist < activeRadius && dist > 1) {
            const factor = (1 - dist / activeRadius) * (pointer.holding ? 0.065 : 0.014);
            s.x += dx * factor;
            s.y += dy * factor;
            if (pointer.holding) {
              s.gathered = true;
            }
          } else if (!pointer.holding) {
            s.gathered = false;
          }
        }

        // Envolver bordes del lienzo
        if (s.x < 0) s.x += width;
        if (s.x > width) s.x -= width;
        if (s.y < 0) s.y += height;
        if (s.y > height) s.y -= height;

        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dibujar disco del puntero con halo violeta suave
      if (pointer.active && (!pointer.isTouch || pointer.holding)) {
        ctx.globalAlpha = 1;
        const haloRadius = pointer.discRadius * 4.2;
        const gradient = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          haloRadius
        );
        gradient.addColorStop(0, 'rgba(139, 124, 255, 0.42)');
        gradient.addColorStop(0.45, 'rgba(139, 124, 255, 0.16)');
        gradient.addColorStop(1, 'rgba(139, 124, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = accentColor;
        ctx.globalAlpha = pointer.holding ? 0.85 : 0.65;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, pointer.discRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animationFrameId = window.requestAnimationFrame(renderLoop);
    };

    const handleMotionPreferenceChange = (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        drawStatic();
      } else {
        animationFrameId = window.requestAnimationFrame(renderLoop);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    mediaQuery.addEventListener('change', handleMotionPreferenceChange);

    if (prefersReducedMotion) {
      drawStatic();
    } else {
      animationFrameId = window.requestAnimationFrame(renderLoop);
    }

    return () => {
      clearTimeout(touchHoldTimer);
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
