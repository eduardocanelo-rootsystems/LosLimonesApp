-- Firma digital: nuevas columnas en contratos, tabla configuracion y RPCs públicos

-- 1. Nuevas columnas en contratos
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS token_firma       uuid        NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS firma_contratista_base64 text,
  ADD COLUMN IF NOT EXISTS firma_cliente_base64     text,
  ADD COLUMN IF NOT EXISTS fecha_firma_cliente      timestamptz,
  ADD COLUMN IF NOT EXISTS firmado_cliente          boolean     NOT NULL DEFAULT false;

-- Índice único para búsqueda por token
CREATE UNIQUE INDEX IF NOT EXISTS contratos_token_firma_idx ON contratos (token_firma);

-- 2. Tabla de configuración general (clave-valor)
CREATE TABLE IF NOT EXISTS configuracion (
  clave      text        PRIMARY KEY,
  valor      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'configuracion'
      AND policyname = 'config_authenticated'
  ) THEN
    CREATE POLICY "config_authenticated"
      ON configuracion FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- 3. RPC público: obtener contrato por token (para la página de firma del cliente)
CREATE OR REPLACE FUNCTION get_contrato_por_token(p_token uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id',                     c.id,
    'token_firma',            c.token_firma,
    'firmado_cliente',        c.firmado_cliente,
    'fecha_firma_cliente',    c.fecha_firma_cliente,
    'firma_contratista_base64', c.firma_contratista_base64,
    'nombre_comitente',       c.nombre_comitente,
    'nombre_administrador',   c.nombre_administrador,
    'administrador_dni',      c.administrador_dni,
    'direccion_obra',         c.direccion_obra,
    'presupuesto_numero',     p.numero,
    'presupuesto_fecha',      p.fecha_creacion,
    'total',                  (
      SELECT COALESCE(SUM(subtotal), 0)
      FROM (
        SELECT subtotal FROM presupuesto_servicios  WHERE presupuesto_id = p.id
        UNION ALL
        SELECT subtotal FROM presupuesto_materiales WHERE presupuesto_id = p.id
      ) t
    )
  )
  FROM contratos c
  JOIN presupuestos p ON p.id = c.presupuesto_id
  WHERE c.token_firma = p_token
  LIMIT 1;
$$;

-- Permitir ejecución anónima
GRANT EXECUTE ON FUNCTION get_contrato_por_token(uuid) TO anon, authenticated;

-- 4. RPC público: guardar firma del cliente
CREATE OR REPLACE FUNCTION firmar_contrato_cliente(p_token uuid, p_firma_base64 text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE contratos
  SET
    firma_cliente_base64 = p_firma_base64,
    fecha_firma_cliente  = now(),
    firmado_cliente      = true,
    updated_at           = now()
  WHERE token_firma   = p_token
    AND firmado_cliente = false;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION firmar_contrato_cliente(uuid, text) TO anon, authenticated;
