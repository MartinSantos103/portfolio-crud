import jwt from 'jsonwebtoken';
import { config } from '../config.js';

function fail(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

// Verifica el token de la cabecera Authorization y deja el usuario en req.user.
// Por ahora confía en el rol que viaja dentro del token; más adelante puede consultar la base.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return fail(res, 401, 'UNAUTHORIZED', 'Falta el token de sesión');
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    req.user = { id: Number(payload.sub), role: payload.role };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 401, 'TOKEN_EXPIRED', 'La sesión expiró, iniciá sesión de nuevo');
    }
    return fail(res, 401, 'TOKEN_INVALID', 'Token de sesión inválido');
  }
}

// Se usa siempre después de requireAuth: router.get('/x', requireAuth, requireRole('admin'), handler)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, 'UNAUTHORIZED', 'Falta el token de sesión');
    if (!roles.includes(req.user.role)) {
      return fail(res, 403, 'FORBIDDEN', 'No tenés permiso para esta acción');
    }
    return next();
  };
}

export function signToken(user) {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: String(user.id),
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

// Middleware opcional: si hay token válido, carga el usuario en req.user y req.userId.
// Si no hay token o es inválido/expiró, continúa la petición como anónimo (sin arrojar 401).
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    req.user = null;
    req.userId = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    const userId = Number(payload.sub ?? payload.id);
    req.user = { id: userId, role: payload.role };
    req.userId = userId;
  } catch {
    req.user = null;
    req.userId = null;
  }
  return next();
}
