-- ─── Corrección: RLS auto-referencial en user_roles ──────────────────────────
--
-- Problema en 0023:
--   Las políticas de user_roles usaban subconsultas como
--   (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid())
--   dentro de las propias políticas de user_roles → recursión infinita en PG.
--
-- Solución: función SECURITY DEFINER que lee el rol sin pasar por RLS.
--   get_my_rol() corre con privilegios del owner (postgres), bypassa RLS
--   y devuelve el rol del usuario actual. Sin recursión.

CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- ─── user_roles: reemplazar políticas recursivas ──────────────────────────────

DROP POLICY IF EXISTS "user_roles_select" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete" ON user_roles;

CREATE POLICY "user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.get_my_rol() IN ('superadmin', 'admin')
  );

CREATE POLICY "user_roles_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND rol IN ('admin', 'socio', 'empleado')
  );

CREATE POLICY "user_roles_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    user_id != auth.uid()
    AND public.get_my_rol() IN ('superadmin', 'admin')
    AND (
      rol != 'superadmin'
      OR public.get_my_rol() = 'superadmin'
    )
  )
  WITH CHECK (
    public.get_my_rol() = 'superadmin'
    OR rol NOT IN ('superadmin')
  );

CREATE POLICY "user_roles_delete" ON user_roles
  FOR DELETE TO authenticated
  USING (
    public.get_my_rol() = 'superadmin'
    AND user_id != auth.uid()
  );

-- ─── invitaciones: reemplazar políticas con subquery a user_roles ─────────────

DROP POLICY IF EXISTS "invitaciones_select_auth" ON invitaciones;
DROP POLICY IF EXISTS "invitaciones_insert"       ON invitaciones;
DROP POLICY IF EXISTS "invitaciones_update"       ON invitaciones;
DROP POLICY IF EXISTS "invitaciones_delete"       ON invitaciones;

CREATE POLICY "invitaciones_select_auth" ON invitaciones
  FOR SELECT TO authenticated
  USING (
    public.get_my_rol() IN ('superadmin', 'admin')
    OR (usado = false AND expires_at > now())
  );

CREATE POLICY "invitaciones_insert" ON invitaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_my_rol() IN ('superadmin', 'admin')
  );

CREATE POLICY "invitaciones_update" ON invitaciones
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    public.get_my_rol() IN ('superadmin', 'admin')
    OR usado = true
  );

CREATE POLICY "invitaciones_delete" ON invitaciones
  FOR DELETE TO authenticated
  USING (
    public.get_my_rol() IN ('superadmin', 'admin')
  );
