-- Agrega campo de rendimiento base por m² al catálogo de materiales.
-- Nullable: no rompe ningún dato existente ni flujo actual.
ALTER TABLE materiales
  ADD COLUMN IF NOT EXISTS rendimiento_m2 numeric(10, 4);
