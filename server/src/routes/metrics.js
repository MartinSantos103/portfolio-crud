import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const router = Router();

const VALID_EVENT_TYPES = ['visit', 'page_view', 'project_view', 'demo_view'];
const VALID_GROUP_BY = ['day', 'week', 'month'];
const TIMEZONE = 'America/Argentina/Salta';

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * POST /api/metrics/events
 * Registra eventos de navegación pública y autenticada (visit, page_view, project_view, demo_view).
 */
router.post('/events', optionalAuth, async (req, res, next) => {
  try {
    const { type, path = '/', session_id, project_id = null } = req.body ?? {};
    if (!VALID_EVENT_TYPES.includes(type) || !session_id || typeof session_id !== 'string') {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_EVENT', message: 'Se requiere type válido y session_id' },
      });
    }

    const userId = req.user?.id || null;
    const validProjectId = project_id ? Number(project_id) : null;

    const { rows } = await query(
      `INSERT INTO events (type, path, session_id, user_id, project_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, session_id, user_id, project_id, created_at`,
      [type, String(path).slice(0, 300), session_id.slice(0, 120), userId, validProjectId]
    );

    return res.status(201).json({ ok: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/metrics/summary
 * Resumen operativo rápido para /admin (4 KPIs de los últimos 30 días + últimos 5 mensajes nuevos).
 */
router.get('/summary', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const [sessionsRes, pendingMsgsRes, publishedProjsRes, recentMsgsRes] = await Promise.all([
      query(`
        SELECT
          COUNT(DISTINCT session_id)::int AS total_sessions,
          COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NOT NULL)::int AS authenticated_sessions
        FROM events
        WHERE created_at >= now() - INTERVAL '30 days'
      `),
      query(`SELECT COUNT(*)::int AS count FROM messages WHERE status = 'nuevo'`),
      query(`SELECT COUNT(*)::int AS count FROM projects WHERE published = TRUE`),
      query(`
        SELECT id, type, name, email, subject, status, created_at
        FROM messages
        WHERE status = 'nuevo'
        ORDER BY created_at DESC, id DESC
        LIMIT 30
      `),
    ]);

    return res.json({
      ok: true,
      data: {
        kpis: {
          totalSessions: sessionsRes.rows[0]?.total_sessions ?? 0,
          authenticatedSessions: sessionsRes.rows[0]?.authenticated_sessions ?? 0,
          pendingMessages: pendingMsgsRes.rows[0]?.count ?? 0,
          publishedProjects: publishedProjsRes.rows[0]?.count ?? 0,
        },
        recentMessages: recentMsgsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/metrics
 * Consultas analíticas parametrizadas para /admin/metricas.
 * Query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month&projectSegment=all|authenticated
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 29);

    const rawFrom = String(req.query.from || formatIsoDate(defaultFrom)).slice(0, 10);
    const rawTo = String(req.query.to || formatIsoDate(now)).slice(0, 10);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const fromDateStr = dateRegex.test(rawFrom) ? rawFrom : formatIsoDate(defaultFrom);
    const toDateStr = dateRegex.test(rawTo) ? rawTo : formatIsoDate(now);

    const fromMs = new Date(`${fromDateStr}T00:00:00Z`).getTime();
    const toMs = new Date(`${toDateStr}T23:59:59Z`).getTime();
    const diffDays = Math.max(Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24)), 1);

    let groupBy = VALID_GROUP_BY.includes(req.query.groupBy) ? req.query.groupBy : 'day';
    // Regla automática de legibilidad: si supera los 90 días, se prohíbe 'day'
    if (diffDays > 90 && groupBy === 'day') {
      groupBy = 'week';
    }

    const stepInterval =
      groupBy === 'month' ? '1 month' : groupBy === 'week' ? '1 week' : '1 day';

    const projectSegment =
      req.query.projectSegment === 'authenticated' ? 'authenticated' : 'all';

    // 1. Evolución de Sesiones en el Tiempo (con generate_series y zona horaria America/Argentina/Salta)
    const sessionsSeriesSql = `
      WITH bounds AS (
        SELECT
          DATE_TRUNC($1, ($2::date)::timestamp) AS start_bucket,
          DATE_TRUNC($1, ($3::date)::timestamp) AS end_bucket
      ),
      buckets AS (
        SELECT generate_series(start_bucket, end_bucket, $4::interval) AS bucket
        FROM bounds
      ),
      agg AS (
        SELECT
          DATE_TRUNC($1, e.created_at AT TIME ZONE '${TIMEZONE}') AS bucket,
          COUNT(DISTINCT e.session_id)::int AS visitas_generales,
          COUNT(DISTINCT e.session_id) FILTER (WHERE e.user_id IS NOT NULL)::int AS visitas_autenticadas
        FROM events e
        WHERE (e.created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $2::date AND $3::date
        GROUP BY 1
      )
      SELECT
        TO_CHAR(b.bucket, 'YYYY-MM-DD') AS bucket,
        COALESCE(a.visitas_generales, 0)::int AS visitas_generales,
        COALESCE(a.visitas_autenticadas, 0)::int AS visitas_autenticadas
      FROM buckets b
      LEFT JOIN agg a ON a.bucket = b.bucket
      ORDER BY b.bucket ASC;
    `;

    // 2. Nuevos Usuarios Registrados por Período (filtrando role = 'user' y rellenando ceros)
    const usersSeriesSql = `
      WITH bounds AS (
        SELECT
          DATE_TRUNC($1, ($2::date)::timestamp) AS start_bucket,
          DATE_TRUNC($1, ($3::date)::timestamp) AS end_bucket
      ),
      buckets AS (
        SELECT generate_series(start_bucket, end_bucket, $4::interval) AS bucket
        FROM bounds
      ),
      agg AS (
        SELECT
          DATE_TRUNC($1, u.created_at AT TIME ZONE '${TIMEZONE}') AS bucket,
          COUNT(*)::int AS nuevos_usuarios
        FROM users u
        WHERE u.role = 'user'
          AND (u.created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $2::date AND $3::date
        GROUP BY 1
      )
      SELECT
        TO_CHAR(b.bucket, 'YYYY-MM-DD') AS bucket,
        COALESCE(a.nuevos_usuarios, 0)::int AS nuevos_usuarios
      FROM buckets b
      LEFT JOIN agg a ON a.bucket = b.bucket
      ORDER BY b.bucket ASC;
    `;

    // 3. Distribución por Tipo de Consulta en el rango elegido
    const messagesDistSql = `
      SELECT
        type,
        COUNT(*)::int AS count
      FROM messages
      WHERE (created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
      GROUP BY type;
    `;

    // 4. Ranking de Proyectos Más Vistos (event_type = 'project_view')
    const topProjectsSql = `
      SELECT
        p.id,
        p.title,
        COUNT(e.id)::int AS views
      FROM events e
      INNER JOIN projects p ON p.id = e.project_id
      WHERE e.type = 'project_view'
        AND e.project_id IS NOT NULL
        AND (e.created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
        ${projectSegment === 'authenticated' ? 'AND e.user_id IS NOT NULL' : ''}
      GROUP BY p.id, p.title
      ORDER BY views DESC, p.title ASC
      LIMIT 10;
    `;

    // 5. KPIs exactos del período para tasa de conversión
    const periodKpisSql = `
      SELECT
        (
          SELECT COUNT(DISTINCT session_id)::int
          FROM events
          WHERE (created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
        ) AS total_sessions,
        (
          SELECT COUNT(DISTINCT session_id) FILTER (WHERE user_id IS NOT NULL)::int
          FROM events
          WHERE (created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
        ) AS authenticated_sessions,
        (
          SELECT COUNT(*)::int
          FROM messages
          WHERE (created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
        ) AS total_messages,
        (
          SELECT COUNT(*)::int
          FROM users
          WHERE role = 'user'
            AND (created_at AT TIME ZONE '${TIMEZONE}')::date BETWEEN $1::date AND $2::date
        ) AS new_users;
    `;

    const [
      sessionsSeriesRes,
      usersSeriesRes,
      messagesDistRes,
      topProjectsRes,
      periodKpisRes,
    ] = await Promise.all([
      query(sessionsSeriesSql, [groupBy, fromDateStr, toDateStr, stepInterval]),
      query(usersSeriesSql, [groupBy, fromDateStr, toDateStr, stepInterval]),
      query(messagesDistSql, [fromDateStr, toDateStr]),
      query(topProjectsSql, [fromDateStr, toDateStr]),
      query(periodKpisSql, [fromDateStr, toDateStr]),
    ]);

    const kpiRow = periodKpisRes.rows[0] ?? {};
    const totalSessions = kpiRow.total_sessions ?? 0;
    const authenticatedSessions = kpiRow.authenticated_sessions ?? 0;
    const totalMessages = kpiRow.total_messages ?? 0;
    const newUsers = kpiRow.new_users ?? 0;

    // Fórmula de Tasa de Conversión a Contacto
    const conversionRate =
      totalSessions > 0
        ? Number(((totalMessages / totalSessions) * 100).toFixed(2))
        : 0;

    const typeMap = new Map(messagesDistRes.rows.map((r) => [r.type, r.count]));
    const typeLabels = {
      consulta: 'Consulta general',
      cotizacion: 'Cotización',
      asesoria: 'Asesoría técnica',
    };
    const messagesDistribution = ['cotizacion', 'consulta', 'asesoria'].map((t) => {
      const count = typeMap.get(t) ?? 0;
      const percentage =
        totalMessages > 0 ? Number(((count / totalMessages) * 100).toFixed(1)) : 0;
      return {
        type: t,
        name: typeLabels[t],
        count,
        percentage,
      };
    });

    return res.json({
      ok: true,
      data: {
        filters: {
          from: fromDateStr,
          to: toDateStr,
          groupBy,
          diffDays,
          projectSegment,
          timezone: TIMEZONE,
        },
        kpis: {
          totalSessions,
          authenticatedSessions,
          totalMessages,
          conversionRate,
          newUsers,
        },
        sessionsSeries: sessionsSeriesRes.rows,
        usersSeries: usersSeriesRes.rows,
        messagesDistribution,
        topProjects: topProjectsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
