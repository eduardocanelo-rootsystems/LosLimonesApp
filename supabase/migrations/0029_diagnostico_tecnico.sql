-- ─── Diagnóstico Técnico en presupuestos ─────────────────────────────────────
-- Campo de texto libre para registrar el diagnóstico técnico del edificio/obra,
-- similar a observaciones pero con propósito específico de evaluación técnica.

ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS diagnostico_tecnico TEXT;
