-- ─── Roles de usuario ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_roles (
  user_id      UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT    NOT NULL,
  nombre       TEXT    NOT NULL DEFAULT '',
  rol          TEXT    NOT NULL CHECK (rol IN ('superadmin', 'admin', 'socio', 'empleado')),
  activo       BOOLEAN NOT NULL DEFAULT true,
  invitado_por UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_user_roles" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Invitaciones ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invitaciones (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT    NOT NULL,
  rol          TEXT    NOT NULL CHECK (rol IN ('admin', 'socio', 'empleado')),
  token        TEXT    UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  usado        BOOLEAN NOT NULL DEFAULT false,
  creado_por   UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_invitaciones" ON invitaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Insertar superadmin ──────────────────────────────────────────────────────
-- IMPORTANTE: reemplazá 'TU-USER-ID-AQUI' con tu UUID real de Supabase Auth.
-- Lo encontrás en: Authentication → Users → tu fila → columna "UID"
--
-- INSERT INTO user_roles (user_id, email, nombre, rol)
-- VALUES ('TU-USER-ID-AQUI', 'eduardocanelo@gmail.com', 'Eduardo', 'superadmin');
