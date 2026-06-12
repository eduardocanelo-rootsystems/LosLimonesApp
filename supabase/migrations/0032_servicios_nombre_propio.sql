-- Agrega nombre propio (nombre formal para PDFs) a la tabla servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS nombre_propio text;

-- Actualiza la vista para exponer el nuevo campo
CREATE OR REPLACE VIEW vista_servicios_con_precio AS
SELECT
  s.id,
  s.nombre,
  s.nombre_propio,
  s.estado,
  s.fecha_creacion,
  s.fecha_actualizacion,
  (
    SELECT sp.precio_m2
    FROM servicios_precios sp
    WHERE sp.servicio_id = s.id
      AND sp.fecha_hasta IS NULL
    LIMIT 1
  ) AS precio_m2_actual
FROM servicios s;
