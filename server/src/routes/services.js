import { Router } from 'express';
import { z } from 'zod';
import { getPool, query } from '../db/pool.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

const serviceSchema = z.object({
  title: z.string().trim().min(1, 'El título del servicio es obligatorio').max(120),
  description: z.string().trim().min(1, 'La descripción es obligatoria').max(600),
  icon: z.string().trim().min(1, 'El ícono es obligatorio').max(80),
  items: z.array(z.string().trim().min(1)).optional().default([]),
  active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
});

/**
 * GET /api/services
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const isAdminView = req.query.admin === 'true' && req.user?.role === 'admin';
    const whereClause = isAdminView ? '' : 'WHERE active = TRUE';
    const { rows } = await query(
      `SELECT * FROM services ${whereClause} ORDER BY sort_order ASC, id ASC`
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/services/reorder
 */
router.patch('/reorder', requireAuth, requireRole('admin'), async (req, res, next) => {
  const client = await getPool().connect();
  try {
    const { serviceId, direction, orderedIds } = req.body ?? {};
    await client.query('BEGIN');

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE services SET sort_order = $1, updated_at = now() WHERE id = $2', [
          i + 1,
          Number(orderedIds[i]),
        ]);
      }
    } else if (serviceId && (direction === 'up' || direction === 'down')) {
      const { rows } = await client.query(
        'SELECT id, sort_order FROM services ORDER BY sort_order ASC, id ASC'
      );
      const idx = rows.findIndex((r) => r.id === Number(serviceId));
      if (idx === -1) {
        await client.query('ROLLBACK');
        return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } });
      }
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx >= 0 && swapIdx < rows.length) {
        const temp = rows[idx];
        rows[idx] = rows[swapIdx];
        rows[swapIdx] = temp;
        for (let i = 0; i < rows.length; i++) {
          await client.query('UPDATE services SET sort_order = $1, updated_at = now() WHERE id = $2', [
            i + 1,
            rows[i].id,
          ]);
        }
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REORDER', message: 'Se requiere serviceId y direction (up/down) u orderedIds' },
      });
    }

    await client.query('COMMIT');
    const { rows: updated } = await query('SELECT * FROM services ORDER BY sort_order ASC, id ASC');
    return res.json({ ok: true, message: 'Orden de servicios actualizado', data: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/**
 * GET /api/services/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const { rows } = await query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } });
    }
    return res.json({ ok: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/services
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const parsed = serviceSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos del servicio inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const { rows: maxRows } = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM services');
      sortOrder = maxRows[0].next_order;
    }

    const { rows } = await query(
      `INSERT INTO services (title, description, icon, items, sort_order, active)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6)
       RETURNING *`,
      [data.title, data.description, data.icon, JSON.stringify(data.items), sortOrder, data.active]
    );

    return res.status(201).json({
      ok: true,
      message: 'Servicio creado correctamente',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/services/:id
 */
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const parsed = serviceSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos del servicio inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    const { rows } = await query(
      `UPDATE services
       SET title = $1, description = $2, icon = $3, items = $4::jsonb, active = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [data.title, data.description, data.icon, JSON.stringify(data.items), data.active, serviceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } });
    }

    return res.json({
      ok: true,
      message: 'Servicio actualizado correctamente',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/services/:id/status
 */
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const { active } = req.body ?? {};
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: { code: 'VALIDATION', message: 'El estado active debe ser booleano' },
      });
    }

    const { rows } = await query(
      'UPDATE services SET active = $1, updated_at = now() WHERE id = $2 RETURNING *',
      [active, serviceId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } });
    }

    return res.json({
      ok: true,
      message: 'Estado del servicio actualizado',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/services/:id
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const serviceId = Number(req.params.id);
    const { rows } = await query('DELETE FROM services WHERE id = $1 RETURNING id', [serviceId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Servicio no encontrado' } });
    }
    return res.json({ ok: true, message: 'Servicio eliminado correctamente', id: serviceId });
  } catch (err) {
    next(err);
  }
});

export default router;
