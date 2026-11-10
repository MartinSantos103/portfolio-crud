-- Migración 002: Alineación de esquema con la Especificación v2 del Panel de Administración
-- Idempotente: se puede ejecutar múltiples veces sin efectos adversos.

-- 1. Proyectos: separar descripción corta (tarjeta) de las 3 secciones de detalle (Markdown) y agregar slug
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS problem TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solution TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tech_decisions TEXT NOT NULL DEFAULT '';

-- 2. Demos: soportar múltiples direcciones URL cuando el tipo es 'imagenes'
ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS urls JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE demos
  ALTER COLUMN url SET DEFAULT '';

ALTER TABLE demos
  DROP CONSTRAINT IF EXISTS demos_type_check;

ALTER TABLE demos
  ADD CONSTRAINT demos_type_check CHECK (type IN ('iframe', 'video', 'images', 'imagenes'));

-- 3. Perfil: campos completos para las 4 pestañas de edición de perfil
ALTER TABLE profile
  ADD COLUMN IF NOT EXISTS short_bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cv_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS available BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS stack JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4. Servicios: ítems destacados para tarjeta pública
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 5. Eventos y Mensajes: índices para optimizar consultas parametrizadas por fecha, usuario, proyecto y correo
CREATE INDEX IF NOT EXISTS idx_events_created_session_user
  ON events (created_at, session_id, user_id);

CREATE INDEX IF NOT EXISTS events_user_type_idx
  ON events (user_id, type);

CREATE INDEX IF NOT EXISTS events_project_type_idx
  ON events (project_id, type);

CREATE INDEX IF NOT EXISTS messages_email_lower_idx
  ON messages (lower(email));
