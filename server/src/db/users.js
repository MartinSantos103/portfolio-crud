import { query } from './pool.js';

export async function findUserByEmail(email) {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0];
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

export async function findUserByGoogleId(googleId) {
  const { rows } = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0];
}

export async function linkGoogleId(id, googleId) {
  const { rows } = await query(
    'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
    [googleId, id]
  );
  return rows[0];
}

export async function touchLastLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

export async function createUser({ name, email, passwordHash, role = 'user' }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role, active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id, name, email, role, active, created_at`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

export async function createUserWithGoogle({ name, email, googleId, role = 'user' }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, google_id, role, active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id, name, email, google_id, role, active, created_at`,
    [name, email, googleId, role]
  );
  return rows[0];
}

// Forma pública del usuario: lo único que sale hacia el frontend.
export function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}
