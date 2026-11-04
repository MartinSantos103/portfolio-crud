import process from 'node:process';
process.env.NODE_ENV = 'test';

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Pruebas Integrales del Panel de Administración (CMS Portfolio v2)', () => {
  let server;
  let baseUrl;
  let adminToken;
  let adminUser;
  let closePool;

  let createdProjectId;
  let createdDemoId;
  let createdServiceId;
  let createdMessageId;

  before(async () => {
    const { default: app } = await import('../src/app.js');
    const poolModule = await import('../src/db/pool.js');
    closePool = poolModule.closePool;

    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}/api`;

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
    adminUser = loginData.user;
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

  test('1. GET y PUT /api/profile - Obtiene y actualiza el perfil profesional singleton (Lucas Andrade)', async () => {
    const getRes = await fetch(`${baseUrl}/profile`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.ok, true);
    assert.equal(getBody.data.full_name, 'Lucas Andrade');
    assert.equal(getBody.data.headline, 'Desarrollador Web Full Stack');

    const current = getBody.data;
    const putRes = await fetch(`${baseUrl}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        ...current,
        full_name: 'Lucas Andrade',
        headline: 'Desarrollador Web Full Stack',
        available: true,
      }),
    });
    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.equal(putBody.ok, true);
    assert.equal(putBody.data.full_name, 'Lucas Andrade');
    assert.equal(putBody.data.headline, 'Desarrollador Web Full Stack');
    assert.equal(putBody.data.available, true);
  });

  test('2. CRUD de Proyectos y cambio de estado (POST, PATCH status, PUT)', async () => {
    const uniqueSlug = `proyecto-test-admin-${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Proyecto de Prueba CMS v2',
        slug: uniqueSlug,
        description: 'Resumen corto para tarjeta de visitante.',
        problem: 'Problema técnico detallado.',
        solution: 'Solución arquitectónica implementada.',
        tech_decisions: 'PostgreSQL y React.',
        technologies: ['react', 'nodejs', 'postgresql'],
        featured: false,
        published: false,
        images: [{ url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', alt: 'Demo' }],
      }),
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.ok, true);
    assert.equal(createBody.data.slug, uniqueSlug);
    assert.equal(createBody.data.published, false);
    createdProjectId = createBody.data.id;

    // PATCH /:id/status -> publicar
    const statusRes = await fetch(`${baseUrl}/projects/${createdProjectId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ published: true, featured: true }),
    });
    assert.equal(statusRes.status, 200);
    const statusBody = await statusRes.json();
    assert.equal(statusBody.data.published, true);
    assert.equal(statusBody.data.featured, true);
  });

  test('3. CRUD de Demos Polimórficas vinculadas a un proyecto (POST, GET, DELETE)', async () => {
    assert.ok(createdProjectId, 'Se requiere proyecto creado');

    const createRes = await fetch(`${baseUrl}/demos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        project_id: createdProjectId,
        title: 'Galería Interactiva de Capturas',
        description: 'Recorrido visual de pantallas.',
        type: 'imagenes',
        urls: [
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
        ],
      }),
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.ok, true);
    assert.equal(createBody.data.type, 'imagenes');
    assert.equal(createBody.data.urls.length, 2);
    createdDemoId = createBody.data.id;

    // Eliminar demo y limpiar proyecto de prueba
    const delDemoRes = await fetch(`${baseUrl}/demos/${createdDemoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delDemoRes.status, 200);

    const delProjRes = await fetch(`${baseUrl}/projects/${createdProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delProjRes.status, 200);
  });

  test('4. CRUD de Servicios y cambio de estado (POST, PATCH status, DELETE)', async () => {
    const createRes = await fetch(`${baseUrl}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Auditoría de Arquitectura Fullstack',
        description: 'Revisión integral de seguridad, consultas SQL y rendimiento.',
        icon: 'shield',
        items: ['Análisis de índices SQL', 'Pruebas de carga', 'Reporte ejecutivo'],
        active: true,
      }),
    });

    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.ok, true);
    assert.equal(createBody.data.items.length, 3);
    createdServiceId = createBody.data.id;

    const statusRes = await fetch(`${baseUrl}/services/${createdServiceId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active: false }),
    });
    assert.equal(statusRes.status, 200);
    const statusBody = await statusRes.json();
    assert.equal(statusBody.data.active, false);

    const delRes = await fetch(`${baseUrl}/services/${createdServiceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(delRes.status, 200);
  });

  test('5. POST /api/messages/:id/reply - Si falla SMTP (502), NO cambia estado a respondido ni guarda respuesta', async () => {
    // 5.1 Crear mensaje de prueba
    const msgRes = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'asesoria',
        nombre: 'Cliente Test SMTP',
        email: 'cliente-smtp@example.com',
        asunto: 'Consulta sobre arquitectura',
        mensaje: 'Necesito validar el flujo transaccional de correo.',
        tema_tecnico: 'Node.js + PostgreSQL',
        modalidad: 'Videollamada',
      }),
    });
    assert.equal(msgRes.status, 201);
    const msgBody = await msgRes.json();
    createdMessageId = msgBody.data.id;

    // 5.2 Simular fallo SMTP en /reply -> debe responder 502 Bad Gateway
    const replyFailRes = await fetch(`${baseUrl}/messages/${createdMessageId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        body: 'Esta respuesta simula un corte SMTP y no debe alterar el estado en BD.',
        simulateSmtpFailure: true,
      }),
    });
    assert.equal(replyFailRes.status, 502);
    const replyFailBody = await replyFailRes.json();
    assert.equal(replyFailBody.error.code, 'SMTP_ERROR');

    // 5.3 Verificar que el mensaje sigue en estado 'nuevo' y sin respuestas registradas
    const detailRes = await fetch(`${baseUrl}/messages/${createdMessageId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.equal(detailBody.data.status, 'nuevo');
    assert.equal(detailBody.data.replies.length, 0);

    // 5.4 Limpiar mensaje de prueba
    await fetch(`${baseUrl}/messages/${createdMessageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  });

  test('6. PATCH /api/users/:id - Impide auto-bloqueo y auto-degradación (400 SELF_LOCKOUT)', async () => {
    assert.ok(adminUser?.id, 'Se requiere ID del administrador en sesión');

    // Intento de auto-desactivación
    const resDeactivate = await fetch(`${baseUrl}/users/${adminUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ active: false }),
    });
    assert.equal(resDeactivate.status, 400);
    const bodyDeactivate = await resDeactivate.json();
    assert.equal(bodyDeactivate.error.code, 'SELF_LOCKOUT');

    // Intento de auto-degradación a user
    const resDemote = await fetch(`${baseUrl}/users/${adminUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'user' }),
    });
    assert.equal(resDemote.status, 400);
    const bodyDemote = await resDemote.json();
    assert.equal(bodyDemote.error.code, 'SELF_LOCKOUT');
  });

  test('7. GET /api/metrics y /api/metrics/summary - Calcula series con ceros y aplica regla > 90 días', async () => {
    const summaryRes = await fetch(`${baseUrl}/metrics/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(summaryRes.status, 200);
    const summaryBody = await summaryRes.json();
    assert.equal(summaryBody.ok, true);
    assert.equal(typeof summaryBody.data.kpis.totalSessions, 'number');

    // Consulta con rango mayor a 90 días pidiendo groupBy=day -> debe forzar groupBy=week
    const metricsRes = await fetch(
      `${baseUrl}/metrics?from=2025-01-01&to=2025-06-01&groupBy=day&projectSegment=all`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert.equal(metricsRes.status, 200);
    const metricsBody = await metricsRes.json();
    assert.equal(metricsBody.ok, true);
    assert.equal(metricsBody.data.filters.groupBy, 'week');
    assert.ok(Array.isArray(metricsBody.data.sessionsSeries));
    assert.ok(Array.isArray(metricsBody.data.usersSeries));
    assert.equal(metricsBody.data.messagesDistribution.length, 3);
  });
});
