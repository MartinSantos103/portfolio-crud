import process from 'node:process';
process.env.NODE_ENV = 'test';

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { OAuth2Client } from 'google-auth-library';

describe('Pruebas de Autenticación y Autorización por Rol', () => {
  let server;
  let baseUrl;
  let adminToken;
  let userToken;
  let closePool;
  let query;
  const cleanupEmails = [];

  before(async () => {
    // Importamos dinámicamente app y pool luego de setear NODE_ENV='test'
    // para evitar que Express levante el listener por defecto en el puerto 3000.
    const { default: app } = await import('../src/app.js');
    const poolModule = await import('../src/db/pool.js');
    closePool = poolModule.closePool;
    query = poolModule.query;

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  after(async () => {
    if (query && cleanupEmails.length > 0) {
      await query('DELETE FROM users WHERE email = ANY($1)', [cleanupEmails]);
    }
    if (server) {
      server.closeAllConnections?.();
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
    if (closePool) {
      await closePool();
    }
  });

  test('1. POST /api/auth/login - Administrador de prueba obtiene token y datos de usuario', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pf.local',
        password: 'admin123',
      }),
    });

    assert.equal(res.status, 200, 'El status debe ser 200');
    const data = await res.json();

    assert.ok(data.token, 'La respuesta debe incluir una propiedad token');
    assert.equal(typeof data.token, 'string', 'El token debe ser un string');
    assert.ok(data.token.split('.').length === 3, 'El token debe tener formato JWT');

    assert.ok(data.user, 'La respuesta debe incluir los datos del usuario');
    assert.equal(data.user.email, 'admin@pf.local', 'El correo debe ser admin@pf.local');
    assert.equal(data.user.role, 'admin', 'El rol debe ser admin');
    assert.equal(data.user.password_hash, undefined, 'No debe filtrar password_hash');

    adminToken = data.token;
  });

  test('2. GET /api/auth/me - Devuelve el usuario correspondiente con el token del administrador', async () => {
    assert.ok(adminToken, 'Se requiere el token del administrador');

    const res = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200, 'El status debe ser 200');
    const data = await res.json();

    assert.ok(data.user, 'La respuesta debe incluir el objeto user');
    assert.equal(data.user.email, 'admin@pf.local', 'El email devuelto debe coincidir');
    assert.equal(data.user.role, 'admin', 'El rol devuelto debe ser admin');
    assert.ok(data.user.id, 'Debe incluir el id del usuario');
  });

  test("3. Ruta protegida con requireRole('admin') - Responde 401 cuando no hay token", async () => {
    const res = await fetch(`${baseUrl}/admin/ping`, {
      method: 'GET',
    });

    assert.equal(res.status, 401, 'Debe responder con status 401');
    const data = await res.json();

    assert.equal(data.error?.code, 'UNAUTHORIZED', 'El código de error debe ser UNAUTHORIZED');
    assert.equal(data.error?.message, 'Falta el token de sesión', 'El mensaje debe indicar falta de token');
  });

  test("4. Ruta protegida con requireRole('admin') - Responde 403 cuando entra un usuario común", async () => {
    // 4.1 Iniciar sesión como usuario común
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@pf.local',
        password: 'user123',
      }),
    });

    assert.equal(loginRes.status, 200, 'El login del usuario común debe responder 200');
    const loginData = await loginRes.json();
    assert.ok(loginData.token, 'Debe obtener token de usuario');
    assert.equal(loginData.user.role, 'user', 'El rol del usuario común debe ser user');
    userToken = loginData.token;

    // 4.2 Intentar acceder a la ruta de administrador con el token de usuario común
    const pingRes = await fetch(`${baseUrl}/admin/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    assert.equal(pingRes.status, 403, 'Debe responder con status 403 Forbidden');
    const pingData = await pingRes.json();

    assert.equal(pingData.error?.code, 'FORBIDDEN', 'El código de error debe ser FORBIDDEN');
    assert.equal(
      pingData.error?.message,
      'No tenés permiso para esta acción',
      'El mensaje debe indicar falta de permisos'
    );
  });

  test('5. Verificación complementaria: Administrador accede exitosamente (200) a la ruta protegida', async () => {
    assert.ok(adminToken, 'Se requiere el token del administrador');

    const res = await fetch(`${baseUrl}/admin/ping`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200, 'El administrador debe recibir status 200');
    const data = await res.json();

    assert.equal(data.ok, true);
    assert.equal(data.message, 'Acceso autorizado de administrador');
    assert.equal(data.user?.role, 'admin');
  });

  test('6. POST /api/auth/register - Registra nuevo usuario (201) y rechaza duplicados (409)', async () => {
    const testEmail = `newuser_${Date.now()}@pf.local`;
    cleanupEmails.push(testEmail);

    // 6.1 Registro exitoso
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nuevo Usuario Test',
        email: testEmail,
        password: 'password123',
      }),
    });

    assert.equal(res.status, 201, 'El status debe ser 201 Created');
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.user, 'Debe incluir los datos del usuario registrado');
    assert.equal(data.user.email, testEmail);
    assert.equal(data.user.role, 'user');
    assert.equal(data.user.password_hash, undefined, 'No debe exponer password_hash');

    // 6.2 Intento de registrar el mismo correo duplicado
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Otro Usuario',
        email: testEmail,
        password: 'password123',
      }),
    });

    assert.equal(dupRes.status, 409, 'El status de correo duplicado debe ser 409 Conflict');
    const dupData = await dupRes.json();
    assert.equal(dupData.error?.code, 'USER_EXISTS');
  });

  test('7. POST /api/auth/google - Rechaza petición sin credential (400) y token inválido (401)', async () => {
    const emptyRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(emptyRes.status, 400);
    const emptyData = await emptyRes.json();
    assert.equal(emptyData.error?.code, 'VALIDATION');

    const invalidRes = await fetch(`${baseUrl}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid.jwt.token' }),
    });
    assert.equal(invalidRes.status, 401);
    const invalidData = await invalidRes.json();
    assert.equal(invalidData.error?.code, 'INVALID_GOOGLE_TOKEN');
  });

  test('8. POST /api/auth/google - Crea usuario nuevo con Google y vincula cuenta existente', async () => {
    const googleEmail = `googleuser_${Date.now()}@pf.local`;
    const googleSub = `google_sub_${Date.now()}`;
    cleanupEmails.push(googleEmail);

    const originalVerify = OAuth2Client.prototype.verifyIdToken;
    OAuth2Client.prototype.verifyIdToken = async () => ({
      getPayload: () => ({
        sub: googleSub,
        email: googleEmail,
        name: 'Usuario Google Test',
        email_verified: true,
      }),
    });

    try {
      // 8.1 Creación de usuario nuevo vía Google
      const res1 = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'mocked_valid_google_token' }),
      });

      assert.equal(res1.status, 200);
      const data1 = await res1.json();
      assert.equal(data1.ok, true);
      assert.ok(data1.token);
      assert.equal(data1.user.email, googleEmail);
      assert.equal(data1.user.name, 'Usuario Google Test');
      assert.equal(data1.user.role, 'user');

      // 8.2 Re-ingreso del mismo usuario vía Google
      const res2 = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'mocked_valid_google_token' }),
      });

      assert.equal(res2.status, 200);
      const data2 = await res2.json();
      assert.equal(data2.user.id, data1.user.id, 'Debe reutilizar el mismo usuario');
    } finally {
      OAuth2Client.prototype.verifyIdToken = originalVerify;
    }
  });
});
