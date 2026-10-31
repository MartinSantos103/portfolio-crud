/**
 * Espacio reservado para iconos que se conectarán desde una API de iconos.
 * Respeta las medidas exactas en píxeles indicadas en la especificación de diseño.
 *
 * @param {Object} props
 * @param {number} props.size - Tamaño del espacio cuadrado en píxeles (ej: 12, 14, 16, 18, 20, 22, 28, 150)
 * @param {string} [props.name] - Identificador semántico del icono para futura conexión a la API
 * @param {string|null} [props.iconUrl] - URL del icono si ya proviene de la API
 * @param {string} [props.className] - Clases adicionales
 */
export default function IconSlot({ size = 20, name = 'icon', iconUrl = null, className = '' }) {
  const dimensionStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
  };

  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        aria-hidden="true"
        data-icon-slot={name}
        style={dimensionStyle}
        className={`inline-block shrink-0 object-contain select-none ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      data-icon-slot={name}
      style={dimensionStyle}
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] border border-dashed border-current/30 ${className}`}
    />
  );
}
