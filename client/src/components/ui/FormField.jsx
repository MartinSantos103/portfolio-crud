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
  readOnly = false,
  error = false,
  errorMessage = '',
  rightSlot = null,
  bottomSlot = null,
  className = '',
  ...rest
}) {
  const fieldId = id || name;
  const isInvalid = Boolean(error || errorMessage);

  return (
    <div className={`f flex flex-col ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="field-label flex items-center gap-1.5"
        >
          <span>{label}</span>
          {required && as !== 'select' && (
            <span
              className="text-[var(--bad)] font-bold text-[14px] select-none"
              title="Campo obligatorio"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {as === 'select' ? (
        <div className="flex flex-col">
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`ui-select disabled:opacity-60 ${isInvalid ? '!border-[var(--bad)] focus:!border-[var(--bad)]' : ''}`}
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
          {errorMessage && (
            <span
              role="alert"
              className="font-sans-ui text-[12px] font-medium text-[var(--bad)] mt-1.5 block leading-tight"
            >
              {errorMessage}
            </span>
          )}
          {bottomSlot && <div className="mt-1">{bottomSlot}</div>}
        </div>
      ) : as === 'textarea' ? (
        <div className="flex flex-col">
          <textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={`ui-textarea min-h-[120px] resize-y leading-[22px] disabled:opacity-60 read-only:opacity-75 read-only:cursor-not-allowed ${
              isInvalid ? '!border-[var(--bad)] focus:!border-[var(--bad)]' : ''
            }`}
            {...rest}
          />
          {errorMessage && (
            <span
              role="alert"
              className="font-sans-ui text-[12px] font-medium text-[var(--bad)] mt-1.5 block leading-tight"
            >
              {errorMessage}
            </span>
          )}
          {bottomSlot && <div className="mt-1">{bottomSlot}</div>}
        </div>
      ) : (
        <div className="flex flex-col">
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
              readOnly={readOnly}
              className={`ui-input disabled:opacity-60 read-only:opacity-75 read-only:cursor-not-allowed ${
                isInvalid ? '!border-[var(--bad)] focus:!border-[var(--bad)]' : ''
              } ${rightSlot ? '!pr-[48px]' : ''}`}
              {...rest}
            />
            {rightSlot && (
              <div className="absolute right-[8px] flex items-center">
                {rightSlot}
              </div>
            )}
          </div>
          {errorMessage && (
            <span
              role="alert"
              className="font-sans-ui text-[12px] font-medium text-[var(--bad)] mt-1.5 block leading-tight"
            >
              {errorMessage}
            </span>
          )}
          {bottomSlot && <div className="mt-1">{bottomSlot}</div>}
        </div>
      )}
    </div>
  );
}
