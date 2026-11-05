import config from '../config.js';

const GITHUB_API_BASE = 'https://api.github.com';

// Colores oficiales de GitHub Linguist para los lenguajes más frecuentes
export const GITHUB_LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Python: '#3572A5',
  Java: '#b07219',
  'C#': '#178600',
  'C++': '#f34b7d',
  C: '#555555',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Shell: '#89e051',
  PowerShell: '#012456',
  Dockerfile: '#384d54',
  SQL: '#e38c00',
  PLpgSQL: '#336790',
  Astro: '#ff5a03',
};

// Caché ligero en memoria para evitar llamadas repetitivas innecesarias
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

export function clearGitHubCache() {
  cache.clear();
}

function getCached(key) {
  if (process.env.NODE_ENV === 'test') return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  if (process.env.NODE_ENV === 'test') return;
  cache.set(key, { data, timestamp: Date.now() });
}

export function getGitHubCredentials() {
  const username = (process.env.GITHUB_USERNAME ?? config.githubUsername ?? '').trim();
  const token = (process.env.GITHUB_TOKEN ?? config.githubToken ?? '').trim();
  return { username, token };
}

export function getGitHubHeaders() {
  const { token } = getGitHubCredentials();
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Portfolio-CRUD-App',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function githubFetch(endpoint) {
  const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: getGitHubHeaders(),
  });

  const rateLimit = {
    limit: Number(res.headers.get('x-ratelimit-limit') || 0),
    remaining: Number(res.headers.get('x-ratelimit-remaining') || 0),
    reset: Number(res.headers.get('x-ratelimit-reset') || 0),
  };

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(
      body?.message || `Error al consultar GitHub API (${res.status})`
    );
    error.status = res.status;
    error.code = res.status === 404 ? 'GITHUB_NOT_FOUND' : 'GITHUB_API_ERROR';
    error.rateLimit = rateLimit;
    throw error;
  }

  return { data: body, rateLimit };
}

/**
 * Calcula el desglose porcentual de lenguajes a partir del objeto { [lang]: bytes } de GitHub.
 */
export function computeLanguagesBreakdown(languagesObj = {}) {
  const entries = Object.entries(languagesObj).filter(
    ([, bytes]) => typeof bytes === 'number' && bytes > 0
  );
  const totalBytes = entries.reduce((acc, [, bytes]) => acc + bytes, 0);

  if (totalBytes === 0) return [];

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => {
      const rawPct = (bytes / totalBytes) * 100;
      const percentage = Math.round(rawPct * 10) / 10;
      return {
        name,
        bytes,
        percentage: percentage > 0 ? percentage : 0.1,
        color: GITHUB_LANGUAGE_COLORS[name] || '#8b949e',
      };
    });
}

/**
 * Verifica el estado de configuración y conexión con GitHub API.
 */
export async function checkGitHubStatus() {
  const { username, token } = getGitHubCredentials();
  if (!username) {
    const err = new Error('Falta configurar GITHUB_USERNAME en el servidor.');
    err.status = 503;
    err.code = 'GITHUB_NOT_CONFIGURED';
    throw err;
  }

  const endpoint = token ? '/user' : `/users/${encodeURIComponent(username)}`;
  const { data, rateLimit } = await githubFetch(endpoint);

  return {
    connected: true,
    authenticated: Boolean(token),
    username: data.login || username,
    name: data.name || data.login || username,
    avatar_url: data.avatar_url || null,
    public_repos: data.public_repos ?? 0,
    html_url: data.html_url || `https://github.com/${username}`,
    rateLimit,
  };
}

/**
 * Obtiene el perfil público del usuario configurado en GITHUB_USERNAME.
 */
export async function getGitHubProfile(customUsername) {
  const { username: defaultUsername } = getGitHubCredentials();
  const targetUser = (customUsername || defaultUsername || '').trim();

  if (!targetUser) {
    const err = new Error('Falta configurar GITHUB_USERNAME en el servidor.');
    err.status = 503;
    err.code = 'GITHUB_NOT_CONFIGURED';
    throw err;
  }

  const cacheKey = `profile:${targetUser.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data } = await githubFetch(`/users/${encodeURIComponent(targetUser)}`);

  const profile = {
    username: data.login,
    name: data.name || data.login,
    bio: data.bio || '',
    avatar_url: data.avatar_url || '',
    html_url: data.html_url || `https://github.com/${data.login}`,
    blog: data.blog || '',
    location: data.location || '',
    public_repos: data.public_repos ?? 0,
    followers: data.followers ?? 0,
    following: data.following ?? 0,
  };

  setCached(cacheKey, profile);
  return profile;
}

/**
 * Lista los repositorios públicos del usuario configurado, con soporte de búsqueda por nombre.
 */
export async function getGitHubRepos({ search = '', sort = 'updated', per_page = 100 } = {}) {
  const { username } = getGitHubCredentials();
  if (!username) {
    const err = new Error('Falta configurar GITHUB_USERNAME en el servidor.');
    err.status = 503;
    err.code = 'GITHUB_NOT_CONFIGURED';
    throw err;
  }

  const cacheKey = `repos:${username.toLowerCase()}:${sort}:${per_page}`;
  let repos = getCached(cacheKey);

  if (!repos) {
    const { data } = await githubFetch(
      `/users/${encodeURIComponent(username)}/repos?sort=${encodeURIComponent(sort)}&direction=desc&per_page=${Number(per_page) || 100}`
    );

    repos = (Array.isArray(data) ? data : []).map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      owner: repo.owner?.login || username,
      description: repo.description || '',
      html_url: repo.html_url,
      homepage: repo.homepage || '',
      language: repo.language || null,
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      stargazers_count: repo.stargazers_count ?? 0,
      forks_count: repo.forks_count ?? 0,
      fork: Boolean(repo.fork),
      archived: Boolean(repo.archived),
    }));

    setCached(cacheKey, repos);
  }

  const q = String(search || '').trim().toLowerCase();
  if (!q) return repos;

  return repos.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q))
  );
}

/**
 * Obtiene el detalle de un repositorio específico (estrellas, forks, topics y desglose porcentual de lenguajes).
 */
export async function getGitHubRepoDetails(ownerOrRepo, optionalRepoName) {
  const { username: defaultOwner } = getGitHubCredentials();
  const owner = optionalRepoName ? ownerOrRepo : defaultOwner;
  const repo = optionalRepoName ? optionalRepoName : ownerOrRepo;

  if (!owner || !repo) {
    const err = new Error('Se requiere propietario y nombre del repositorio.');
    err.status = 400;
    err.code = 'INVALID_REPO_PARAMS';
    throw err;
  }

  const cacheKey = `repo-detail:${owner.toLowerCase()}/${repo.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const encodedOwner = encodeURIComponent(owner);
  const encodedRepo = encodeURIComponent(repo);

  const [repoRes, langRes] = await Promise.all([
    githubFetch(`/repos/${encodedOwner}/${encodedRepo}`),
    githubFetch(`/repos/${encodedOwner}/${encodedRepo}/languages`).catch(() => ({ data: {} })),
  ]);

  const repoData = repoRes.data;
  const languages = computeLanguagesBreakdown(langRes.data || {});

  const details = {
    id: repoData.id,
    name: repoData.name,
    full_name: repoData.full_name,
    owner: repoData.owner?.login || owner,
    description: repoData.description || '',
    html_url: repoData.html_url,
    homepage: repoData.homepage || '',
    language: repoData.language || (languages[0]?.name ?? null),
    languages,
    topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    stargazers_count: repoData.stargazers_count ?? 0,
    forks_count: repoData.forks_count ?? 0,
  };

  setCached(cacheKey, details);
  return details;
}
