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

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/google')
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
