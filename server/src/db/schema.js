import { readFile } from 'node:fs/promises';

const schemaPath = new URL('./schema.sql', import.meta.url);
const migration002Path = new URL('./migrations/002_admin_spec_alignment.sql', import.meta.url);

// Ejecuta schema.sql y las migraciones idempotentes con el cliente recibido.
export async function applySchema(client) {
  const sql = await readFile(schemaPath, 'utf8');
  await client.query(sql);

  const migration002Sql = await readFile(migration002Path, 'utf8');
  await client.query(migration002Sql);
}
