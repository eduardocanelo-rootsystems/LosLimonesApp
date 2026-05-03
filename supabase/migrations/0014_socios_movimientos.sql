-- ─── Socios ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS socios (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  porcentaje  NUMERIC(5,2) NOT NULL CHECK (porcentaje >= 0 AND porcentaje <= 100),
  activo      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE socios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_socios" ON socios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── Movimientos ──────────────────────────────────────────────────────────────
-- tipo:
--   'ingreso' → cobro extra no facturado por ARCA (suma al pool general)
--   'egreso'  → gasto del negocio (resta del pool general, se distribuye a todos)
--   'retiro'  → retiro de un socio en particular (requiere socio_id)

CREATE TABLE IF NOT EXISTS movimientos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha         DATE        NOT NULL,
  descripcion   TEXT        NOT NULL,
  tipo          TEXT        NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'retiro')),
  monto         NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  socio_id      UUID        REFERENCES socios(id) ON DELETE SET NULL,
  categoria     TEXT,
  observaciones TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_movimientos" ON movimientos FOR ALL TO authenticated USING (true) WITH CHECK (true);
