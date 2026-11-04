import { Router } from 'express';
import { getPool, query } from '../db/pool.js';
import { sendNotificationEmail, sendReplyEmail } from '../services/mail.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const TIPOS_VALIDOS = ['consulta', 'cotizacion', 'asesoria'];
const ESTADOS_VALIDOS = ['nuevo', 'leido', 'respondido', 'cerrado'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/messages
 * Guarda un nuevo mensaje de contacto y despacha la notificación por correo.
 * Acepta tanto nombres en español (tipo, nombre, asunto, mensaje) como en inglés.
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      tipo,
      type,
      nombre,
      name,
      email,
      asunto,
      subject,
      mensaje,
      body,
      extra,
      ...camposExtra
    } = req.body ?? {};

    const finalType = tipo || type;
    const finalName = (nombre || name || '').trim();
    const finalEmail = (email || '').trim().toLowerCase();
    const finalSubject = (asunto || subject || '').trim();
    const finalBody = (mensaje || body || '').trim();

    if (!finalType || !finalName || !finalEmail || !finalSubject || !finalBody) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: 'Todos los campos obligatorios deben ser completados (tipo, nombre, email, asunto, mensaje)',
        },
      });
    }

    if (!TIPOS_VALIDOS.includes(finalType)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_TYPE',
          message: `Tipo de solicitud no válido. Opciones permitidas: ${TIPOS_VALIDOS.join(', ')}`,
        },
      });
    }

    if (!EMAIL_REGEX.test(finalEmail) || finalEmail.length > 254) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_EMAIL',
          message: 'El formato del correo electrónico es inválido',
        },
      });
    }

    if (finalName.length > 100) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'NAME_TOO_LONG',
          message: 'El nombre no puede superar los 100 caracteres',
        },
      });
    }

    if (finalSubject.length > 200) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'SUBJECT_TOO_LONG',
          message: 'El asunto no puede superar los 200 caracteres',
        },
      });
    }

    const datosAdicionales =
      extra && typeof extra === 'object'
        ? { ...extra, ...camposExtra }
        : Object.keys(camposExtra).length > 0
          ? camposExtra
          : {};
    const userId = req.user?.id || req.userId || null;

    const sql = `
      INSERT INTO messages (user_id, type, name, email, subject, body, extra, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'nuevo')
      RETURNING id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at;
    `;
    const params = [
      userId,
      finalType,
      finalName,
      finalEmail,
      finalSubject,
      finalBody,
      JSON.stringify(datosAdicionales),
    ];

    const { rows } = await query(sql, params);
    const mensajeCreado = rows[0];

    try {
      await sendNotificationEmail({
        tipo: finalType,
        nombre: finalName,
        email: finalEmail,
        asunto: finalSubject,
        mensaje: finalBody,
        datos_adicionales: datosAdicionales,
      });
    } catch (mailError) {
      console.error('⚠️ [messages.js] Error al despachar notificación por correo:', mailError.message);
    }

    return res.status(201).json({
      ok: true,
      message: 'Mensaje enviado y registrado con éxito',
      data: {
        id: mensajeCreado.id,
        tipo: mensajeCreado.type,
        nombre: mensajeCreado.name,
        email: mensajeCreado.email,
        asunto: mensajeCreado.subject,
        estado: mensajeCreado.status,
        creado_en: mensajeCreado.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages
 * Listado paginado y filtrable de mensajes para el panel de administración.
 * Filtros: ?type=...&status=...&page=1&limit=15
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, type, page, limit = 15, offset } = req.query;
    const conditions = [];
    const filterParams = [];

    if (status && ESTADOS_VALIDOS.includes(status)) {
      filterParams.push(status);
      conditions.push(`status = $${filterParams.length}`);
    }

    if (type && TIPOS_VALIDOS.includes(type)) {
      filterParams.push(type);
      conditions.push(`type = $${filterParams.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(Number(limit) || 15, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeOffset =
      offset !== undefined ? Math.max(Number(offset) || 0, 0) : (safePage - 1) * safeLimit;

    const countSql = `SELECT COUNT(*)::int AS total FROM messages ${whereClause}`;
    const unreadSql = `SELECT COUNT(*)::int AS unread FROM messages WHERE status = 'nuevo'`;

    const params = [...filterParams, safeLimit, safeOffset];
    const limitParam = `$${filterParams.length + 1}`;
    const offsetParam = `$${filterParams.length + 2}`;

    const listSql = `
      SELECT id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at
      FROM messages
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const [countRes, unreadRes, listRes] = await Promise.all([
      query(countSql, filterParams),
      query(unreadSql),
      query(listSql, params),
    ]);

    const total = countRes.rows[0]?.total ?? 0;
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1);

    return res.json({
      ok: true,
      data: listRes.rows,
      unreadCount: unreadRes.rows[0]?.unread ?? 0,
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
 * GET /api/messages/:id
 * Obtiene el detalle de un mensaje junto con el historial de respuestas enviadas.
 */
router.get('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_ID', message: 'ID de mensaje inválido' },
      });
    }

    const { rows } = await query(
      `SELECT id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at
       FROM messages
       WHERE id = $1`,
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' },
      });
    }

    const { rows: replies } = await query(
      `SELECT r.id, r.message_id, r.author_id, r.body, r.created_at, u.name AS author_name
       FROM message_replies r
       LEFT JOIN users u ON u.id = r.author_id
       WHERE r.message_id = $1
       ORDER BY r.created_at ASC, r.id ASC`,
      [messageId]
    );

    return res.json({
      ok: true,
      data: {
        ...rows[0],
        replies,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/messages/:id/status
 * Actualiza el estado de un mensaje (nuevo, leido, respondido, cerrado).
 */
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!ESTADOS_VALIDOS.includes(status)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Estado inválido. Opciones permitidas: ${ESTADOS_VALIDOS.join(', ')}`,
        },
      });
    }

    const sql = `
      UPDATE messages
      SET status = $1, updated_at = now()
      WHERE id = $2
      RETURNING id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at;
    `;
    const { rows } = await query(sql, [status, messageId]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' },
      });
    }

    return res.json({
      ok: true,
      message: 'Estado del mensaje actualizado correctamente',
      data: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/messages/:id/reply
 * Envía respuesta por correo mediante Nodemailer y, SOLO si tiene éxito,
 * registra la respuesta y actualiza el estado a 'respondido' en una transacción SQL.
 */
router.post('/:id/reply', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    const replyBody = String(req.body?.body ?? req.body?.reply ?? '').trim();
    const simulateSmtpFailure = Boolean(req.body?.simulateSmtpFailure);

    if (!replyBody) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'VALIDATION',
          message: 'El cuerpo de la respuesta no puede estar vacío',
        },
      });
    }

    const { rows: msgRows } = await query(
      'SELECT id, name, email, subject, body, status FROM messages WHERE id = $1',
      [messageId]
    );

    if (msgRows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' },
      });
    }

    const message = msgRows[0];

    // 1. Intentar primero el envío SMTP por Nodemailer
    try {
      await sendReplyEmail({
        to: message.email,
        name: message.name,
        subject: message.subject,
        originalBody: message.body,
        replyBody,
        simulateSmtpFailure,
      });
    } catch (smtpErr) {
      console.error('❌ [messages.js] Fallo en envío SMTP al responder mensaje:', smtpErr.message);
      return res.status(502).json({
        ok: false,
        error: {
          code: 'SMTP_ERROR',
          message: `No se pudo enviar el correo por SMTP (${smtpErr.message}). No se modificó el estado del mensaje.`,
        },
      });
    }

    // 2. Solo si el correo se envió con éxito, ejecutar transacción SQL
    const client = await getPool().connect();
    try {
      await client.query('BEGIN');

      const { rows: replyRows } = await client.query(
        `INSERT INTO message_replies (message_id, author_id, body)
         VALUES ($1, $2, $3)
         RETURNING id, message_id, author_id, body, created_at`,
        [messageId, req.user.id, replyBody]
      );

      const { rows: updatedMsgRows } = await client.query(
        `UPDATE messages
         SET status = 'respondido', updated_at = now()
         WHERE id = $1
         RETURNING id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at`,
        [messageId]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        ok: true,
        message: 'Respuesta enviada por correo y registrada correctamente',
        data: {
          reply: replyRows[0],
          message: updatedMsgRows[0],
        },
      });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/messages/:id
 * Elimina un mensaje por su ID.
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const messageId = Number(req.params.id);
    const { rows } = await query('DELETE FROM messages WHERE id = $1 RETURNING id;', [messageId]);

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Mensaje no encontrado' },
      });
    }

    return res.json({
      ok: true,
      message: 'Mensaje eliminado correctamente',
      id: messageId,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
