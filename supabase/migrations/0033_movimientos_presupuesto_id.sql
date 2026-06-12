-- Permite asociar un movimiento (egreso/compra_sf) a un presupuesto aprobado
ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS presupuesto_id uuid REFERENCES presupuestos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS movimientos_presupuesto_id_idx ON movimientos(presupuesto_id);
