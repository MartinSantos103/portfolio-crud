import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function formatUserRow(row) {
  const isGoogle = Boolean(row.google_id);
  const viewedProjects = Array.isArray(row.viewed_projects) ? row.viewed_projects : [];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    origin: isGoogle ? 'Google' : 'Local',
    registration_type: isGoogle ? 'Cuenta de Google' : 'Contraseña (Local)',
    created_at: row.created_at,
    last_login_at: row.last_login_at,
    messages_count: Number(row.messages_count ?? 0),
    last_message_at: row.last_message_at || null,
    projects_viewed_count: Number(row.projects_viewed_count ?? 0),
    demos_viewed_count: Number(row.demos_viewed_count ?? 0),
    unique_projects_viewed_count: Number(row.unique_projects_viewed_count ?? 0),
    total_views_count: Number(row.total_views_count ?? 0),
    viewed_projects: viewedProjects,
  };
}

const ENRICHED_USER_SELECT = `
  SELECT
    u.id,
    u.name,
    u.email,
    u.google_id,
    u.role,
    u.active,
    u.created_at,
    u.last_login_at,
    (
      SELECT COUNT(*)::int
      FROM messages m
      WHERE m.user_id = u.id OR LOWER(m.email) = LOWER(u.email)
    ) AS messages_count,
    (
      SELECT MAX(m.created_at)
      FROM messages m
      WHERE m.user_id = u.id OR LOWER(m.email) = LOWER(u.email)
    ) AS last_message_at,
    (
      SELECT COUNT(*)::int
      FROM events e
      WHERE e.user_id = u.id AND e.type = 'project_view'
    ) AS projects_viewed_count,
    (
      SELECT COUNT(*)::int
      FROM events e
      WHERE e.user_id = u.id AND e.type = 'demo_view'
    ) AS demos_viewed_count,
    (
      SELECT COUNT(DISTINCT e.project_id)::int
      FROM events e
      WHERE e.user_id = u.id
        AND e.type IN ('project_view', 'demo_view')
        AND e.project_id IS NOT NULL
    ) AS unique_projects_viewed_count,
    (
      SELECT COUNT(*)::int
      FROM events e
      WHERE e.user_id = u.id
        AND e.type IN ('project_view', 'demo_view')
    ) AS total_views_count,
    (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', sub.project_id,
            'title', sub.title,
            'last_viewed_at', sub.last_viewed_at,
            'views_count', sub.views_count
          ) ORDER BY sub.last_viewed_at DESC
        ),
        '[]'::json
      )
      FROM (
        SELECT
          e.project_id,
          COALESCE(p.title, 'Proyecto #' || e.project_id) AS title,
          MAX(e.created_at) AS last_viewed_at,
          COUNT(e.id)::int AS views_count
        FROM events e
        LEFT JOIN projects p ON p.id = e.project_id
        WHERE e.user_id = u.id
          AND e.type IN ('project_view', 'demo_view')
          AND e.project_id IS NOT NULL
        GROUP BY e.project_id, p.title
      ) sub
    ) AS viewed_projects
  FROM users u
`;

/**
 * GET /api/users
 * Listado paginado y filtrable de usuarios registrados.
 * El Administrador (dueño del repositorio) nunca aparece en los registros de usuarios.
 * Query params: ?search=...&active=true|false&status_priority=habilitada|suspendida&sort_by=registro|consulta&order=desc|asc&page=1&limit=20
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      search,
      active,
      status_priority = 'habilitada',
      sort_by = 'registro',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;
    // El Admin nunca aparece en el listado de usuarios registrados
    const conditions = [`u.role = 'user'`];
    const filterParams = [];

    if (search && String(search).trim()) {
      filterParams.push(`%${String(search).trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(u.name) LIKE $${filterParams.length} OR LOWER(u.email) LIKE $${filterParams.length})`
      );
    }

    if (active === 'true' || active === 'false') {
      filterParams.push(active === 'true');
      conditions.push(`u.active = $${filterParams.length}`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    const countSql = `SELECT COUNT(*)::int AS total FROM users u ${whereClause}`;
    const listParams = [...filterParams, safeLimit, safeOffset];
    const limitParam = `$${filterParams.length + 1}`;
    const offsetParam = `$${filterParams.length + 2}`;

    const statusPriorityClause =
      String(status_priority).toLowerCase() === 'suspendida'
        ? '(CASE WHEN u.active = false THEN 0 ELSE 1 END) ASC'
        : '(CASE WHEN u.active = true THEN 0 ELSE 1 END) ASC';

    const isAsc = String(order).toLowerCase() === 'asc';
    const dateSortClause =
      String(sort_by).toLowerCase() === 'consulta'
        ? isAsc
          ? 'u.last_message_at ASC NULLS FIRST'
          : 'u.last_message_at DESC NULLS LAST'
        : isAsc
          ? 'u.created_at ASC'
          : 'u.created_at DESC';

    const listSql = `
      WITH user_data AS (
        ${ENRICHED_USER_SELECT}
      )
      SELECT *
      FROM user_data u
      ${whereClause}
      ORDER BY ${statusPriorityClause}, ${dateSortClause}, u.id ASC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const [countRes, listRes] = await Promise.all([
      query(countSql, filterParams),
      query(listSql, listParams),
    ]);

    const total = countRes.rows[0]?.total ?? 0;
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

    return res.json({
      ok: true,
      data: listRes.rows.map(formatUserRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id
 * Actualiza el estado de la cuenta de un usuario (habilitada / suspendida).
 * Reglas de integridad críticas:
 * 1. Prohibición de auto-bloqueo o auto-degradación (400 SELF_LOCKOUT)
 * 2. Prohibición de asignar otro admin o alterar roles (solo existe un único admin, el dueño del repositorio)
 */
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_ID', message: 'ID de usuario inválido' },
      });
    }

    const { role, active } = req.body ?? {};

    // Regla 1: Prohibición de auto-bloqueo / auto-degradación
    if (targetId === req.user.id && (active === false || role === 'user')) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'SELF_LOCKOUT',
          message: 'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador',
        },
      });
    }

    // Regla 2: Prohibido asignar otro admin o cambiar roles
    if (role !== undefined) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'ROLE_CHANGE_FORBIDDEN',
          message:
            'Solo se admite un único administrador (el dueño del repositorio). No es posible asignar ni modificar roles.',
        },
      });
    }

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_ACTIVE', message: 'El campo active debe ser booleano' },
      });
    }

    const { rows: targetRows } = await query(
      'SELECT id, name, email, google_id, role, active FROM users WHERE id = $1',
      [targetId]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' },
      });
    }

    const currentTarget = targetRows[0];

    if (currentTarget.role === 'admin') {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'ADMIN_PROTECTED',
          message: 'La cuenta del administrador principal no puede ser modificada ni suspendida.',
        },
      });
    }

    await query('UPDATE users SET active = $1 WHERE id = $2', [active, targetId]);

    const { rows: updatedRows } = await query(
      `${ENRICHED_USER_SELECT} WHERE u.id = $1`,
      [targetId]
    );

    return res.json({
      ok: true,
      message: active
        ? 'Cuenta de usuario habilitada correctamente'
        : 'Cuenta de usuario suspendida correctamente',
      data: formatUserRow(updatedRows[0]),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
