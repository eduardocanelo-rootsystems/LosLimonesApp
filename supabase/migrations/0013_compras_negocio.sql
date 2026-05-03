-- Agrega campo es_negocio a compras_recibidas.
-- Por defecto todas las facturas recibidas aplican al negocio (true).
-- El usuario marca manualmente las que NO aplican.

ALTER TABLE compras_recibidas
  ADD COLUMN IF NOT EXISTS es_negocio boolean NOT NULL DEFAULT true;

-- Si la columna ya existía con DEFAULT false, corregir:
ALTER TABLE compras_recibidas ALTER COLUMN es_negocio SET DEFAULT true;
UPDATE compras_recibidas SET es_negocio = true WHERE es_negocio = false;
