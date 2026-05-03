CREATE TABLE IF NOT EXISTS presupuesto_fotos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid     NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  orden       smallint    NOT NULL DEFAULT 0,
  imagen_base64 text      NOT NULL,
  nombre      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presupuesto_fotos_ppto_idx
  ON presupuesto_fotos (presupuesto_id, orden);

ALTER TABLE presupuesto_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users all presupuesto_fotos" ON presupuesto_fotos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
