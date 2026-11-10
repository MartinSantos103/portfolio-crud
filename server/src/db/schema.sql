-- Esquema completo del portfolio.
-- Es idempotente: se puede ejecutar todas las veces que haga falta.
-- Editar este archivo NO modifica tablas que ya existen: los cambios sobre
-- tablas creadas van en migraciones nuevas.

CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  role          TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_unique_idx ON users (role) WHERE role = 'admin';

CREATE TABLE IF NOT EXISTS profile (
  id            SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  full_name     TEXT,
  headline      TEXT,
  short_bio     TEXT NOT NULL DEFAULT '',
  bio           TEXT,
  photo_url     TEXT,
  location      TEXT,
  contact_email TEXT,
  cv_url        TEXT NOT NULL DEFAULT '',
  available     BOOLEAN NOT NULL DEFAULT TRUE,
  social_links  JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills        JSONB NOT NULL DEFAULT '[]'::jsonb,
  stack         JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience    JSONB NOT NULL DEFAULT '[]'::jsonb,
  education     JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  icon        TEXT,
  items       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title           TEXT        NOT NULL,
  slug            TEXT        NOT NULL DEFAULT '',
  summary         TEXT        NOT NULL DEFAULT '',   -- previsualización, visible para todos
  description     TEXT        NOT NULL DEFAULT '',   -- detalle corto de tarjeta
  problem         TEXT        NOT NULL DEFAULT '',
  solution        TEXT        NOT NULL DEFAULT '',
  tech_decisions  TEXT        NOT NULL DEFAULT '',
  technologies    TEXT[]      NOT NULL DEFAULT '{}',
  repo_url        TEXT,
  live_url        TEXT,
  cover_image_url TEXT,
  featured        BOOLEAN     NOT NULL DEFAULT FALSE,
  published       BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order      INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_images (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  url        TEXT    NOT NULL,
  alt        TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS project_images_project_idx ON project_images (project_id);

CREATE TABLE IF NOT EXISTS demos (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id  INTEGER     NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  type        TEXT        NOT NULL CHECK (type IN ('iframe', 'video', 'images', 'imagenes')),
  url         TEXT        NOT NULL DEFAULT '',
  urls        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS demos_project_idx ON demos (project_id);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  type       TEXT        NOT NULL CHECK (type IN ('consulta', 'cotizacion', 'asesoria')),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  extra      JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- campos propios de cada tipo
  status     TEXT        NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'leido', 'respondido', 'cerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_status_created_idx ON messages (status, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_type_idx ON messages (type);
CREATE INDEX IF NOT EXISTS messages_user_idx ON messages (user_id);
CREATE INDEX IF NOT EXISTS messages_email_lower_idx ON messages (lower(email));

CREATE TABLE IF NOT EXISTS message_replies (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message_id INTEGER     NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  author_id  INTEGER REFERENCES users (id) ON DELETE SET NULL,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS message_replies_message_idx ON message_replies (message_id);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type       TEXT        NOT NULL CHECK (type IN ('visit', 'page_view', 'project_view', 'demo_view')),
  path       TEXT,
  session_id TEXT        NOT NULL,
  user_id    INTEGER REFERENCES users (id) ON DELETE SET NULL,
  project_id INTEGER REFERENCES projects (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at);
CREATE INDEX IF NOT EXISTS events_type_created_idx ON events (type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_created_session_user ON events (created_at, session_id, user_id);
CREATE INDEX IF NOT EXISTS events_user_type_idx ON events (user_id, type);
CREATE INDEX IF NOT EXISTS events_project_type_idx ON events (project_id, type);
