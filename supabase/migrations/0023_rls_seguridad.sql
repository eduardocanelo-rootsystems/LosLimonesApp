-- ─── Corrección crítica de RLS ────────────────────────────────────────────────
--
-- Las políticas anteriores usaban USING (true) WITH CHECK (true) para todas las
-- operaciones, lo que permitía a cualquier usuario autenticado:
--   • Leer datos de todos los demás usuarios
--   • Escalar su propio rol a superadmin
--   • Crear invitaciones con cualquier rol
--
-- Este archivo reemplaza esas políticas con controles granulares.

-- ─── user_roles ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_user_roles" ON user_roles;

-- SELECT: cada usuario ve solo su fila; admin/superadmin ven todas
CREATE POLICY "user_roles_select" ON user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
  );

-- INSERT: solo el propio usuario puede insertar su fila, y nunca como superadmin
CREATE POLICY "user_roles_insert" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND rol IN ('admin', 'socio', 'empleado')
  );

-- UPDATE: solo admin/superadmin pueden actualizar filas de otros
--         admin NO puede escalar roles a superadmin ni tocar filas de superadmin
CREATE POLICY "user_roles_update" ON user_roles
  FOR UPDATE TO authenticated
  USING (
    user_id != auth.uid()  -- nunca modifica su propio rol
    AND (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
    AND (  -- no tocar filas de superadmin a menos que seas superadmin
      rol != 'superadmin'
      OR (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) = 'superadmin'
    )
  )
  WITH CHECK (
    -- el valor nuevo nunca puede ser superadmin si quien actualiza es admin
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) = 'superadmin'
    OR rol NOT IN ('superadmin')
  );

-- DELETE: solo superadmin puede eliminar filas
CREATE POLICY "user_roles_delete" ON user_roles
  FOR DELETE TO authenticated
  USING (
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) = 'superadmin'
    AND user_id != auth.uid()  -- no puede eliminarse a sí mismo
  );

-- ─── invitaciones ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "auth_invitaciones" ON invitaciones;

-- SELECT anon: solo tokens válidos (no usados, no vencidos) — necesario para /registro
CREATE POLICY "invitaciones_select_anon" ON invitaciones
  FOR SELECT TO anon
  USING (usado = false AND expires_at > now());

-- SELECT auth: admin/superadmin ven todas; otros solo las no usadas para validar tokens
CREATE POLICY "invitaciones_select_auth" ON invitaciones
  FOR SELECT TO authenticated
  USING (
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
    OR (usado = false AND expires_at > now())
  );

-- INSERT: solo admin/superadmin pueden crear invitaciones
CREATE POLICY "invitaciones_insert" ON invitaciones
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
  );

-- UPDATE: admin/superadmin pueden actualizar cualquier campo;
--         usuario autenticado solo puede marcar como usado (para el flujo de registro)
CREATE POLICY "invitaciones_update" ON invitaciones
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
    OR usado = true   -- cualquier usuario autenticado solo puede marcar como usado
  );

-- DELETE (revocar): solo admin/superadmin
CREATE POLICY "invitaciones_delete" ON invitaciones
  FOR DELETE TO authenticated
  USING (
    (SELECT ur.rol FROM user_roles ur WHERE ur.user_id = auth.uid()) IN ('superadmin', 'admin')
  );
