-- Convierte rentabilidad_pct de markup-sobre-costo a margen-sobre-precio.
-- Fórmula: margen_precio = markup / (100 + markup) * 100
-- Ejemplo: 181.3 → 64.4 %, 30 → 23.1 %, 100 → 50 %
UPDATE presupuestos
SET rentabilidad_pct = ROUND(
  (rentabilidad_pct / (100.0 + rentabilidad_pct)) * 100,
  2
)
WHERE rentabilidad_pct IS NOT NULL;
