-- Margen de ganancia sobre materiales (global, snapshotted por presupuesto)
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS margen_materiales_pct numeric(8,2) NOT NULL DEFAULT 0;
