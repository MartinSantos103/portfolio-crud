import 'dotenv/config';
import pg from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Falta DATABASE_URL. Copiá .env.example como .env y completalo.');
    }
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
    pool.on('error', (err) => console.error('Error en una conexión inactiva de la base:', err.message));
  }
  return pool;
}

export const query = (text, params) => getPool().query(text, params);

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export default { getPool, query, closePool };