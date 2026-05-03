-- Agrega columnas de financiamiento y fechas de cuota a contratos.
-- Seguro de correr múltiples veces (IF NOT EXISTS).
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS plan_pago text CHECK (plan_pago IN ('contado', '60dias', '90dias')),
  ADD COLUMN IF NOT EXISTS fecha_cuota_1 date,
  ADD COLUMN IF NOT EXISTS fecha_cuota_2 date;
