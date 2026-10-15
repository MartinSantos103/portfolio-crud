import { readFile } from 'node:fs/promises';

const schemaPath = new URL('./schema.sql', import.meta.url);

// Ejecuta schema.sql con el cliente recibido. Se puede repetir sin efectos secundarios.
export async function applySchema(client) {
  const sql = await readFile(schemaPath, 'utf8');
  await client.query(sql);
}
