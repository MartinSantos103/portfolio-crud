import process from 'node:process';
process.env.NODE_ENV = 'test';

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Pruebas de Autenticación y Autorización por Rol', () => {
  let server;
  let baseUrl;
  let adminToken;
  let userToken;
  let closePool;

  before(async () => {
    // Importamos dinámicamente app y pool luego de setear NODE_ENV='test'
    // para evitar que Express levante el listener por defecto en el puerto 3000.
    const { default: app } = await import('../src/app.js');
    const poolModule = await import('../src/db/pool.js');
    closePool = poolModule.closePool;

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/api`;
  });

  after(async () => {
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

  test('3. Ruta protegida con requireRole(\'admin\') - Responde 401 cuando no hay token', async () => {
    const res = await fetch(`${baseUrl}/admin/ping`, {
      method: 'GET',
    });

    assert.equal(res.status, 401, 'Debe responder con status 401');
    const data = await res.json();

    assert.equal(data.error?.code, 'UNAUTHORIZED', 'El código de error debe ser UNAUTHORIZED');
    assert.equal(data.error?.message, 'Falta el token de sesión', 'El mensaje debe indicar falta de token');
  });

  test('4. Ruta protegida con requireRole(\'admin\') - Responde 403 cuando entra un usuario común', async () => {
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
});
