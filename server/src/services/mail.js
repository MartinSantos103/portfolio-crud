import 'dotenv/config';
import nodemailer from 'nodemailer';

const mailUser = process.env.MAIL_USER;
const mailPass = (process.env.MAIL_APP_PASSWORD || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailUser,
    pass: mailPass,
  },
});

/**
 * Escapa caracteres HTML para evitar inyección en el correo
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Verifica la conexión SMTP con el servidor de correo (Gmail).
 */
export async function verifyTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
    throw new Error('Faltan MAIL_USER o MAIL_APP_PASSWORD en .env');
  }
  return transporter.verify();
}

/**
 * Envía un correo de notificación al dueño del portfolio cuando llega un mensaje nuevo.
 * @param {Object} mensajeData - Datos del mensaje validado.
 */
export async function sendNotificationEmail(mensajeData) {
  const tipo = mensajeData.tipo || mensajeData.type || 'consulta';
  const nombre = mensajeData.nombre || mensajeData.name || 'Sin nombre';
  const email = mensajeData.email;
  const asunto = mensajeData.asunto || mensajeData.subject || 'Sin asunto';
  const mensaje = mensajeData.mensaje || mensajeData.body || '';
  const datosExtra = mensajeData.datos_adicionales || mensajeData.extra;

  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
    console.warn('⚠️ [mail.js] Variables MAIL_USER o MAIL_APP_PASSWORD no definidas. Se omite el envío del correo.');
    return { skipped: true, reason: 'missing_credentials' };
  }

  // Construcción dinámica de detalles adicionales (ej. presupuesto, plazo, tipo_proyecto)
  let detallesExtraHtml = '';
  if (datosExtra && typeof datosExtra === 'object' && Object.keys(datosExtra).length > 0) {
    detallesExtraHtml = Object.entries(datosExtra)
      .map(([clave, valor]) => `<li><strong>${escapeHtml(clave)}:</strong> ${escapeHtml(valor)}</li>`)
      .join('');
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1a202c;">
      <h2 style="color: #2b6cb0; border-bottom: 2px solid #ebf8ff; padding-bottom: 8px; margin-top: 0;">
        Nuevo mensaje recibido en el Portfolio
      </h2>
      <p style="margin: 8px 0;"><strong>Tipo de solicitud:</strong> <span style="background: #edf2f7; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; font-size: 12px; font-weight: bold; color: #4a5568;">${escapeHtml(tipo)}</span></p>
      <p style="margin: 8px 0;"><strong>Remitente:</strong> ${escapeHtml(nombre)} (&lt;<a href="mailto:${escapeHtml(email)}" style="color: #3182ce;">${escapeHtml(email)}</a>&gt;)</p>
      <p style="margin: 8px 0;"><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
      
      <div style="margin: 16px 0;">
        <strong>Mensaje:</strong>
        <blockquote style="margin: 8px 0; background: #f7fafc; padding: 12px 16px; border-left: 4px solid #3182ce; border-radius: 4px; color: #2d3748; white-space: pre-wrap;">
${escapeHtml(mensaje)}
        </blockquote>
      </div>

      ${detallesExtraHtml ? `
      <div style="margin: 16px 0; background: #fffaf0; border: 1px solid #feebc8; border-radius: 6px; padding: 12px 16px;">
        <h4 style="margin: 0 0 8px 0; color: #dd6b20;">Datos adicionales de la solicitud:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #4a5568;">
          ${detallesExtraHtml}
        </ul>
      </div>
      ` : ''}

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #a0aec0; margin: 0;">
        Aviso automático generado por el backend del Portfolio. Podés responder directamente a este correo para comunicarte con ${escapeHtml(nombre)}.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"Portfolio Web" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER, // Aviso al dueño
    replyTo: email,           // Responder directo al remitente
    subject: `[Portfolio - ${tipo.toUpperCase()}] ${asunto}`,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}

export default {
  verifyTransporter,
  sendNotificationEmail,
};
