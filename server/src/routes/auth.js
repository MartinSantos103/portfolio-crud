import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import {
  findUserByEmail,
  findUserById,
  findUserByGoogleId,
  linkGoogleId,
  touchLastLogin,
  toPublicUser,
  createUser,
  createUserWithGoogle,
} from '../db/users.js';

const router = Router();
const googleClient = new OAuth2Client(config.googleClientId);

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

const googleAuthSchema = z.object({
  credential: z
    .string({ error: 'La credencial de Google es obligatoria' })
    .trim()
    .min(1, 'La credencial de Google es obligatoria'),
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
      if (!existingUser.active) {
        return res.status(403).json({
          error: {
            code: 'ACCOUNT_SUSPENDED',
            message:
              'Tu cuenta ha sido suspendida por el administrador. No es posible registrarse ni enviar correos con esta dirección.',
          },
        });
      }
      return res.status(409).json({
        error: { code: 'USER_EXISTS', message: 'El correo electrónico ya se encuentra registrado' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await createUser({ name, email, passwordHash });

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

  if (user && !user.active) {
    return res.status(403).json({
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Tu cuenta se encuentra suspendida. No puedes iniciar sesión ni operar en la plataforma.',
      },
    });
  }

  if (!user || !user.password_hash || !matches) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Correo o contraseña incorrectos' } });
  }

  await touchLastLogin(user.id);
  return res.json({ token: signToken(user), user: toPublicUser(user) });
});

router.post('/google', loginLimiter, async (req, res, next) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) fields[issue.path[0] ?? 'body'] ??= issue.message;
      return res.status(400).json({ error: { code: 'VALIDATION', message: 'Datos inválidos', fields } });
    }

    if (!config.googleClientId) {
      return res.status(500).json({
        error: { code: 'GOOGLE_NOT_CONFIGURED', message: 'Falta configurar GOOGLE_CLIENT_ID en el servidor' },
      });
    }

    const { credential } = parsed.data;

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({
        error: { code: 'INVALID_GOOGLE_TOKEN', message: 'El token de Google es inválido o expiró' },
      });
    }

    if (!payload || !payload.sub || !payload.email) {
      return res.status(401).json({
        error: { code: 'INVALID_GOOGLE_TOKEN', message: 'El token de Google no contiene datos de cuenta válidos' },
      });
    }

    if (!payload.email_verified) {
      return res.status(400).json({
        error: { code: 'EMAIL_NOT_VERIFIED', message: 'El correo de tu cuenta de Google no está verificado' },
      });
    }

    const googleId = String(payload.sub);
    const email = String(payload.email).trim();
    const displayName = String(payload.name || email.split('@')[0]).trim();

    let user = await findUserByGoogleId(googleId);
    if (!user) {
      user = await findUserByEmail(email);
      if (user) {
        if (!user.google_id && user.active) {
          user = await linkGoogleId(user.id, googleId);
        }
      } else {
        user = await createUserWithGoogle({
          name: displayName.slice(0, 100),
          email,
          googleId,
        });
      }
    }

    if (!user.active) {
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message:
            'Tu cuenta se encuentra suspendida por el administrador. No tienes permitido registrarte ni iniciar sesión.',
        },
      });
    }

    await touchLastLogin(user.id);
    return res.json({
      ok: true,
      token: signToken(user),
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'La sesión ya no es válida' } });
  }
  if (!user.active) {
    return res.status(403).json({
      error: {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Tu cuenta ha sido suspendida.',
      },
    });
  }
  return res.json({ user: toPublicUser(user) });
});

export default router;
