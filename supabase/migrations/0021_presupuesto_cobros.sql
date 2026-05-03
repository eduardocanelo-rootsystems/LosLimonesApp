-- Registra los cobros reales por presupuesto, cuota por cuota.
-- numero_cuota: 1 = anticipo, 2 = segunda cuota, 3 = tercera cuota.
-- El monto es lo efectivamente cobrado (puede diferir del planificado).
CREATE TABLE IF NOT EXISTS presupuesto_cobros (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid           NOT NULL REFERENCES presupuestos(id) ON DELETE CASCADE,
  numero_cuota   smallint       NOT NULL DEFAULT 1 CHECK (numero_cuota BETWEEN 1 AND 3),
  monto          numeric(14, 2) NOT NULL CHECK (monto > 0),
  fecha_cobro    date           NOT NULL,
  observacion    text,
  created_at     timestamptz    NOT NULL DEFAULT now()
);

-- Un presupuesto no puede tener dos registros para la misma cuota
CREATE UNIQUE INDEX IF NOT EXISTS uq_presupuesto_cobros_cuota
  ON presupuesto_cobros(presupuesto_id, numero_cuota);

CREATE INDEX IF NOT EXISTS idx_presupuesto_cobros_fecha
  ON presupuesto_cobros(fecha_cobro);

-- RLS: mismas políticas que presupuestos (authenticated puede leer/escribir)
ALTER TABLE presupuesto_cobros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cobros_select" ON presupuesto_cobros
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cobros_insert" ON presupuesto_cobros
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cobros_update" ON presupuesto_cobros
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "cobros_delete" ON presupuesto_cobros
  FOR DELETE TO authenticated USING (true);
