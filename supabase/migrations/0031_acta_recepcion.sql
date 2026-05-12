-- ─── Acta de Recepción Provisoria de Obra ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS acta_recepciones (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id           uuid        NOT NULL UNIQUE REFERENCES presupuestos(id) ON DELETE CASCADE,
  fecha_recepcion_prov     date,
  observaciones_generales  text,
  firma_contratista_base64 text,
  firma_cliente_base64     text,
  firmado_cliente          boolean     NOT NULL DEFAULT false,
  fecha_firma_cliente      timestamptz,
  token_firma              uuid        NOT NULL DEFAULT gen_random_uuid(),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS acta_recepciones_token_idx    ON acta_recepciones(token_firma);
CREATE        INDEX IF NOT EXISTS acta_recepciones_ppto_idx     ON acta_recepciones(presupuesto_id);

-- Ítems del acta (uno por servicio del presupuesto)
CREATE TABLE IF NOT EXISTS acta_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  acta_id         uuid        NOT NULL REFERENCES acta_recepciones(id) ON DELETE CASCADE,
  servicio_nombre text        NOT NULL,
  completado      boolean     NOT NULL DEFAULT true,
  observacion     text,
  orden           smallint    NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acta_items_acta_idx ON acta_items(acta_id);

-- RLS
ALTER TABLE acta_recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE acta_items       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acta_select" ON acta_recepciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "acta_insert" ON acta_recepciones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "acta_update" ON acta_recepciones FOR UPDATE TO authenticated USING (true);
CREATE POLICY "acta_delete" ON acta_recepciones FOR DELETE TO authenticated USING (true);

CREATE POLICY "acta_items_select" ON acta_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "acta_items_all"    ON acta_items FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- ─── RPC pública: obtener acta por token ──────────────────────────────────────

CREATE OR REPLACE FUNCTION get_acta_por_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id',                       ar.id,
    'token_firma',              ar.token_firma,
    'firmado_cliente',          ar.firmado_cliente,
    'fecha_firma_cliente',      ar.fecha_firma_cliente,
    'firma_contratista_base64', ar.firma_contratista_base64,
    'observaciones_generales',  ar.observaciones_generales,
    'fecha_recepcion_prov',     ar.fecha_recepcion_prov,
    'nombre_comitente',         p.cliente_razon_social,
    'nombre_administrador',     p.cliente_administrador,
    'administrador_dni',        p.cliente_administrador_cuit,
    'direccion_obra',           p.cliente_direccion,
    'presupuesto_numero',       p.numero,
    'presupuesto_fecha',        p.fecha_creacion,
    'items', (
      SELECT json_agg(
        json_build_object(
          'id',              ai.id,
          'servicio_nombre', ai.servicio_nombre,
          'completado',      ai.completado,
          'observacion',     ai.observacion,
          'orden',           ai.orden
        ) ORDER BY ai.orden, ai.created_at
      )
      FROM acta_items ai WHERE ai.acta_id = ar.id
    )
  )
  INTO v_result
  FROM acta_recepciones ar
  JOIN presupuestos p ON p.id = ar.presupuesto_id
  WHERE ar.token_firma = p_token;

  RETURN v_result;
END;
$$;

-- ─── RPC pública: firmar acta (cliente sin auth) ──────────────────────────────

CREATE OR REPLACE FUNCTION firmar_acta_cliente(p_token uuid, p_firma_base64 text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_acta_id    uuid;
  v_ppto_id    uuid;
  v_ya_firmado boolean;
BEGIN
  SELECT id, presupuesto_id, firmado_cliente
    INTO v_acta_id, v_ppto_id, v_ya_firmado
    FROM acta_recepciones
   WHERE token_firma = p_token;

  IF v_acta_id IS NULL OR v_ya_firmado THEN
    RETURN false;
  END IF;

  UPDATE acta_recepciones
     SET firmado_cliente          = true,
         fecha_firma_cliente      = now(),
         firma_cliente_base64     = p_firma_base64,
         updated_at               = now()
   WHERE id = v_acta_id;

  -- Al firmar el acta, la obra pasa a finalizado
  UPDATE presupuestos
     SET estado               = 'finalizado',
         fecha_actualizacion  = now()
   WHERE id = v_ppto_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION get_acta_por_token(uuid)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION firmar_acta_cliente(uuid, text)   TO anon, authenticated;
