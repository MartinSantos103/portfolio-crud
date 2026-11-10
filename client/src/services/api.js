function getApiBaseUrl() {
  // Si estamos en el navegador dentro de una preview de rama en Vercel
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.includes('portfolio-crud-client-git-')
  ) {
    const serverHost = window.location.hostname.replace(
      'portfolio-crud-client-',
      'portfolio-crud-server-'
    );
    const subdomain = serverHost.split('.')[0];
    if (subdomain.length <= 63) {
      return `https://${serverHost}`;
    }
  }

  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000';
  }

  return 'http://localhost:3000';
}

export const API_URL = getApiBaseUrl();

const inflightGetRequests = new Map();

async function executeApiFetch(path, options = {}, token = null) {
  const method = (options.method || 'GET').toUpperCase();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const hasJsonBody = options.body !== undefined && options.body !== null && !isFormData;

  const maxAttempts = method === 'GET' ? 2 : 1;
  let res;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      res = await fetch(`${API_URL}/api${path}`, {
        ...options,
        headers: {
          ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch (err) {
      if (err instanceof TypeError && err.message?.toLowerCase().includes('fetch')) {
        throw new Error(
          `No se pudo conectar con el backend (${API_URL}). Verificá que el servidor esté encendido (npm run dev en carpeta server).`,
          { cause: err }
        );
      }
      throw err;
    }

    if (res.ok || res.status < 500 || attempt === maxAttempts - 1) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (typeof body.error === 'object' ? body.error?.message : body.error) ||
      body.message ||
      `Error ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.code = typeof body.error === 'object' ? body.error?.code : undefined;
    error.body = body;

    // Regla 2.3: Si el token vence (401) mientras el administrador trabaja en /admin/*,
    // NO redirigir forzosamente a /login ni desmontar la pantalla actual; emitir evento
    // para abrir el Modal de Re-autenticación conservando el borrador en memoria.
    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/admin') &&
      !path.startsWith('/auth/')
    ) {
      window.dispatchEvent(
        new CustomEvent('auth:session-expired', {
          detail: { path, message },
        })
      );
    }

    throw error;
  }

  return res.json();
}

export function apiFetch(path, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const method = (options.method || 'GET').toUpperCase();

  if (method === 'GET' && !options.signal) {
    const cacheKey = `${path}::${token || ''}`;
    if (inflightGetRequests.has(cacheKey)) {
      return inflightGetRequests.get(cacheKey);
    }

    const requestPromise = executeApiFetch(path, options, token).finally(() => {
      inflightGetRequests.delete(cacheKey);
    });

    inflightGetRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  return executeApiFetch(path, options, token);
}
