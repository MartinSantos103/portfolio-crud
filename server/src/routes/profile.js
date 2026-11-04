import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const stackItemSchema = z.object({
  id: z.string().trim().min(1, 'El ID de tecnología es obligatorio'),
  name: z.string().trim().min(1, 'El nombre de la tecnología es obligatorio').max(80),
  category: z.enum(['frontend', 'backend', 'database', 'tools']),
  icon_key: z.string().trim().min(1, 'El ícono es obligatorio'),
});

const trajectoryItemSchema = z.object({
  id: z.string().trim().min(1),
  type: z.enum(['experiencia', 'educacion', 'formacion']).optional().default('experiencia'),
  title: z.string().trim().min(1, 'El rol o título es obligatorio').max(140),
  organization: z.string().trim().min(1, 'La organización o institución es obligatoria').max(140),
  place: z.string().trim().nullable().optional(),
  start_date: z.string().trim().min(1, 'La fecha de inicio es obligatoria').max(40),
  end_date: z.string().trim().nullable().optional().default(''),
  current: z.boolean().optional().default(false),
  date: z.string().trim().nullable().optional(),
  description: z.string().trim().max(600).nullable().optional().default(''),
});

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre completo es obligatorio').max(120),
  headline: z.string().trim().min(1, 'El titular profesional es obligatorio').max(160),
  short_bio: z.preprocess((v) => v ?? '', z.string().trim().max(300, 'El resumen corto no puede superar los 300 caracteres')),
  bio: z.preprocess((v) => v ?? '', z.string().trim().max(5000, 'La biografía no puede superar los 5000 caracteres')),
  photo_url: z.string().trim().nullable().optional().default(null),
  location: z.preprocess((v) => v ?? '', z.string().trim().max(120)),
  contact_email: z.string().trim().email('El correo de contacto es inválido').max(254),
  cv_url: z.preprocess((v) => v ?? '', z.string().trim().max(500)),
  available: z.boolean().optional().default(true),
  stack: z.array(stackItemSchema).optional().default([]),
  experience: z.array(trajectoryItemSchema).optional().default([]),
  education: z.array(trajectoryItemSchema).optional().default([]),
  social_links: z.record(z.string(), z.string()).or(z.array(z.any())).optional().default({}),
});

function normalizeProfileRow(row) {
  if (!row) return null;
  const rawStack =
    Array.isArray(row.stack) && row.stack.length > 0
      ? row.stack
      : Array.isArray(row.skills)
        ? row.skills
        : [];

  const stack = rawStack.map((item) => ({
    id: item.id || String(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: item.name || item.id,
    category: item.category || 'frontend',
    icon_key: item.icon_key || item.id || 'react',
  }));

  const normalizeLegacyMilestone = (item, idx, defaultType) => ({
    id: item.id || `${defaultType}-${idx + 1}`,
    type: item.type || defaultType,
    title: item.title || 'Rol Profesional',
    organization: item.organization || item.place || 'Organización',
    place: item.place || item.organization || 'Organización',
    start_date: item.start_date || (item.date ? String(item.date).split('—')[0].trim() : '2024'),
    end_date: item.end_date ?? '',
    current: Boolean(item.current ?? String(item.date || '').toLowerCase().includes('actualidad')),
    date: item.date || item.start_date || '2024',
    description: item.description ?? '',
  });

  const resolvedFullName =
    !row.full_name || row.full_name === 'Desarrollador Fullstack'
      ? 'Lucas Andrade'
      : row.full_name;

  const resolvedHeadline =
    !row.headline || row.headline === 'React & Node.js Developer'
      ? 'Desarrollador Web Full Stack'
      : row.headline;

  return {
    ...row,
    full_name: resolvedFullName,
    headline: resolvedHeadline,
    short_bio: row.short_bio ?? '',
    bio: row.bio ?? '',
    location: row.location ?? 'Salta, Argentina',
    contact_email: row.contact_email || 'martinsantos4890@gmail.com',
    cv_url: row.cv_url ?? '',
    available: row.available ?? true,
    stack,
    skills: stack,
    experience: Array.isArray(row.experience)
      ? row.experience.map((m, i) => normalizeLegacyMilestone(m, i, 'experiencia'))
      : [],
    education: Array.isArray(row.education)
      ? row.education.map((m, i) => normalizeLegacyMilestone(m, i, 'educacion'))
      : [],
    social_links: row.social_links ?? {},
  };
}

/**
 * GET /api/profile
 * Obtiene la fila única del perfil profesional.
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM profile WHERE id = 1');
    if (rows.length === 0) {
      return res.json({
        ok: true,
        data: normalizeProfileRow({
          id: 1,
          full_name: 'Lucas Andrade',
          headline: 'Desarrollador Web Full Stack',
          short_bio: 'Construyo aplicaciones web rápidas, escalables, intuitivas y modernas.',
          bio: '',
          photo_url: null,
          location: 'Salta, Argentina',
          contact_email: 'contacto@pf.local',
          cv_url: '',
          available: true,
          stack: [],
          experience: [],
          education: [],
          social_links: {},
        }),
      });
    }
    return res.json({ ok: true, data: normalizeProfileRow(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profile
 * Actualiza integralmente la fila única del perfil profesional.
 */
router.put('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'body';
        fields[key] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos del perfil inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;

    // Normalizar fechas legibles en hitos de trayectoria para el sitio público
    const normalizeMilestones = (items) =>
      items.map((item) => {
        const endLabel = item.current ? 'Actualidad' : item.end_date || '';
        const dateLabel =
          item.date ||
          (endLabel && endLabel !== item.start_date
            ? `${item.start_date} — ${endLabel}`
            : item.start_date);
        return {
          ...item,
          place: item.organization || item.place || '',
          date: dateLabel,
        };
      });

    const experience = normalizeMilestones(data.experience);
    const education = normalizeMilestones(data.education);

    const sql = `
      INSERT INTO profile (
        id, full_name, headline, short_bio, bio, photo_url, location,
        contact_email, cv_url, available, social_links, skills, stack,
        experience, education, updated_at
      )
      VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, now())
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        short_bio = EXCLUDED.short_bio,
        bio = EXCLUDED.bio,
        photo_url = EXCLUDED.photo_url,
        location = EXCLUDED.location,
        contact_email = EXCLUDED.contact_email,
        cv_url = EXCLUDED.cv_url,
        available = EXCLUDED.available,
        social_links = EXCLUDED.social_links,
        skills = EXCLUDED.skills,
        stack = EXCLUDED.stack,
        experience = EXCLUDED.experience,
        education = EXCLUDED.education,
        updated_at = now()
      RETURNING *;
    `;

    const params = [
      data.full_name,
      data.headline,
      data.short_bio,
      data.bio,
      data.photo_url || null,
      data.location,
      data.contact_email,
      data.cv_url,
      data.available,
      JSON.stringify(data.social_links),
      JSON.stringify(data.stack),
      JSON.stringify(experience),
      JSON.stringify(education),
    ];

    const { rows } = await query(sql, params);
    return res.json({
      ok: true,
      message: 'Perfil actualizado correctamente',
      data: normalizeProfileRow(rows[0]),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
