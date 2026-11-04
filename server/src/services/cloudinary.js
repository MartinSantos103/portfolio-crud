import 'dotenv/config';
import crypto from 'node:crypto';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Valida una imagen en formato Data URL (base64) o URL HTTPS y la sube a Cloudinary
 * si las credenciales están configuradas en el entorno.
 */
export async function uploadImageToCloudinary(input, folder = 'portfolio') {
  if (!input || typeof input !== 'string') {
    const err = new Error('El contenido de la imagen es obligatorio');
    err.status = 400;
    err.code = 'INVALID_IMAGE';
    throw err;
  }

  const trimmed = input.trim();

  // Si es una URL pública directa (https://...)
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      url: trimmed,
      provider: 'external-url',
    };
  }

  // Validar formato Data URL: data:image/<ext>;base64,<payload>
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(trimmed);
  if (!match) {
    const err = new Error('Formato de imagen inválido. Se esperaba Data URL base64 o URL HTTPS.');
    err.status = 400;
    err.code = 'INVALID_MIME';
    throw err;
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2].replace(/\s+/g, '');

  if (!ALLOWED_MIMES.has(mimeType)) {
    const err = new Error(
      `Tipo de archivo no permitido (${mimeType}). Formatos aceptados: JPG, PNG, WebP, GIF, AVIF.`
    );
    err.status = 400;
    err.code = 'UNSUPPORTED_MIME';
    throw err;
  }

  const byteLength = Buffer.from(base64Data, 'base64').byteLength;
  if (byteLength > MAX_BYTES) {
    const err = new Error('La imagen supera el peso máximo permitido de 5 MB.');
    err.status = 400;
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Si las credenciales de Cloudinary están configuradas, realizar subida firmada
  if (cloudName && apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('file', `data:${mimeType};base64,${base64Data}`);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('folder', folder);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.secure_url) {
      const err = new Error(
        data.error?.message || 'Error al subir la imagen a Cloudinary'
      );
      err.status = 502;
      err.code = 'CLOUDINARY_ERROR';
      throw err;
    }

    return {
      url: data.secure_url,
      public_id: data.public_id,
      provider: 'cloudinary',
    };
  }

  // Fallback para desarrollo local sin credenciales de Cloudinary
  return {
    url: `data:${mimeType};base64,${base64Data}`,
    provider: 'inline-data-url',
  };
}
