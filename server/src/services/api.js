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
    return `https://${serverHost}`;
  }

  // En local o en producción, usa la variable de entorno habitual
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

export const API_URL = getApiBaseUrl();