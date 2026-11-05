/**
 * Campo de formulario reutilizable con variantes:
 * - 'input' (entrada de texto/email/password)
 * - 'select' (selector con flecha SVG propia integrada por CSS)
 * - 'textarea' (área de texto de 120 px de alto mínimo)
 *
 * Usa los tokens globales del sistema de diseño (--bg, --bd, --tx, --mut, --ac, --ar).
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
  rightSlot = null,
  className = '',
  ...rest
}) {
  const fieldId = id || name;

  return (
    <div className={`f flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="field-label"
        >
          {label}
        </label>
      )}

      {as === 'select' ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className="ui-select disabled:opacity-60"
          {...rest}
        >
          {options.map((opt, idx) => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            const optKey =
              typeof opt === 'object' && opt.id != null ? opt.id : `${optValue}-${idx}`;
            return (
              <option
                key={optKey}
                value={optValue}
                className="bg-[var(--bg2)] text-[var(--tx)]"
              >
                {optLabel}
              </option>
            );
          })}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="ui-textarea min-h-[120px] resize-y leading-[22px] disabled:opacity-60"
          {...rest}
        />
      ) : (
        <div className="relative flex items-center">
          <input
            id={fieldId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`ui-input disabled:opacity-60 ${rightSlot ? '!pr-[48px]' : ''}`}
            {...rest}
          />
          {rightSlot && (
            <div className="absolute right-[8px] flex items-center">
              {rightSlot}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
