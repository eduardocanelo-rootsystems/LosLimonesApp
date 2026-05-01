-- Migración 0005: columna es_adicional en ítems de presupuesto
-- Permite marcar ítems agregados después de la aprobación

ALTER TABLE presupuesto_servicios
  ADD COLUMN IF NOT EXISTS es_adicional boolean NOT NULL DEFAULT false;

ALTER TABLE presupuesto_materiales
  ADD COLUMN IF NOT EXISTS es_adicional boolean NOT NULL DEFAULT false;

ALTER TABLE presupuesto_mano_obra
  ADD COLUMN IF NOT EXISTS es_adicional boolean NOT NULL DEFAULT false;
