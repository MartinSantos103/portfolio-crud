import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

function formatUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    active: row.active,
    origin: row.google_id ? 'Google' : 'Local',
    created_at: row.created_at,
    last_login_at: row.last_login_at,
  };
}

/**
 * GET /api/users
 * Listado paginado y filtrable de usuarios registrados.
 * Query params: ?search=...&role=admin|user&active=true|false&page=1&limit=20
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { search, role, active, page = 1, limit = 20 } = req.query;
    const conditions = [];
    const filterParams = [];

    if (search && String(search).trim()) {
      filterParams.push(`%${String(search).trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(name) LIKE $${filterParams.length} OR LOWER(email) LIKE $${filterParams.length})`
      );
    }

    if (role === 'admin' || role === 'user') {
      filterParams.push(role);
      conditions.push(`role = $${filterParams.length}`);
    }

    if (active === 'true' || active === 'false') {
      filterParams.push(active === 'true');
      conditions.push(`active = $${filterParams.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    const countSql = `SELECT COUNT(*)::int AS total FROM users ${whereClause}`;
    const listParams = [...filterParams, safeLimit, safeOffset];
    const limitParam = `$${filterParams.length + 1}`;
    const offsetParam = `$${filterParams.length + 2}`;

    const listSql = `
      SELECT id, name, email, google_id, role, active, created_at, last_login_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC, id ASC
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
 * Actualiza rol o estado activo de un usuario aplicando reglas de integridad críticas:
 * 1. Prohibición de auto-bloqueo o auto-degradación (400 Bad Request)
 * 2. Garantía de al menos un Administrador Activo (409 Conflict)
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

    if (role !== undefined && role !== 'admin' && role !== 'user') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_ROLE', message: 'El rol debe ser admin o user' },
      });
    }

    if (active !== undefined && typeof active !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_ACTIVE', message: 'El campo active debe ser booleano' },
      });
    }

    // Regla 1: Prohibición de auto-bloqueo
    if (targetId === req.user.id && (active === false || role === 'user')) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'SELF_LOCKOUT',
          message: 'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador',
        },
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
    const nextRole = role !== undefined ? role : currentTarget.role;
    const nextActive = active !== undefined ? active : currentTarget.active;

    // Regla 2: Garantía de al menos un Administrador Activo
    if (currentTarget.role === 'admin' && (nextRole !== 'admin' || nextActive === false)) {
      const { rows: adminCountRows } = await query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE role = 'admin' AND active = true AND id <> $1`,
        [targetId]
      );

      if ((adminCountRows[0]?.count ?? 0) === 0) {
        return res.status(409).json({
          ok: false,
          error: {
            code: 'LAST_ACTIVE_ADMIN',
            message: 'El sistema debe conservar al menos un administrador activo',
          },
        });
      }
    }

    const { rows: updatedRows } = await query(
      `UPDATE users
       SET role = $1, active = $2
       WHERE id = $3
       RETURNING id, name, email, google_id, role, active, created_at, last_login_at`,
      [nextRole, nextActive, targetId]
    );

    return res.json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      data: formatUserRow(updatedRows[0]),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
