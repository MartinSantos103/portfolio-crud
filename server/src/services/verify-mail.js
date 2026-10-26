import 'dotenv/config';
import { verifyTransporter } from './mail.js';

console.log('🔄 Comprobando configuración de correo en .env...');
console.log(`MAIL_USER: ${process.env.MAIL_USER ? process.env.MAIL_USER : '(no configurado)'}`);
console.log(`MAIL_APP_PASSWORD: ${process.env.MAIL_APP_PASSWORD ? '****** (configurado, longitud: ' + process.env.MAIL_APP_PASSWORD.replace(/\s+/g, '').length + ')' : '(no configurado)'}`);

verifyTransporter()
  .then(() => {
    console.log('✅ Conexión SMTP con Gmail exitosa. Las credenciales son válidas y el servidor está listo para enviar correos.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error al autenticar con el servidor de correo:');
    console.error(err.message);
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      console.error('\n💡 Pista: Si el error es 535 Username and Password not accepted:');
      console.error('1. Asegurate de usar una "Contraseña de Aplicación" de Google (16 caracteres), no tu contraseña normal.');
      console.error('2. La cuenta de Google debe tener activada la Verificación en 2 Pasos.');
      console.error('3. Verificá que no haya espacios extras o errores de tipeo en MAIL_USER.');
    }
    process.exit(1);
  });
