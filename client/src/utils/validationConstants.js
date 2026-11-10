/**
 * Catálogo unificado de mensajes y reglas de validación para formularios públicos y de administración.
 * Garantiza coherencia en todo el portfolio, reutilizando las mismas expresiones para entradas análogas.
 */
export const VALIDATION_MESSAGES = {
  EMAIL_INVALID: 'El formato del correo electrónico es inválido (ej: usuario@dominio.com).',
  URL_INVALID: 'El formato de la URL es inválido (debe comenzar con http:// o https://).',
  NO_ATTACHMENTS: 'Por razones de seguridad no se admiten archivos adjuntos directos. Podés incluir enlaces en el cuerpo del mensaje.',
  IMAGE_FORMAT_INVALID: 'Formato no válido. Solo se admiten imágenes JPG, PNG, WebP, GIF o AVIF.',
  IMAGE_SIZE_EXCEEDED: 'El archivo supera el límite máximo de 5 MB.',
  REQUIRED: 'Este campo es obligatorio.',
};

/**
 * Expresión regular estándar para validar URLs que comiencen con protocolo web http:// o https://.
 */
export const URL_REGEX = /^https?:\/\//i;

/**
 * Expresión regular estándar para validar formato de correo electrónico básico.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
