import { query } from './pool.js';

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0];
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

export async function touchLastLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

// Forma pública del usuario: lo único que sale hacia el frontend.
export function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
