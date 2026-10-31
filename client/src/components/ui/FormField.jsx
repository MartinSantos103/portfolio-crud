import IconSlot from './IconSlot.jsx';

/**
 * Campo de formulario reutilizable con variantes:
 * - 'input' (entrada de texto/email/password)
 * - 'select' (selector con chevron de 18 px a la derecha)
 * - 'textarea' (área de texto de 120 px de alto)
 *
 * Medidas:
 * - Columna de etiqueta y caja con 8 px entre ambas
 * - Etiqueta: Inter 500, 13 px, --texto
 * - Caja: fondo --fondo, borde 1 px --borde, radio 12 px, padding 14 px vertical y 16 px horizontal
 * - Texto / placeholder: Inter 400, 15 px, placeholder --texto-suave
 */
export default function FormField({
  as = 'input',
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  options = [],
  required = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const fieldId = id || name;

  const baseBoxClasses =
    'font-sans-ui w-full rounded-[12px] border border-[var(--borde)] bg-[var(--fondo)] px-[16px] py-[14px] text-[15px] font-normal text-[var(--texto)] placeholder:text-[var(--texto-suave)] transition-colors duration-150 focus:border-[var(--acento)] focus:outline-none disabled:opacity-60';

  return (
    <div className={`flex flex-col gap-[8px] ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="font-sans-ui text-[13px] font-medium leading-none text-[var(--texto)]"
        >
          {label}
        </label>
      )}

      {as === 'select' ? (
        <div className="relative flex items-center">
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`${baseBoxClasses} cursor-pointer appearance-none pr-[42px]`}
            {...rest}
          >
            {options.map((opt) => {
              const optValue = typeof opt === 'object' ? opt.value : opt;
              const optLabel = typeof opt === 'object' ? opt.label : opt;
              return (
                <option
                  key={optValue}
                  value={optValue}
                  className="bg-[var(--superficie)] text-[var(--texto)]"
                >
                  {optLabel}
                </option>
              );
            })}
          </select>
          <span className="pointer-events-none absolute right-[16px] inline-flex text-[var(--texto-suave)]">
            <IconSlot size={18} name="chevron-down" />
          </span>
        </div>
      ) : as === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseBoxClasses} h-[120px] resize-none leading-[22px]`}
          {...rest}
        />
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseBoxClasses}
          {...rest}
        />
      )}
    </div>
  );
}
