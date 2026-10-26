import process from 'node:process';
process.env.NODE_ENV = 'test';

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Pruebas del Módulo de Mensajes y Notificaciones', () => {
  let server;
  let baseUrl;
  let adminToken;
  let closePool;
  let createdMessageId;

  before(async () => {
    const { default: app } = await import('../src/app.js');
    const poolModule = await import('../src/db/pool.js');
    closePool = poolModule.closePool;

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/api`;

    // Obtener token de admin mediante login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@pf.local',
        password: 'admin123',
      }),
    });
    const loginData = await loginRes.json();
    adminToken = loginData.token;
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

  test('1. POST /api/messages - Rechaza si faltan campos obligatorios (400)', async () => {
    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Prueba Incompleta',
        email: 'test@example.com',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error.code, 'VALIDATION');
  });

  test('2. POST /api/messages - Rechaza tipo de consulta inválido (400)', async () => {
    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'invalido',
        nombre: 'Usuario Prueba',
        email: 'test@example.com',
        asunto: 'Asunto de prueba',
        mensaje: 'Cuerpo del mensaje',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error.code, 'INVALID_TYPE');
  });

  test('3. POST /api/messages - Rechaza email con formato inválido (400)', async () => {
    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'consulta',
        nombre: 'Usuario Prueba',
        email: 'correo-sin-arroba',
        asunto: 'Asunto de prueba',
        mensaje: 'Cuerpo del mensaje',
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.ok, false);
    assert.equal(data.error.code, 'INVALID_EMAIL');
  });

  test('4. POST /api/messages - Registra mensaje válido de cotización con campos extra (201)', async () => {
    const payload = {
      tipo: 'cotizacion',
      nombre: 'Juan Pérez',
      email: 'juan@empresa.com',
      asunto: 'Desarrollo de plataforma SaaS',
      mensaje: 'Requerimos presupuesto para un MVP fullstack.',
      tipo_proyecto: 'Aplicación Web',
      presupuesto: 'USD 2000',
      plazo: '2 meses',
    };

    const res = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(data.data.id, 'Debe devolver el id generado');
    assert.equal(data.data.tipo, 'cotizacion');
    assert.equal(data.data.nombre, 'Juan Pérez');
    assert.equal(data.data.estado, 'nuevo');

    createdMessageId = data.data.id;
  });

  test('5. GET /api/messages - Rechaza acceso a usuarios no autorizados (401)', async () => {
    const res = await fetch(`${baseUrl}/messages`);
    assert.equal(res.status, 401);
  });

  test('6. GET /api/messages - Administrador puede listar los mensajes (200)', async () => {
    const res = await fetch(`${baseUrl}/messages`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.ok(Array.isArray(data.data), 'La respuesta debe ser un arreglo de mensajes');
    const encontrado = data.data.find((m) => m.id === createdMessageId);
    assert.ok(encontrado, 'El mensaje creado debe estar en la lista devuelta');
    assert.equal(encontrado.extra.presupuesto, 'USD 2000');
  });

  test('7. PATCH /api/messages/:id/status - Administrador puede actualizar el estado (200)', async () => {
    assert.ok(createdMessageId, 'Se requiere el ID del mensaje creado');

    const res = await fetch(`${baseUrl}/messages/${createdMessageId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'leido' }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.data.status, 'leido');
  });

  test('8. DELETE /api/messages/:id - Administrador puede eliminar el mensaje (200)', async () => {
    assert.ok(createdMessageId, 'Se requiere el ID del mensaje creado');

    const res = await fetch(`${baseUrl}/messages/${createdMessageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.ok, true);
    assert.equal(data.id, createdMessageId);
  });
});
