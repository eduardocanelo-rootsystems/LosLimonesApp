-- Tasa de interés mensual (%) para la cláusula de rescisión del contrato.
ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tasa_interes numeric(5,2);
