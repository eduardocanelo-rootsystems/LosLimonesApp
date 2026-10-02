-- Marca servicios especiales en el catálogo
ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS es_especial boolean NOT NULL DEFAULT false;

-- Campos del panel de servicio especial en presupuestos
ALTER TABLE presupuesto_servicios
  ADD COLUMN IF NOT EXISTS es_especial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS descripcion_especifica text,
  ADD COLUMN IF NOT EXISTS precio_especial numeric(12,2),
  ADD COLUMN IF NOT EXISTS materiales_ref jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cliente_provee_materiales boolean NOT NULL DEFAULT false;
