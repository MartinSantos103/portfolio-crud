-- Migración 003: Regla estricta de un único Administrador (Dueño del Repositorio)
-- Garantiza a nivel de base de datos PostgreSQL que solo puede existir un usuario con role = 'admin'.

-- 1. Si por datos previos existiera más de un admin, degrada a 'user' todos excepto el primero (el dueño del repositorio).
UPDATE users
SET role = 'user'
WHERE role = 'admin'
  AND id NOT IN (
    SELECT id
    FROM users
    WHERE role = 'admin'
    ORDER BY (lower(email) = 'admin@pf.local') DESC, id ASC
    LIMIT 1
  );

-- 2. Índice único parcial: PostgreSQL rechazará cualquier INSERT o UPDATE que intente crear un segundo admin.
CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_unique_idx
  ON users (role)
  WHERE role = 'admin';
