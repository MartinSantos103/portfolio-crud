/**
 * Badge - Sistema de insignias del Panel de Administración (Regla 1.1).
 * - variant="neutral": Etiquetas de categorización (tipo de consulta, tecnologías, origen, rol).
 *   Usa borde sutil, fondo de superficie secundaria, ícono opcional y texto.
 * - variant="status": Color semántico EXCLUSIVO para estados:
 *   - 'nuevo': azul/violeta claro (text-violet-300 en oscuro, WCAG AA >= 4.5:1)
 *   - 'leido': gris neutro
 *   - 'respondido' | 'publicado' | 'activo': esmeralda
 *   - 'inactivo' | 'cerrado' | 'borrador': ámbar / rojo
 */

const STATUS_CONFIG = {
  nuevo: {
    label: 'Nuevo',
    classes:
      'border-violet-500/40 bg-violet-500/15 text-violet-700 dark:text-violet-300 [html[data-theme="dark"]_&]:text-violet-300',
    dot: 'bg-violet-400',
  },
  leido: {
    label: 'Leído',
    classes:
      'border-[var(--borde)] bg-[var(--superficie-alta)] text-[var(--texto-suave)]',
    dot: 'bg-slate-400',
  },
  respondido: {
    label: 'Respondido',
    classes:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 [html[data-theme="dark"]_&]:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  publicado: {
    label: 'Publicado',
    classes:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 [html[data-theme="dark"]_&]:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  activo: {
    label: 'Activo',
    classes:
      'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 [html[data-theme="dark"]_&]:text-emerald-300',
    dot: 'bg-emerald-400',
  },
  borrador: {
    label: 'Borrador',
    classes:
      'border-amber-500/40 bg-amber-500/15 text-amber-800 [html[data-theme="dark"]_&]:text-amber-300',
    dot: 'bg-amber-400',
  },
  inactivo: {
    label: 'Inactivo',
    classes:
      'border-amber-500/40 bg-amber-500/15 text-amber-800 [html[data-theme="dark"]_&]:text-amber-300',
    dot: 'bg-amber-400',
  },
  cerrado: {
    label: 'Cerrado',
    classes:
      'border-red-500/40 bg-red-500/15 text-red-700 [html[data-theme="dark"]_&]:text-red-300',
    dot: 'bg-red-400',
  },
};

export default function Badge({
  variant = 'neutral',
  status,
  icon = null,
  children,
  className = '',
}) {
  if (variant === 'status' && status) {
    const key = String(status).toLowerCase();
    const cfg = STATUS_CONFIG[key] || STATUS_CONFIG.leido;
    return (
      <span
        className={`font-mono-ui inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${cfg.classes} ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
        <span>{children || cfg.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`font-mono-ui inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--borde)] bg-[var(--superficie-alta)] px-2.5 py-1 text-[11px] font-medium leading-none text-[var(--texto)] ${className}`}
    >
      {icon && <span className="shrink-0 text-[var(--texto-suave)]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
