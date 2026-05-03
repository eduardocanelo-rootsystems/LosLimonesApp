ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS fecha_cuota_1 date,
  ADD COLUMN IF NOT EXISTS fecha_cuota_2 date;
