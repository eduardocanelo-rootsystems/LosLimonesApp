-- RLS para la tabla contratos (faltaba desde 0007)

ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auth users select contratos" ON contratos;
CREATE POLICY "Auth users select contratos" ON contratos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Auth users insert contratos" ON contratos;
CREATE POLICY "Auth users insert contratos" ON contratos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users update contratos" ON contratos;
CREATE POLICY "Auth users update contratos" ON contratos
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
