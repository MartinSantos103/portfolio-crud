import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getPool, closePool } from './pool.js';
import { applySchema } from './schema.js';

async function runSeed() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const hasForceFlag = process.argv.includes('--force');

  if (isProduction && !hasForceFlag) {
    console.error('⛔ ERROR: Se detectó un entorno de producción.');
    console.error('El script de seed inserta o altera datos de desarrollo.');
    console.error('Para forzar la ejecución en producción, ejecuta: npm run seed -- --force');
    process.exit(1);
  }

  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🔄 Aplicando esquema de base de datos (schema.sql)...');
    await applySchema(client);
    console.log('✅ Tablas e índices verificados/creados correctamente.');

    console.log('🔄 Generando credenciales de prueba con bcrypt...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    await client.query(`
      INSERT INTO users (name, email, password_hash, role, active)
      VALUES 
        ('Administrador', 'admin@pf.local', $1, 'admin', TRUE),
        ('Usuario Prueba', 'user@pf.local', $2, 'user', TRUE)
      ON CONFLICT (lower(email)) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        active = EXCLUDED.active;
    `, [adminHash, userHash]);
    console.log('✅ Usuarios de prueba creados/actualizados (admin@pf.local y user@pf.local).');

    await client.query(`
      INSERT INTO profile (id, full_name, headline, bio, contact_email)
      VALUES (1, 'Desarrollador Fullstack', 'React & Node.js Developer', 'Perfil de lienzo inicial', 'contacto@pf.local')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Registro de perfil base inicializado.');

    console.log('🎉 Seed completado exitosamente.');
  } finally {
    client.release();
    await closePool();
  }
}

runSeed().catch((err) => {
  console.error('❌ Error al ejecutar el seed:', err);
  process.exit(1);
});
