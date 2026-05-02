-- Agrega 'relevamiento' como estado válido de presupuesto.
-- Los relevamientos son borradores creados por empleados en obra (sin precios).
ALTER TABLE presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_estado_check,
  ADD CONSTRAINT presupuestos_estado_check
    CHECK (estado IN ('emitido', 'aprobado', 'finalizado', 'rechazado', 'relevamiento'));
