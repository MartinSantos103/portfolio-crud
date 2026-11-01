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

// Mapeo amigable para los tipos de mensaje en el asunto y cuerpo
const TIPO_LABELS = {
  cotizacion: 'Cotización',
  consulta: 'Consulta',
  asesoria: 'Asesoría técnica',
};

// Mapeo amigable para las etiquetas de campos adicionales
const CAMPO_LABELS = {
  servicio_interes: 'Servicio de interés',
  tipo_proyecto: 'Tipo de proyecto',
  presupuesto: 'Presupuesto estimado',
  plazo: 'Plazo previsto',
};

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
  const rawType = (mensajeData.tipo || mensajeData.type || 'consulta').toLowerCase();
  const tipoLabel = TIPO_LABELS[rawType] || rawType.charAt(0).toUpperCase() + rawType.slice(1);
  const nombre = mensajeData.nombre || mensajeData.name || 'Sin nombre';
  const email = mensajeData.email;
  const asuntoRaw = mensajeData.asunto || mensajeData.subject || 'Sin asunto';
  const mensaje = mensajeData.mensaje || mensajeData.body || '';
  const datosExtra = mensajeData.datos_adicionales || mensajeData.extra;

  if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
    console.warn('⚠️ [mail.js] Variables MAIL_USER o MAIL_APP_PASSWORD no definidas. Se omite el envío del correo.');
    return { skipped: true, reason: 'missing_credentials' };
  }

  // Construcción dinámica de detalles adicionales (ej. presupuesto, plazo, servicio_interes)
  let detallesExtraHtml = '';
  if (datosExtra && typeof datosExtra === 'object' && Object.keys(datosExtra).length > 0) {
    detallesExtraHtml = Object.entries(datosExtra)
      .map(([clave, valor]) => {
        const etiqueta = CAMPO_LABELS[clave] || clave.replace(/_/g, ' ');
        return `<li><strong>${escapeHtml(etiqueta)}:</strong> ${escapeHtml(valor)}</li>`;
      })
      .join('');
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1a202c; background-color: #ffffff;">
      <h2 style="color: #2b6cb0; border-bottom: 2px solid #ebf8ff; padding-bottom: 12px; margin-top: 0; font-size: 20px;">
        📬 Nuevo mensaje recibido en el Portfolio
      </h2>
      <p style="margin: 8px 0; font-size: 15px;"><strong>Tipo de solicitud:</strong> <span style="background: #edf2f7; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; color: #2b6cb0;">${escapeHtml(tipoLabel)}</span></p>
      <p style="margin: 8px 0; font-size: 15px;"><strong>Remitente:</strong> ${escapeHtml(nombre)} (&lt;<a href="mailto:${escapeHtml(email)}" style="color: #3182ce; text-decoration: none;">${escapeHtml(email)}</a>&gt;)</p>
      <p style="margin: 8px 0; font-size: 15px;"><strong>Asunto:</strong> ${escapeHtml(asuntoRaw)}</p>
      
      <div style="margin: 18px 0;">
        <strong style="font-size: 15px;">Mensaje:</strong>
        <blockquote style="margin: 8px 0; background: #f7fafc; padding: 14px 18px; border-left: 4px solid #3182ce; border-radius: 4px; color: #2d3748; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
${escapeHtml(mensaje)}
        </blockquote>
      </div>

      ${detallesExtraHtml ? `
      <div style="margin: 18px 0; background: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 14px 18px;">
        <h4 style="margin: 0 0 10px 0; color: #dd6b20; font-size: 14px;">Detalles adicionales de la solicitud:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 13px; line-height: 1.6;">
          ${detallesExtraHtml}
        </ul>
      </div>
      ` : ''}

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="font-size: 12px; color: #718096; margin: 0; line-height: 1.5;">
        Aviso automático generado por el backend del Portfolio. Podés responder directamente a este correo para comunicarte con <strong>${escapeHtml(nombre)}</strong>.
      </p>
    </div>
  `;

  // Limpiar el asunto para evitar repeticiones en el título
  let asuntoDetalle = asuntoRaw;
  if (asuntoDetalle.toUpperCase().startsWith(`${rawType.toUpperCase()} —`)) {
    asuntoDetalle = asuntoDetalle.substring(`${rawType.toUpperCase()} —`.length).trim();
  }

  const mailOptions = {
    from: `"Portfolio Web" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER, // Notificación a tu casilla de correo
    replyTo: email,           // Permite responder directo al remitente
    subject: `[Portfolio] ${tipoLabel} de ${nombre} - ${asuntoDetalle}`,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}

export default {
  verifyTransporter,
  sendNotificationEmail,
};
