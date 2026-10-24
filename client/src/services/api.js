function getApiBaseUrl() {
  // Si estamos en el navegador dentro de una preview de rama en Vercel
  if (
    typeof window !== 'undefined' &&
    window.location.hostname.includes('portfolio-crud-client-git-')
  ) {
    // Transforma: portfolio-crud-client-git-xxx.vercel.app
    // En:         portfolio-crud-server-git-xxx.vercel.app
    const serverHost = window.location.hostname.replace(
      'portfolio-crud-client-',
      'portfolio-crud-server-'
    );
    const subdomain = serverHost.split('.')[0];
    // El estándar DNS permite hasta 63 caracteres por subdominio;
    // si lo supera, Vercel trunca con un hash distinto por proyecto.
    if (subdomain.length <= 63) {
      return `https://${serverHost}`;
    }
  }

  // En local o en producción (o cuando la URL usa hash único de deployment), usa la variable de entorno
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

export const API_URL = getApiBaseUrl();

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  return res.json();
}
