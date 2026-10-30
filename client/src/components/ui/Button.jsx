/**
 * Botón reutilizable en variantes primaria y secundaria.
 * - Tipografía: Inter 600, 16 px (15 px para tarjetas de servicio con size="service")
 * - Padding: 14 px vertical y 24 px horizontal
 * - Radio de borde: 12 px
 * - Primario: fondo --acento (hover --acento-hover), texto --sobre-acento
 * - Secundario: texto --texto, borde 1.5 px en --borde
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  disabled = false,
  onClick,
  children,
  className = '',
  ...rest
}) {
  const fontSizeClass = size === 'service' ? 'text-[15px]' : 'text-[16px]';

  const variantClasses =
    variant === 'primary'
      ? 'bg-[var(--acento)] text-[var(--sobre-acento)] hover:bg-[var(--acento-hover)] border border-transparent'
      : 'bg-transparent text-[var(--texto)] border-[1.5px] border-[var(--borde)] hover:border-[var(--acento)] hover:bg-[var(--superficie-alta)]';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`font-sans-ui inline-flex cursor-pointer items-center justify-center gap-[10px] rounded-[12px] px-[24px] py-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${fontSizeClass} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
