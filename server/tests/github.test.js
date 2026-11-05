import process from 'node:process';
process.env.NODE_ENV = 'test';

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { computeLanguagesBreakdown } from '../src/services/github.js';

describe('Pruebas de Integración de GitHub API (/api/github)', () => {
  let server;
  let baseUrl;
  let firstRepoName = null;

  before(async () => {
    const { default: app } = await import('../src/app.js');
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
  });

  test('1. computeLanguagesBreakdown - Calcula porcentajes y colores correctamente', () => {
    const breakdown = computeLanguagesBreakdown({
      JavaScript: 7500,
      CSS: 1500,
      HTML: 1000,
    });

    assert.equal(breakdown.length, 3);
    assert.equal(breakdown[0].name, 'JavaScript');
    assert.equal(breakdown[0].percentage, 75);
    assert.equal(breakdown[0].color, '#f1e05a');

    assert.equal(breakdown[1].name, 'CSS');
    assert.equal(breakdown[1].percentage, 15);

    assert.equal(breakdown[2].name, 'HTML');
    assert.equal(breakdown[2].percentage, 10);
  });

  test('2. GET /api/github/status - Verifica credenciales y conexión con GitHub', async () => {
    const res = await fetch(`${baseUrl}/github/status`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.connected, true);
    assert.equal(body.data.authenticated, true);
    assert.ok(body.data.username, 'Debe devolver el nombre de usuario de GitHub');
  });

  test('3. GET /api/github/profile - Obtiene información pública del perfil', async () => {
    const res = await fetch(`${baseUrl}/github/profile`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(body.data.username);
    assert.equal(typeof body.data.public_repos, 'number');
  });

  test('4. GET /api/github/repos - Lista repositorios y permite filtrar por nombre (?search=...)', async () => {
    const res = await fetch(`${baseUrl}/github/repos`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.data), 'Debe devolver un arreglo de repositorios');
    assert.ok(body.data.length > 0, 'El usuario debe tener al menos un repositorio');

    firstRepoName = body.data[0].name;
    const searchFragment = firstRepoName.slice(0, 4);

    const searchRes = await fetch(
      `${baseUrl}/github/repos?search=${encodeURIComponent(searchFragment)}`
    );
    assert.equal(searchRes.status, 200);
    const searchBody = await searchRes.json();
    assert.equal(searchBody.ok, true);
    assert.ok(
      searchBody.data.some((r) => r.name === firstRepoName),
      'El filtro de búsqueda debe encontrar el repositorio por nombre'
    );
  });

  test('5. GET /api/github/repos/:repo - Devuelve estrellas, forks y desglose porcentual de lenguajes', async () => {
    assert.ok(firstRepoName, 'Se requiere un nombre de repositorio previo');
    const res = await fetch(
      `${baseUrl}/github/repos/${encodeURIComponent(firstRepoName)}`
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.data.name, firstRepoName);
    assert.equal(typeof body.data.stargazers_count, 'number');
    assert.equal(typeof body.data.forks_count, 'number');
    assert.ok(Array.isArray(body.data.languages), 'Debe incluir el arreglo de lenguajes con %');
  });

  test('6. GET /api/github/repos/:repo - Devuelve 404 ante un repositorio inexistente', async () => {
    const res = await fetch(
      `${baseUrl}/github/repos/repo-que-no-existe-99999999`
    );
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.ok, false);
    assert.equal(body.error.code, 'GITHUB_NOT_FOUND');
  });
});
