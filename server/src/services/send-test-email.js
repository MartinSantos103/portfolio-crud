import 'dotenv/config';
import { sendNotificationEmail, verifyTransporter } from './mail.js';
import { query, closePool } from '../db/pool.js';

async function main() {
  console.log('🚀 Iniciando prueba de envío real con Nodemailer...');
  console.log(`Destinatario (MAIL_USER en .env): ${process.env.MAIL_USER}`);

  // 1. Verificar conexión SMTP
  try {
    console.log('⏳ Verificando credenciales SMTP con Gmail...');
    await verifyTransporter();
    console.log('✅ Credenciales SMTP validadas correctamente.');
  } catch (err) {
    console.error('❌ Error de conexión SMTP:', err.message);
    process.exit(1);
  }

  // 2. Datos de prueba realistas (simulando una solicitud desde el frontend)
  const testData = {
    tipo: 'cotizacion',
    nombre: 'Gonzalo Martínez (Cliente Prueba)',
    email: 'gonzalo.martinez.dev@gmail.com',
    asunto: 'Desarrollo de plataforma SaaS con panel de métricas',
    mensaje:
      'Hola Martín! Te contacto a través del formulario de tu portfolio porque vimos tus proyectos y nos interesa coordinar una propuesta técnica para el desarrollo de un MVP fullstack con React y Node.js.',
    datos_adicionales: {
      servicio_interes: 'Aplicaciones web a medida',
      tipo_proyecto: 'Plataforma SaaS',
      presupuesto: 'USD 2.500 - 3.500',
      plazo: '2 meses',
    },
  };

  // 3. Registrar en PostgreSQL (Neon) para verificar persistencia completa
  let dbMessageId = null;
  try {
    console.log('⏳ Registrando mensaje de prueba en la base de datos Neon...');
    const insertSql = `
      INSERT INTO messages (user_id, type, name, email, subject, body, extra, status)
      VALUES (NULL, $1, $2, $3, $4, $5, $6, 'nuevo')
      RETURNING id, created_at;
    `;
    const params = [
      testData.tipo,
      testData.nombre,
      testData.email,
      testData.asunto,
      testData.mensaje,
      JSON.stringify(testData.datos_adicionales),
    ];
    const { rows } = await query(insertSql, params);
    dbMessageId = rows[0].id;
    console.log(`✅ Mensaje guardado en base de datos con ID #${dbMessageId} a las ${rows[0].created_at}`);
  } catch (dbErr) {
    console.warn('⚠️ No se pudo guardar en la base de datos (se continúa con el envío del correo):', dbErr.message);
  }

  // 4. Despachar el correo mediante Nodemailer
  try {
    console.log('⏳ Despachando correo mediante Nodemailer a Gmail...');
    const info = await sendNotificationEmail(testData);
    console.log('🎉 ¡CORREO ENVIADO CON ÉXITO!');
    console.log(`📨 ID de mensaje SMTP: ${info.messageId}`);
    console.log(`📬 Respuesta del servidor de Google: ${info.response}`);
    console.log(`📥 Destinatario: ${process.env.MAIL_USER}`);
    console.log(`📋 Asunto generado: [Portfolio] Cotización de ${testData.nombre} - ${testData.asunto}`);
  } catch (mailErr) {
    console.error('❌ Error al enviar el correo:', mailErr.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
