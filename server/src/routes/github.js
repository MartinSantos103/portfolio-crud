import { Router } from 'express';
import {
  checkGitHubStatus,
  getGitHubProfile,
  getGitHubRepos,
  getGitHubRepoDetails,
} from '../services/github.js';

const router = Router();

function handleGitHubError(err, res, next) {
  if (err.status) {
    return res.status(err.status).json({
      ok: false,
      error: {
        code: err.code || 'GITHUB_ERROR',
        message: err.message,
      },
    });
  }
  return next(err);
}

/**
 * GET /api/github/status
 * Verifica la configuración y conectividad con la API de GitHub.
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await checkGitHubStatus();
    res.json({ ok: true, data: status });
  } catch (err) {
    handleGitHubError(err, res, next);
  }
});

/**
 * GET /api/github/profile
 * Devuelve los datos del perfil público de GitHub configurado.
 */
router.get('/profile', async (req, res, next) => {
  try {
    const profile = await getGitHubProfile(req.query.username);
    res.json({ ok: true, data: profile });
  } catch (err) {
    handleGitHubError(err, res, next);
  }
});

/**
 * GET /api/github/repos
 * Lista los repositorios públicos del perfil con filtro de búsqueda opcional (?search=...).
 */
router.get('/repos', async (req, res, next) => {
  try {
    const { search = '', sort = 'updated', per_page = 100 } = req.query;
    const repos = await getGitHubRepos({ search, sort, per_page });
    res.json({ ok: true, data: repos });
  } catch (err) {
    handleGitHubError(err, res, next);
  }
});

/**
 * GET /api/github/repos/:owner/:repo
 * Devuelve estrellas, forks y desglose de lenguajes con porcentaje de un repositorio por owner/repo.
 */
router.get('/repos/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const details = await getGitHubRepoDetails(owner, repo);
    res.json({ ok: true, data: details });
  } catch (err) {
    handleGitHubError(err, res, next);
  }
});

/**
 * GET /api/github/repos/:repo
 * Devuelve estrellas, forks y desglose de lenguajes del repositorio bajo el GITHUB_USERNAME configurado.
 */
router.get('/repos/:repo', async (req, res, next) => {
  try {
    const { repo } = req.params;
    const details = await getGitHubRepoDetails(repo);
    res.json({ ok: true, data: details });
  } catch (err) {
    handleGitHubError(err, res, next);
  }
});

export default router;
