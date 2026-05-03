-- Guarda el importe total al cliente (con recargo + IVA) y el importe
-- correspondiente solo a servicios (la parte que se considera ganancia).
-- Ambos se calculan en el front al guardar y quedan como snapshot.
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS importe_servicios numeric(14, 2),
  ADD COLUMN IF NOT EXISTS importe_total     numeric(14, 2);
