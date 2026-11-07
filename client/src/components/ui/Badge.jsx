/**
 * Badge - Sistema de insignias con tokens semánticos fijos y paleta de acento (Parte 0).
 * - variant="neutral": Etiquetas de categorización (tipo de consulta, tecnologías, origen, rol).
 * - variant="status": Color semántico para estados:
 *   - 'nuevo': acento de la paleta activa (--ac2 / --ar)
 *   - 'leido': neutro (--mut / --bd)
 *   - 'respondido' | 'publicado' | 'activo': semántico fijo --ok (#34d399)
 *   - 'borrador' | 'inactivo': semántico fijo --warn (#fbbf24) / --info (#22d3ee)
 *   - 'cerrado': semántico fijo --bad (#fb7185)
 */

const STATUS_CONFIG = {
  nuevo: {
    label: 'Nuevo',
    classes: 'badge-accent',
    dotStyle: { backgroundColor: 'var(--ac2)' },
  },
  leido: {
    label: 'Leído',
    classes: 'border-[var(--bd)] bg-white/[0.04] text-[var(--mut)] backdrop-blur-xs',
    dotStyle: { backgroundColor: 'var(--mut)' },
  },
  respondido: {
    label: 'Respondido',
    classes: 'badge-ok',
    dotStyle: { backgroundColor: 'var(--ok)' },
  },
  publicado: {
    label: 'Publicado',
    classes: 'badge-ok',
    dotStyle: { backgroundColor: 'var(--ok)' },
  },
  activo: {
    label: 'Visible',
    classes: 'badge-ok',
    dotStyle: { backgroundColor: 'var(--ok)' },
  },
  visible: {
    label: 'Visible',
    classes: 'badge-ok',
    dotStyle: { backgroundColor: 'var(--ok)' },
  },
  oculto: {
    label: 'Oculto',
    classes: 'badge-warn',
    dotStyle: { backgroundColor: 'var(--warn)' },
  },
  borrador: {
    label: 'Borrador',
    classes: 'badge-warn',
    dotStyle: { backgroundColor: 'var(--warn)' },
  },
  inactivo: {
    label: 'Inactivo',
    classes: 'badge-warn',
    dotStyle: { backgroundColor: 'var(--warn)' },
  },
  cerrado: {
    label: 'Cerrado',
    classes: 'badge-bad',
    dotStyle: { backgroundColor: 'var(--bad)' },
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
        className={`badge ${cfg.classes} ${className}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={cfg.dotStyle}
          aria-hidden="true"
        />
        <span>{children || cfg.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`font-mono-ui inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--bd)] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium leading-none text-[var(--tx)] backdrop-blur-xs ${className}`}
    >
      {icon && <span className="shrink-0 text-[var(--mut)]">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
