import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth, signToken } from '../middleware/auth.js';
import { findUserByEmail, findUserById, touchLastLogin, toPublicUser, createUser } from '../db/users.js';

const router = Router();

// Hash válido de relleno: se compara aunque el correo no exista, para que el tiempo
// de respuesta no revele si la cuenta existe.
const DUMMY_HASH = '$2b$10$DjfhvRKzQfHwk45FTnBoP.6mFZlCX.g0UqA0TPiQBq48MyYpK//ya';

const loginSchema = z.object({
  email: z.string({ error: 'El correo es obligatorio' }).trim().email('Correo inválido').max(254),
  password: z.string({ error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria').max(200),
});

const registerSchema = z.object({
  name: z.string({ error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string({ error: 'El correo es obligatorio' }).trim().email('Correo inválido').max(254),
  password: z.string({ error: 'La contraseña es obligatoria' }).min(6, 'La contraseña debe tener al menos 6 caracteres').max(200),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos, probá en unos minutos' } },
});

router.post('/register', loginLimiter, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) fields[issue.path[0] ?? 'body'] ??= issue.message;
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Datos inválidos', fields } });
    }
    const { name, email, password } = parsed.data;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: { code: 'USER_EXISTS', message: 'El correo electrónico ya se encuentra registrado' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({ name, email, passwordHash, role: 'user' });

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente',
      user: toPublicUser(newUser),
      token: signToken(newUser),
    });
  } catch (err) {
    next(err);
  }
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
