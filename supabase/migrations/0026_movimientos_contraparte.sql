-- Agrega contraparte (proveedor o cliente) a movimientos
-- y un subtipo para distinguir compras/ventas sin factura de movimientos generales.

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS contraparte text,
  ADD COLUMN IF NOT EXISTS subtipo     text;
