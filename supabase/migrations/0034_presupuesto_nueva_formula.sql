-- Columnas para la nueva fórmula de presupuesto (aplicadas manualmente, se commitean acá para consistencia)
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS rentabilidad_pct        numeric(8,2),
  ADD COLUMN IF NOT EXISTS cliente_paga_materiales boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_inicio_obra        date,
  ADD COLUMN IF NOT EXISTS fecha_fin_obra           date;
