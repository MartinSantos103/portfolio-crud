import { Router } from 'express';
import { z } from 'zod';
import { getPool, query } from '../db/pool.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

const projectImageSchema = z.object({
  id: z.number().int().optional(),
  url: z.string().trim().min(1, 'La URL de la imagen es obligatoria'),
  alt: z.string().trim().max(200).optional().default(''),
  sort_order: z.number().int().optional().default(0),
});

const projectSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(140),
  slug: z.string().trim().max(160).optional().default(''),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción corta es obligatoria')
    .max(220, 'La descripción corta no puede superar los 220 caracteres'),
  summary: z.string().trim().max(220).optional(),
  problem: z.string().trim().max(8000).optional().default(''),
  solution: z.string().trim().max(8000).optional().default(''),
  tech_decisions: z.string().trim().max(8000).optional().default(''),
  technologies: z.array(z.string().trim().min(1)).optional().default([]),
  repo_url: z.string().trim().max(500).nullable().optional().default(''),
  live_url: z.string().trim().max(500).nullable().optional().default(''),
  cover_image_url: z.string().trim().nullable().optional().default(null),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  sort_order: z.number().int().optional(),
  images: z.array(projectImageSchema).optional().default([]),
});

function slugify(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/projects
 * Lista proyectos. Si ?admin=true y el usuario es admin, incluye borradores y filtros.
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const isAdminView = req.query.admin === 'true' && req.user?.role === 'admin';
    const { search, status } = req.query;

    const conditions = [];
    const params = [];

    if (!isAdminView) {
      conditions.push('p.published = TRUE');
    } else {
      if (status === 'published' || status === 'publicados') {
        conditions.push('p.published = TRUE');
      } else if (status === 'draft' || status === 'borradores') {
        conditions.push('p.published = FALSE');
      } else if (status === 'featured' || status === 'destacados') {
        conditions.push('p.featured = TRUE');
      }

      if (search && String(search).trim()) {
        params.push(`%${String(search).trim().toLowerCase()}%`);
        conditions.push(
          `(LOWER(p.title) LIKE $${params.length} OR LOWER(p.description) LIKE $${params.length} OR LOWER(p.summary) LIKE $${params.length})`
        );
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        p.*,
        COALESCE(
          (
            SELECT json_agg(img ORDER BY img.sort_order ASC, img.id ASC)
            FROM project_images img
            WHERE img.project_id = p.id
          ),
          '[]'::json
        ) AS images,
        (
          SELECT COUNT(*)::int
          FROM demos d
          WHERE d.project_id = p.id
        ) AS demos_count
      FROM projects p
      ${whereClause}
      ORDER BY p.sort_order ASC, p.id ASC;
    `;

    const { rows } = await query(sql, params);
    return res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/projects/reorder
 * Intercambia el sort_order de un proyecto con el adyacente o aplica un arreglo ordenado.
 */
router.patch('/reorder', requireAuth, requireRole('admin'), async (req, res, next) => {
  const client = await getPool().connect();
  try {
    const { projectId, direction, orderedIds } = req.body ?? {};
    await client.query('BEGIN');

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE projects SET sort_order = $1, updated_at = now() WHERE id = $2', [
          i + 1,
          Number(orderedIds[i]),
        ]);
      }
    } else if (projectId && (direction === 'up' || direction === 'down')) {
      const { rows } = await client.query(
        'SELECT id, sort_order FROM projects ORDER BY sort_order ASC, id ASC'
      );
      const idx = rows.findIndex((r) => r.id === Number(projectId));
      if (idx === -1) {
        await client.query('ROLLBACK');
        return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no encontrado' } });
      }
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx >= 0 && swapIdx < rows.length) {
        const temp = rows[idx];
        rows[idx] = rows[swapIdx];
        rows[swapIdx] = temp;
        for (let i = 0; i < rows.length; i++) {
          await client.query('UPDATE projects SET sort_order = $1, updated_at = now() WHERE id = $2', [
            i + 1,
            rows[i].id,
          ]);
        }
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REORDER', message: 'Se requiere projectId y direction (up/down) u orderedIds' },
      });
    }

    await client.query('COMMIT');
    const { rows: updated } = await query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC');
    return res.json({ ok: true, message: 'Orden actualizado', data: updated });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/**
 * GET /api/projects/:id
 * Obtiene el detalle de un proyecto junto con sus imágenes secundarias y demos.
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_ID', message: 'ID de proyecto inválido' } });
    }

    const { rows } = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no encontrado' } });
    }

    const project = rows[0];
    if (!project.published && req.user?.role !== 'admin') {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no disponible' } });
    }

    const [imagesRes, demosRes] = await Promise.all([
      query('SELECT id, project_id, url, alt, sort_order FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC, id ASC', [projectId]),
      query('SELECT * FROM demos WHERE project_id = $1 ORDER BY sort_order ASC, id ASC', [projectId]),
    ]);

    return res.json({
      ok: true,
      data: {
        ...project,
        images: imagesRes.rows,
        demos: demosRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Crea un nuevo proyecto y su galería de imágenes.
 */
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  const client = await getPool().connect();
  try {
    const body = {
      ...req.body,
      description: req.body?.description ?? req.body?.summary ?? '',
    };
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos de proyecto inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    const finalSlug = data.slug || slugify(data.title);
    const shortDesc = data.description;

    await client.query('BEGIN');

    let sortOrder = data.sort_order;
    if (sortOrder === undefined) {
      const { rows: maxRows } = await client.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM projects');
      sortOrder = maxRows[0].next_order;
    }

    const insertSql = `
      INSERT INTO projects (
        title, slug, summary, description, problem, solution, tech_decisions,
        technologies, repo_url, live_url, cover_image_url, featured, published, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const { rows } = await client.query(insertSql, [
      data.title,
      finalSlug,
      shortDesc,
      shortDesc,
      data.problem,
      data.solution,
      data.tech_decisions,
      data.technologies,
      data.repo_url || null,
      data.live_url || null,
      data.cover_image_url || null,
      data.featured,
      data.published,
      sortOrder,
    ]);

    const createdProject = rows[0];
    const insertedImages = [];

    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const { rows: imgRows } = await client.query(
        `INSERT INTO project_images (project_id, url, alt, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [createdProject.id, img.url, img.alt || '', i + 1]
      );
      insertedImages.push(imgRows[0]);
    }

    await client.query('COMMIT');
    return res.status(201).json({
      ok: true,
      message: 'Proyecto creado correctamente',
      data: {
        ...createdProject,
        images: insertedImages,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/**
 * PUT /api/projects/:id
 * Actualiza un proyecto y sincroniza su galería de imágenes secundarias.
 */
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  const client = await getPool().connect();
  try {
    const projectId = Number(req.params.id);
    const body = {
      ...req.body,
      description: req.body?.description ?? req.body?.summary ?? '',
    };
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      const fields = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || 'body'] ??= issue.message;
      }
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: Object.values(fields)[0] || 'Datos de proyecto inválidos',
          fields,
        },
      });
    }

    const data = parsed.data;
    const finalSlug = data.slug || slugify(data.title);
    const shortDesc = data.description;

    await client.query('BEGIN');

    const updateSql = `
      UPDATE projects
      SET
        title = $1,
        slug = $2,
        summary = $3,
        description = $4,
        problem = $5,
        solution = $6,
        tech_decisions = $7,
        technologies = $8,
        repo_url = $9,
        live_url = $10,
        cover_image_url = $11,
        featured = $12,
        published = $13,
        updated_at = now()
      WHERE id = $14
      RETURNING *;
    `;

    const { rows } = await client.query(updateSql, [
      data.title,
      finalSlug,
      shortDesc,
      shortDesc,
      data.problem,
      data.solution,
      data.tech_decisions,
      data.technologies,
      data.repo_url || null,
      data.live_url || null,
      data.cover_image_url || null,
      data.featured,
      data.published,
      projectId,
    ]);

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no encontrado' } });
    }

    await client.query('DELETE FROM project_images WHERE project_id = $1', [projectId]);
    const updatedImages = [];
    for (let i = 0; i < data.images.length; i++) {
      const img = data.images[i];
      const { rows: imgRows } = await client.query(
        `INSERT INTO project_images (project_id, url, alt, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [projectId, img.url, img.alt || '', i + 1]
      );
      updatedImages.push(imgRows[0]);
    }

    await client.query('COMMIT');
    return res.json({
      ok: true,
      message: 'Proyecto actualizado correctamente',
      data: {
        ...rows[0],
        images: updatedImages,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/projects/:id/status
 * Actualización rápida de estado (published / featured) para toggles optimistas.
 */
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const { published, featured } = req.body ?? {};

    const updates = [];
    const params = [];

    if (typeof published === 'boolean') {
      params.push(published);
      updates.push(`published = $${params.length}`);
    }
    if (typeof featured === 'boolean') {
      params.push(featured);
      updates.push(`featured = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        ok: false,
        error: { code: 'VALIDATION', message: 'Se requiere published o featured booleano' },
      });
    }

    params.push(projectId);
    const { rows } = await query(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no encontrado' } });
    }

    return res.json({
      ok: true,
      message: 'Estado del proyecto actualizado',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id
 * Elimina un proyecto por su ID.
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const projectId = Number(req.params.id);
    const { rows } = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Proyecto no encontrado' } });
    }
    return res.json({ ok: true, message: 'Proyecto eliminado correctamente', id: projectId });
  } catch (err) {
    next(err);
  }
});

export default router;
