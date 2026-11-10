import { readFile } from 'node:fs/promises';

const schemaPath = new URL('./schema.sql', import.meta.url);
const migration002Path = new URL('./migrations/002_admin_spec_alignment.sql', import.meta.url);
const migration003Path = new URL('./migrations/003_single_admin_constraint.sql', import.meta.url);

// Ejecuta schema.sql y las migraciones idempotentes con el cliente recibido.
export async function applySchema(client) {
  const sql = await readFile(schemaPath, 'utf8');
  await client.query(sql);

  const migration002Sql = await readFile(migration002Path, 'utf8');
  await client.query(migration002Sql);

  const migration003Sql = await readFile(migration003Path, 'utf8');
  await client.query(migration003Sql);
}
