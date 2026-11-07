import { useEffect, useRef } from 'react';

/**
 * Fondo interactivo de estrellas en Canvas (#sky) fiel al prototipo Portfolio_animado_v4.html.
 * - Estrellas a distintas profundidades con parallax de mouse y scroll.
 * - Conexiones sutiles entre estrellas cercanas al puntero.
 * - Destellos ocasionales y estrellas fugaces/meteoros en la paleta de acento activa.
 * - Flujo continuo orgánico a través de todo el viewport sin cortes artificiales.
 * - Se pausa automáticamente si la pestaña está oculta (document.hidden) y dibuja
 *   una sola imagen estática si prefers-reduced-motion está activo.
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const cx = cv.getContext('2d');
    if (!cx) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const getPaletteRgb = () => {
      const cs = getComputedStyle(document.documentElement);
      const ar = cs.getPropertyValue('--ar').trim() || '130,119,242';
      const br = cs.getPropertyValue('--br').trim() || '167,156,255';
      const lt = cs.getPropertyValue('--lt').trim() || '216,204,255';
      return {
        AL: lt,
        AR2: br,
        MT: [lt, ar, br, ar, lt],
      };
    };

    let { AL, AR2, MT } = getPaletteRgb();

    const C = [
      '255,255,255',
      '255,255,255',
      '255,255,255',
      '@',
      '@',
      '180,200,255',
      '180,200,255',
      '253,230,138',
    ];

    const cf = (v) => (v === '@' ? { c: AL, a: 1 } : { c: v, a: 0 });

    let W = window.innerWidth;
    let H = window.innerHeight;
    let S = [];
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let px = -999;
    let py = -999;
    let sh = [];
    let nx = 2500;
    let mt = [];
    let nm2 = 3500;
    let gl = [];
    let ng = 900;

    function size() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      cv.width = W * d;
      cv.height = H * d;
      cx.setTransform(d, 0, 0, d, 0, 0);

      const count = Math.min(460, Math.round((W * H) / 2600));
      S = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          z: 0.2 + z * 0.8,
          p: Math.random() * 6.28,
          s: 0.6 + Math.random() * 1.8,
          big: Math.random() < 0.09,
          ...cf(C[(Math.random() * C.length) | 0]),
        };
      });
    }

    function drawFrame(t, staticOnly = false) {
      cx.clearRect(0, 0, W, H);
      cx.save();

      if (!staticOnly) {
        mx += (tx - mx) * 0.06;
        my += (ty - my) * 0.06;
      }

      const scrollY = window.scrollY || 0;
      const bh = document.querySelector('.bh');
      if (bh && !staticOnly) {
        bh.style.translate = `0 ${-scrollY * 0.35}px`;
      }

      const near = [];
      const ax = px > -900 ? px : W / 2 + Math.sin(t / 2600) * W * 0.38;
      const ay = py > -900 ? py : H / 2 + Math.cos(t / 2100) * H * 0.32;

      for (const s of S) {
        const x = (((s.x - mx * 30 * s.z) % W) + W) % W;
        const y = (((s.y - scrollY * 0.2 * s.z - my * 22 * s.z) % H) + H) % H;
        s.cx = x;
        s.cy = y;
        const a = Math.min(
          1,
          (0.3 + 0.6 * s.z) * (0.65 + 0.35 * Math.sin((t / 1000) * s.s + s.p))
        );
        const r = 0.4 + s.z * 1.3;

        cx.fillStyle = `rgba(${s.c},${a})`;
        if (s.big) {
          cx.shadowColor = `rgb(${s.c})`;
          cx.shadowBlur = 10;
        }
        cx.beginPath();
        cx.arc(x, y, s.big ? r * 1.5 : r, 0, 6.283);
        cx.fill();
        cx.shadowBlur = 0;

        if (s.big) {
          cx.strokeStyle = `rgba(${s.c},${a * 0.7})`;
          cx.lineWidth = 1;
          const L = r * 7 * (0.7 + 0.3 * Math.sin(t / 700 + s.p));
          cx.beginPath();
          cx.moveTo(x - L, y);
          cx.lineTo(x + L, y);
          cx.moveTo(x, y - L);
          cx.lineTo(x, y + L);
          cx.stroke();
        }

        if (!staticOnly && Math.hypot(x - ax, y - ay) < 170 && near.length < 20) {
          near.push(s);
        }
      }

      if (!staticOnly) {
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const d = Math.hypot(near[i].cx - near[j].cx, near[i].cy - near[j].cy);
            if (d < 95) {
              cx.strokeStyle = `rgba(${AR2},${(1 - d / 95) * 0.55})`;
              cx.lineWidth = 0.8;
              cx.beginPath();
              cx.moveTo(near[i].cx, near[i].cy);
              cx.lineTo(near[j].cx, near[j].cy);
              cx.stroke();
            }
          }
        }

        if (t > ng && S.length > 0) {
          gl.push({ s: S[(Math.random() * S.length) | 0], l: 1 });
          ng = t + 500 + Math.random() * 900;
        }
        gl = gl.filter((g) => {
          g.l -= 0.022;
          const u = Math.sin((1 - g.l) * Math.PI);
          const s = g.s;
          const L = 3 + u * 12;
          const R2 = 2 + u * 8;
          const gr = cx.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, R2);
          gr.addColorStop(0, `rgba(255,255,255,${u})`);
          gr.addColorStop(1, `rgba(${s.c},0)`);
          cx.fillStyle = gr;
          cx.beginPath();
          cx.arc(s.cx, s.cy, R2, 0, 6.283);
          cx.fill();
          cx.strokeStyle = `rgba(255,255,255,${u * 0.8})`;
          cx.lineWidth = 1;
          cx.beginPath();
          cx.moveTo(s.cx - L, s.cy);
          cx.lineTo(s.cx + L, s.cy);
          cx.moveTo(s.cx, s.cy - L);
          cx.lineTo(s.cx, s.cy + L);
          cx.stroke();
          return g.l > 0;
        });

        if (t > nm2) {
          const f = Math.random() < 0.5;
          mt.push({
            x: f ? W * (0.5 + Math.random() * 0.6) : W + 40,
            y: f ? -40 : Math.random() * H * 0.3,
            vx: -(5 + Math.random() * 3),
            vy: 3.5 + Math.random() * 2.5,
            r: 3 + Math.random() * 3,
            l: 1,
            sp: [],
          });
          nm2 = t + 7000 + Math.random() * 6000;
        }
        mt = mt.filter((m) => {
          m.x += m.vx;
          m.y += m.vy;
          m.l -= 0.0055;
          const L = 14;
          const ex = m.x - m.vx * L;
          const ey = m.y - m.vy * L;
          const g = cx.createLinearGradient(m.x, m.y, ex, ey);
          g.addColorStop(0, `rgba(${MT[0]},${m.l * 0.9})`);
          g.addColorStop(0.4, `rgba(${MT[1]},${m.l * 0.5})`);
          g.addColorStop(1, 'rgba(160,90,255,0)');
          cx.strokeStyle = g;
          cx.lineWidth = m.r * 1.6;
          cx.lineCap = 'round';
          cx.beginPath();
          cx.moveTo(m.x, m.y);
          cx.lineTo(ex, ey);
          cx.stroke();

          const h = cx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3);
          h.addColorStop(0, `rgba(255,255,255,${m.l})`);
          h.addColorStop(0.35, `rgba(${MT[2]},${m.l * 0.8})`);
          h.addColorStop(1, `rgba(${MT[3]},0)`);
          cx.fillStyle = h;
          cx.beginPath();
          cx.arc(m.x, m.y, m.r * 3, 0, 6.283);
          cx.fill();

          if (Math.random() < 0.5) {
            m.sp.push({
              x: m.x,
              y: m.y,
              vx: m.vx * 0.25 + (Math.random() - 0.5) * 1.6,
              vy: m.vy * 0.25 + Math.random() * 1.4,
              l: 1,
            });
          }
          m.sp = m.sp.filter((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.l -= 0.04;
            cx.fillStyle = `rgba(${MT[4]},${p.l})`;
            cx.fillRect(p.x, p.y, 1.6, 1.6);
            return p.l > 0;
          });
          return m.l > 0 && m.x > -200 && m.y < H + 200;
        });

        if (t > nx) {
          sh.push({
            x: Math.random() * W * 0.7,
            y: Math.random() * H * 0.4,
            vx: 8 + Math.random() * 4,
            vy: 4 + Math.random() * 2,
            l: 1,
          });
          nx = t + 2200 + Math.random() * 3000;
        }
        sh = sh.filter((m) => {
          m.x += m.vx;
          m.y += m.vy;
          m.l -= 0.016;
          const g = cx.createLinearGradient(
            m.x,
            m.y,
            m.x - m.vx * 9,
            m.y - m.vy * 9
          );
          g.addColorStop(0, `rgba(255,255,255,${m.l})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          cx.strokeStyle = g;
          cx.lineWidth = 1.6;
          cx.beginPath();
          cx.moveTo(m.x, m.y);
          cx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9);
          cx.stroke();
          return m.l > 0;
        });
      }

      cx.restore();
    }

    size();

    let rafId = null;

    function loop(t) {
      rafId = window.requestAnimationFrame(loop);
      if (document.hidden) return;
      drawFrame(t, false);
    }

    const handleResize = () => {
      size();
      if (prefersReducedMotion) {
        drawFrame(0, true);
      }
    };

    const handlePointerMove = (e) => {
      tx = (e.clientX / W) * 2 - 1;
      ty = (e.clientY / H) * 2 - 1;
      px = e.clientX;
      py = e.clientY;
    };

    const handlePointerLeave = () => {
      px = -999;
    };

    const handlePointerUp = (e) => {
      if (e.pointerType === 'touch') {
        setTimeout(() => {
          px = -999;
        }, 1500);
      }
    };

    const handleAccentChange = () => {
      ({ AL, AR2, MT } = getPaletteRgb());
      S.forEach((s) => {
        if (s.a) s.c = AL;
      });
      if (prefersReducedMotion) {
        drawFrame(0, true);
      }
    };

    const handleMotionChange = (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        if (rafId) window.cancelAnimationFrame(rafId);
        drawFrame(0, true);
      } else {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('acento', handleAccentChange);
    mediaQuery.addEventListener('change', handleMotionChange);

    if (prefersReducedMotion) {
      drawFrame(0, true);
    } else {
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('acento', handleAccentChange);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      id="sky"
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
