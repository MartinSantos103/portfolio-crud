import { apiFetch } from './api.js';

const RESERVED_GITHUB_PATHS = new Set([
  'about',
  'collections',
  'contact',
  'customer-stories',
  'enterprise',
  'events',
  'explore',
  'features',
  'issues',
  'login',
  'marketplace',
  'new',
  'notifications',
  'orgs',
  'organizations',
  'pricing',
  'pulls',
  'readme',
  'search',
  'security',
  'settings',
  '⁶',
  ' signup',
  'sponsors',
  'team',
  'topics',
  'trending',
  'users',
]);

/**
 * Extrae { owner, repo } de una URL de repositorio de GitHub válida.
 * Devuelve null si la URL es genérica (ej. https://github.com) o de otro dominio.
 */
export function parseGitHubRepoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') {
      return null;
    }

    const parts = parsed.pathname
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length < 2) return null;

    const [owner, rawRepo] = parts;
    if (RESERVED_GITHUB_PATHS.has(owner.toLowerCase())) {
      return null;
    }

    const repo = rawRepo.replace(/\.git$/i, '');
    if (!owner || !repo) return null;

    return { owner, repo };
  } catch {
    return null;
  }
}

/**
 * Lista los repositorios públicos del perfil de GitHub configurado en el servidor.
 */
/**
 * Obtiene los datos del perfil público de GitHub (incluye avatar_url, username, bio).
 * Si no se pasa username, utiliza el configurado en GITHUB_USERNAME en el servidor.
 */
export async function fetchGitHubProfile(username = '') {
  const query = username.trim() ? `?username=${encodeURIComponent(username.trim())}` : '';
  const res = await apiFetch(`/github/profile${query}`);
  return res?.data || null;
}

export async function fetchGitHubRepos(search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const res = await apiFetch(`/github/repos${query}`);
  return Array.isArray(res?.data) ? res.data : [];
}

/**
 * Obtiene el detalle de un repositorio (estrellas, forks y lenguajes con %).
 */
export async function fetchGitHubRepoDetails(ownerOrRepo, optionalRepo) {
  const path = optionalRepo
    ? `/github/repos/${encodeURIComponent(ownerOrRepo)}/${encodeURIComponent(optionalRepo)}`
    : `/github/repos/${encodeURIComponent(ownerOrRepo)}`;
  const res = await apiFetch(path);
  return res?.data || null;
}

const LANGUAGE_TO_TECH_KEY = {
  javascript: 'javascript',
  js: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  html: 'html5',
  html5: 'html5',
  css: 'css3',
  css3: 'css3',
  scss: 'sass',
  sass: 'sass',
  python: 'python',
  java: 'java',
  php: 'php',
  vue: 'vue',
  vuejs: 'vue',
  react: 'react',
  reactjs: 'react',
  nextjs: 'nextjs',
  next: 'nextjs',
  angular: 'angular',
  svelte: 'svelte',
  tailwind: 'tailwind',
  tailwindcss: 'tailwind',
  bootstrap: 'bootstrap',
  redux: 'redux',
  vite: 'vite',
  vitejs: 'vite',
  node: 'nodejs',
  nodejs: 'nodejs',
  express: 'express',
  expressjs: 'express',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  plpgsql: 'postgresql',
  sql: 'postgresql',
  mysql: 'mysql',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  prisma: 'prisma',
  graphql: 'graphql',
  docker: 'docker',
  dockerfile: 'docker',
  git: 'git',
  github: 'github',
  vercel: 'vercel',
  figma: 'figma',
};

/**
 * Convierte el nombre de un repositorio (ej. "portfolio-Leng4") en un título legible.
 */
export function formatRepoTitle(repoName = '') {
  const cleaned = String(repoName)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Mapea los lenguajes y topics de un repositorio de GitHub a las claves de tecnologías del portfolio.
 */
export function matchRepoTechnologies(repo, availableStack = []) {
  const candidates = new Set();

  if (repo?.language) {
    candidates.add(String(repo.language).toLowerCase().trim());
  }

  if (Array.isArray(repo?.languages)) {
    repo.languages.forEach((l) => {
      if (l?.name) candidates.add(String(l.name).toLowerCase().trim());
    });
  }

  if (Array.isArray(repo?.topics)) {
    repo.topics.forEach((t) => {
      if (t) candidates.add(String(t).toLowerCase().trim());
    });
  }

  // Detectar pistas en nombre o descripción del repo
  const textHints = `${repo?.name || ''} ${repo?.description || ''}`.toLowerCase();
  ['react', 'vite', 'tailwind', 'node', 'express', 'postgres', 'mongodb', 'mysql', 'next', 'typescript', 'python'].forEach(
    (kw) => {
      if (textHints.includes(kw)) candidates.add(kw);
    }
  );

  const availableKeys = new Set(
    availableStack.map((item) => String(item.icon_key || item.id || '').toLowerCase())
  );

  const matched = new Set();

  candidates.forEach((raw) => {
    const mappedKey = LANGUAGE_TO_TECH_KEY[raw] || raw.replace(/[^a-z0-9]/g, '');
    if (availableKeys.size === 0 || availableKeys.has(mappedKey)) {
      matched.add(mappedKey);
    } else {
      // Buscar coincidencia parcial con el nombre en el stack del perfil
      const stackMatch = availableStack.find(
        (s) =>
          String(s.name || '').toLowerCase() === raw ||
          String(s.id || '').toLowerCase() === mappedKey
      );
      if (stackMatch) {
        matched.add(stackMatch.icon_key || stackMatch.id);
      }
    }
  });

  return Array.from(matched);
}
