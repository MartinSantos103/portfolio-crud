import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const demoSchema = z
  .object({
    project_id: z.coerce.number().int().positive('Debes asociar un proyecto válido'),
    title: z.string().trim().min(1, 'El título de la demo es obligatorio').max(140),
    description: z.string().trim().max(1000).optional().default(''),
    type: z.enum(['iframe', 'video', 'imagenes', 'images']),
    url: z.string().trim().optional().default(''),
    urls: z.array(z.string().trim().min(1)).optional().default([]),
    sort_order: z.coerce.number().int().optional().default(0),
  })
  .superRefine((val, ctx) => {
    const normalizedType = val.type === 'images' ? 'imagenes' : val.type;
    if ((normalizedType === 'iframe' || normalizedType === 'video') && !val.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'La dirección URL es obligatoria para demos de tipo iframe o video',
      });
    }
    if (normalizedType === 'imagenes' && (!val.urls || val.urls.length === 0) && !val.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['urls'],
        message: 'Debes cargar al menos una imagen para la galería interactiva',
      });
    }
  });

function normalizeDemoRow(row) {
  if (!row) return null;
  const urls = Array.isArray(row.urls)
    ? row.urls
    : row.url
      ? [row.url]
      : [];
  return {
    ...row,
    type: row.type === 'images' ? 'imagenes' : row.type,
    urls,
    url: row.url || urls[0] || '',
  };
}

/**
 * GET /api/demos/check-headers
 * Endpoint auxiliar para inspeccionar cabeceras X-Frame-Options y CSP frame-ancestors.
 */
router.get('/check-headers', requireAuth, requireRole('admin'), async (req, res) => {
  const targetUrl = String(req.query.url || '').trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).json({
      ok: false,
      error: { code: 'INVALID_URL', message: 'Ingresá una URL válida con http:// o https://' },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(targetUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });
    } catch {
      response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const xFrameOptions = (response.headers.get('x-frame-options') || '').toUpperCase();
    const csp = response.headers.get('content-security-policy') || '';
    const frameAncestorsMatch = /frame-ancestors\s+([^;]+)/i.exec(csp);
    const frameAncestors = frameAncestorsMatch ? frameAncestorsMatch[1].trim() : '';

    const blockedByXfo =
      xFrameOptions.includes('DENY') || xFrameOptions.includes('SAMEORIGIN');
    const blockedByCsp =
      frameAncestors.includes("'none'") || frameAncestors.includes("'self'");

    const embeddable = !blockedByXfo && !blockedByCsp;

    return res.json({
      ok: true,
      embeddable,
      status: response.status,
      xFrameOptions: xFrameOptions || null,
      frameAncestors: frameAncestors || null,
      message: embeddable
        ? 'No se detectaron cabeceras restrictivas (X-Frame-Options / frame-ancestors). Verificá visualmente el recuadro inferior.'
        : 'El servidor remoto envía cabeceras que bloquean su incrustación en un iframe. Se recomienda usar tipo Video o Imágenes.',
    });
  } catch (err) {
    return res.json({
      ok: true,
      embeddable: false,
      message: `No se pudo verificar la URL desde el servidor (${err.message}). Comprobá el visor manualmente.`,
    });
  }
});

/**
 * GET /api/demos
 * Lista todas las demos junto al título de su proyecto asociado.
 */
router.get('/', async (req, res, next) => {
  try {
    const { project_id, type } = req.query;
    const conditions = [];
    const params = [];

    if (project_id) {
      params.push(Number(project_id));
      conditions.push(`d.project_id = $${params.length}`);
    }
    if (type) {
      if (type === 'imagenes' || type === 'images') {
        conditions.push(`d.type IN ('imagenes', 'images')`);
      } else {
        params.push(type);
        conditions.push(`d.type = $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT d.*, p.title AS project_title
      FROM demos d
      LEFT JOIN projects p ON p.id = d.project_id
      ${whereClause}
      ORDER BY d.sort_order ASC, d.id DESC;
    `;
    const { rows } = await query(sql, params);
    return res.json({ ok: true, data: rows.map(normalizeDemoRow) });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/demos/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const demoId = Number(req.params.id);
    const { rows } = await query(
      `SELECT d.*, p.title AS project_title
       FROM demos d
       LEFT JOIN projects p ON p.id = d.project_id
       WHERE d.id = $1`,
      [demoId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Demo no encontrada' } });
    }
    return res.json({ ok: true, data: normalizeDemoRow(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/demos
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const parsed = demoSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos de la demo inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    const normalizedType = data.type === 'images' ? 'imagenes' : data.type;
    const finalUrls =
      normalizedType === 'imagenes'
        ? data.urls.length > 0
          ? data.urls
          : data.url
            ? [data.url]
            : []
        : [];
    const finalUrl =
      normalizedType === 'imagenes' ? finalUrls[0] || '' : data.url;

    const { rows } = await query(
      `INSERT INTO demos (project_id, title, description, type, url, urls, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING *`,
      [
        data.project_id,
        data.title,
        data.description,
        normalizedType,
        finalUrl,
        JSON.stringify(finalUrls),
        data.sort_order,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: 'Demo creada correctamente',
      data: normalizeDemoRow(rows[0]),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/demos/:id
 */
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const demoId = Number(req.params.id);
    const parsed = demoSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos de la demo inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    const normalizedType = data.type === 'images' ? 'imagenes' : data.type;
    const finalUrls =
      normalizedType === 'imagenes'
        ? data.urls.length > 0
          ? data.urls
          : data.url
            ? [data.url]
            : []
        : [];
    const finalUrl =
      normalizedType === 'imagenes' ? finalUrls[0] || '' : data.url;

    const { rows } = await query(
      `UPDATE demos
       SET project_id = $1, title = $2, description = $3, type = $4, url = $5, urls = $6::jsonb, sort_order = $7
       WHERE id = $8
       RETURNING *`,
      [
        data.project_id,
        data.title,
        data.description,
        normalizedType,
        finalUrl,
        JSON.stringify(finalUrls),
        data.sort_order,
        demoId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Demo no encontrada' } });
    }

    return res.json({
      ok: true,
      message: 'Demo actualizada correctamente',
      data: normalizeDemoRow(rows[0]),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/demos/:id
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const demoId = Number(req.params.id);
    const { rows } = await query('DELETE FROM demos WHERE id = $1 RETURNING id', [demoId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Demo no encontrada' } });
    }
    return res.json({ ok: true, message: 'Demo eliminada correctamente', id: demoId });
  } catch (err) {
    next(err);
  }
});

export default router;
