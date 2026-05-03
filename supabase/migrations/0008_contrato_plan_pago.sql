ALTER TABLE contratos ADD COLUMN IF NOT EXISTS plan_pago text CHECK (plan_pago IN ('contado', '60dias', '90dias'));
