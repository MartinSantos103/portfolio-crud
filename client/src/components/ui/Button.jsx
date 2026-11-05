/**
 * Botón reutilizable en variantes primaria ('primary'), secundaria ('secondary') y pequeña (size="sm").
 * - Tipografía: DM Sans (--font-sans)
 * - Elevación vertical al pasar el mouse (hover: translate 0 -3px, active: translate 0 -1px), sin efecto imán lateral.
 * - Primario: fondo --ac, texto #0a0c1b, borde --ac, resplandor en --ar.
 * - Secundario: fondo oscuro traslúcido, texto --tx, borde --bd, hover --ac.
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
  const sizeClasses =
    size === 'sm'
      ? 'btn-sm'
      : size === 'service'
        ? 'text-[15px] px-[20px] py-[12px]'
        : 'text-[15px] px-[20px] py-[12px]';

  const variantClasses =
    variant === 'primary'
      ? 'btn p'
      : 'btn btn-s';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variantClasses} ${sizeClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
