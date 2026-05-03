-- ─── Trigger: crear user_roles automáticamente al crear un auth.user ──────────
--
-- Problema que resuelve:
--   signUp() puede retornar sin sesión (confirmación de email activa), por lo que
--   el INSERT a user_roles desde el cliente falla silenciosamente (RLS bloquea anon).
--   El trigger corre server-side con SECURITY DEFINER y no depende de la sesión.
--
-- Lógica:
--   1. Busca una invitación válida (no usada, no vencida) para el email del nuevo usuario.
--   2. Si la encuentra: crea user_roles con el rol/activo de la invitación y la marca como usada.
--   3. Si no: crea user_roles con activo=false y rol='empleado' (activación manual por admin).
--   4. Si falla por cualquier razón: loguea advertencia sin bloquear la creación del usuario.

CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv    RECORD;
  v_rol    text    := 'empleado';
  v_activo boolean := false;
  v_inv_by uuid    := null;
BEGIN
  -- Buscar invitación válida para este email (server-side — no confía en metadatos del cliente)
  SELECT rol, creado_por
  INTO   v_inv
  FROM   public.invitaciones
  WHERE  email      = NEW.email
    AND  usado      = false
    AND  expires_at > now()
  LIMIT 1;

  IF FOUND THEN
    -- Validar rol (nunca superadmin vía invitación; el superadmin se asigna manualmente)
    v_rol    := CASE
                  WHEN v_inv.rol IN ('admin', 'socio', 'empleado') THEN v_inv.rol
                  ELSE 'empleado'
                END;
    v_activo := true;
    v_inv_by := v_inv.creado_por;

    -- Marcar la invitación como usada (server-side, bypassea RLS)
    UPDATE public.invitaciones
    SET    usado = true
    WHERE  email = NEW.email
      AND  usado = false;
  ELSE
    -- Registro libre sin invitación: inactivo hasta que el admin lo habilite
    v_rol    := 'empleado';
    v_activo := false;
  END IF;

  INSERT INTO public.user_roles (user_id, email, nombre, rol, activo, invitado_por)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    v_rol,
    v_activo,
    v_inv_by
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Nunca bloquear la creación del usuario por un error en este trigger
  RAISE WARNING '[on_auth_user_created] error para %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_auth_user_created();
