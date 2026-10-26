import { Router } from 'express';
import { query } from '../db/pool.js';
import { sendNotificationEmail } from '../services/mail.js';
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
      ...camposExtra
    } = req.body ?? {};

    const finalType = tipo || type;
    const finalName = (nombre || name || '').trim();
    const finalEmail = (email || '').trim().toLowerCase();
    const finalSubject = (asunto || subject || '').trim();
    const finalBody = (mensaje || body || '').trim();

    // 1. Validación de campos obligatorios
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

    // 2. Extraer datos adicionales (ej. presupuesto, plazo, tipo_proyecto)
    const datosAdicionales = Object.keys(camposExtra).length > 0 ? camposExtra : {};
    const userId = req.user?.id || req.userId || null;

    // 3. Inserción en la base de datos (PostgreSQL Neon)
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

    // 4. Envío asíncrono de correo mediante Nodemailer (no aborta la petición si falla)
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

    // 5. Respuesta conforme al contrato
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
 * Listado de mensajes para el panel de administración.
 * Filtros opcionales por query: ?status=nuevo&type=cotizacion
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    const conditions = [];
    const params = [];

    if (status && ESTADOS_VALIDOS.includes(status)) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    if (type && TIPOS_VALIDOS.includes(type)) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    params.push(safeLimit);
    const limitParam = `$${params.length}`;
    params.push(safeOffset);
    const offsetParam = `$${params.length}`;

    const sql = `
      SELECT id, user_id, type, name, email, subject, body, extra, status, created_at, updated_at
      FROM messages
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam};
    `;

    const { rows } = await query(sql, params);
    return res.json({ ok: true, data: rows });
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
