import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth, signToken } from '../middleware/auth.js';
import { findUserByEmail, findUserById, touchLastLogin, toPublicUser } from '../db/users.js';

const router = Router();

// Hash válido de relleno: se compara aunque el correo no exista, para que el tiempo
// de respuesta no revele si la cuenta existe.
const DUMMY_HASH = '$2b$10$DjfhvRKzQfHwk45FTnBoP.6mFZlCX.g0UqA0TPiQBq48MyYpK//ya';

const loginSchema = z.object({
  email: z.string({ error: 'El correo es obligatorio' }).trim().email('Correo inválido').max(254),
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(200),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos, probá en unos minutos' } },
});

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    const fields = {};
    for (const issue of parsed.error.issues) fields[issue.path[0] ?? 'body'] ??= issue.message;
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Datos inválidos', fields } });
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  const matches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !user.password_hash || !matches) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' } });
  }
  if (!user.active) {
    return res.status(403).json({ error: { code: 'ACCOUNT_DISABLED', message: 'La cuenta está desactivada' } });
  }

  await touchLastLogin(user.id);
  return res.json({ token: signToken(user), user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user || !user.active) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'La sesión ya no es válida' } });
  }
  return res.json({ user: toPublicUser(user) });
});

export default router;