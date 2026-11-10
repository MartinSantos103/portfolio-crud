import 'dotenv/config';
import pg from 'pg';

let pool;

const TRANSIENT_ERROR_CODES = new Set([
  '57P01',
  '57P02',
  '57P03',
  '08000',
  '08003',
  '08006',
  '08001',
  '08004',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ECONNREFUSED',
  'EAI_AGAIN',
]);

function normalizeConnectionString(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const sslmode = parsed.searchParams.get('sslmode');
    if (
      (sslmode === 'require' || sslmode === 'prefer' || sslmode === 'verify-ca') &&
      !parsed.searchParams.has('uselibpqcompat')
    ) {
      parsed.searchParams.set('uselibpqcompat', 'true');
      return parsed.toString();
    }
  } catch {
    // Mantener cadena original si no es una URL estándar
  }
  return rawUrl;
}

export function isTransientConnectionError(err) {
  if (!err) return false;
  if (err.code && TRANSIENT_ERROR_CODES.has(err.code)) return true;
  const msg = String(err.message || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection error') ||
    msg.includes('terminating connection') ||
    msg.includes('client has encountered a connection error') ||
    msg.includes('socket hang up') ||
    msg.includes('timeout expired')
  );
}

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('Falta DATABASE_URL. Copiá .env.example como .env y completalo.');
    }
    const isServerless = Boolean(process.env.VERCEL);
    const instance = new pg.Pool({
      connectionString: normalizeConnectionString(process.env.DATABASE_URL),
      max: isServerless ? 3 : 5,
      idleTimeoutMillis: isServerless ? 1000 : 10000,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: true,
      keepAlive: true,
    });

    instance.on('error', (err) => {
      console.error('Error en una conexión inactiva de la base:', err.message);
    });

    const rawConnect = instance.connect.bind(instance);
    instance.connect = async (...args) => {
      if (args.length > 0) return rawConnect(...args);
      let lastErr;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const client = await rawConnect();
          const onError = (err) => {
            console.error('Error en cliente activo de PostgreSQL:', err.message);
          };
          client.on('error', onError);
          const rawRelease = client.release.bind(client);
          client.release = (err) => {
            client.removeListener('error', onError);
            return rawRelease(err);
          };
          return client;
        } catch (err) {
          lastErr = err;
          if (!isTransientConnectionError(err) || attempt === 2) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        }
      }
      throw lastErr;
    };

    pool = instance;
  }
  return pool;
}

export async function query(text, params) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await getPool().query(text, params);
    } catch (err) {
      lastErr = err;
      if (!isTransientConnectionError(err) || attempt === 2) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }
  throw lastErr;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export default { getPool, query, closePool, isTransientConnectionError };
