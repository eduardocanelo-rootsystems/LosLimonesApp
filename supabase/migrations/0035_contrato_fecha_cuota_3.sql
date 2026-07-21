-- Tercera cuota para el plan de 90 días (anticipo + 3 cuotas mensuales)
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS fecha_cuota_3 date;
