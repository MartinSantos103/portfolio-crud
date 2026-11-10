import { apiFetch } from './api.js';

const SESSION_KEY = 'portfolio_session_id';
const recentEventTimestamps = new Map();
const DEDUP_WINDOW_MS = 2000;

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return 'ssr-session';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Registra un evento analítico solo en páginas públicas (nunca en /admin/*).
 */
export async function trackPortfolioEvent({ type, path, projectId = null }) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  const resolvedPath = path || window.location.pathname;
  const dedupKey = `${type}::${resolvedPath}::${projectId ?? ''}`;
  const now = Date.now();
  const lastSentAt = recentEventTimestamps.get(dedupKey);

  if (lastSentAt && now - lastSentAt < DEDUP_WINDOW_MS) {
    return;
  }
  recentEventTimestamps.set(dedupKey, now);

  try {
    const session_id = getOrCreateSessionId();
    await apiFetch('/metrics/events', {
      method: 'POST',
      body: JSON.stringify({
        type,
        path: resolvedPath,
        session_id,
        project_id: projectId,
      }),
    });
  } catch {
    // Silencioso para no afectar la experiencia del visitante
  }
}
