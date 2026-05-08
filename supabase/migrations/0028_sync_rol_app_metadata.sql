-- ─── Trigger: sincronizar rol → app_metadata al cambiar user_roles ───────────
--
-- Problema que resuelve:
--   fetchRol() intenta leer el rol desde app_metadata del JWT para evitar
--   queries a la DB. Sin este trigger, app_metadata nunca tiene el campo "rol"
--   y cada login requiere una consulta extra a user_roles — que en dispositivos
--   móviles con señal débil puede colgar la app indefinidamente.
--
-- Efecto:
--   Cada INSERT o UPDATE en user_roles escribe automáticamente
--   { rol, activo, nombre } en raw_app_meta_data del usuario correspondiente.
--   El próximo token JWT del usuario ya incluirá esos campos, eliminando
--   la necesidad de consultar la DB en cada login.

CREATE OR REPLACE FUNCTION public.sync_user_rol_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
    'rol',    NEW.rol,
    'activo', NEW.activo,
    'nombre', NEW.nombre
  )
  WHERE id = NEW.user_id;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[sync_user_rol_to_app_metadata] error para %: %', NEW.user_id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_user_rol ON user_roles;

CREATE TRIGGER sync_user_rol
  AFTER INSERT OR UPDATE OF rol, activo, nombre ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_rol_to_app_metadata();

-- ─── Reparar usuarios existentes ─────────────────────────────────────────────
-- Copia rol/activo/nombre a app_metadata de todos los usuarios que aún no lo tienen.
-- Esto corrige a Luis, Erlyn y cualquier otro usuario registrado antes de este trigger.

UPDATE auth.users u
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object(
  'rol',    ur.rol,
  'activo', ur.activo,
  'nombre', ur.nombre
)
FROM public.user_roles ur
WHERE u.id = ur.user_id
  AND (u.raw_app_meta_data->>'rol' IS NULL);
