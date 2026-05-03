-- Ventas y Compras: cuentas ARCA, facturas emitidas, compras recibidas

-- 1. Cuentas ARCA (los 3 monotributistas)
CREATE TABLE IF NOT EXISTS cuentas_arca (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  cuit       text        NOT NULL UNIQUE,
  activo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cuentas_arca ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='cuentas_arca' AND policyname='cuentas_arca_auth') THEN
    CREATE POLICY "cuentas_arca_auth" ON cuentas_arca FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 2. Facturas emitidas (Ventas)
CREATE TABLE IF NOT EXISTS facturas_emitidas (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_arca_id      uuid          REFERENCES cuentas_arca(id) ON DELETE SET NULL,
  -- Emisor (el monotributista que facturó)
  cuit_emisor         text          NOT NULL,
  -- Datos del comprobante (del Excel de ARCA)
  fecha_emision       date          NOT NULL,
  tipo_comprobante    text          NOT NULL,
  punto_venta         text          NOT NULL,
  numero              text          NOT NULL,
  cae                 text,
  denominacion        text,         -- razón social del cliente
  cuit_receptor       text,         -- CUIT del cliente
  imp_total           numeric(14,2) NOT NULL DEFAULT 0,
  -- Campos editables manualmente
  fecha_cobro         date,
  forma_pago          text,
  nro_comprobante     text,         -- nro. comprobante de cobro
  fecha_vencimiento   date,
  -- NC
  anulada             boolean       NOT NULL DEFAULT false,
  factura_asociada_id uuid          REFERENCES facturas_emitidas(id) ON DELETE SET NULL,
  -- Control
  synced_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (cuit_emisor, punto_venta, numero, tipo_comprobante)
);

ALTER TABLE facturas_emitidas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='facturas_emitidas' AND policyname='facturas_emitidas_auth') THEN
    CREATE POLICY "facturas_emitidas_auth" ON facturas_emitidas FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 3. Compras recibidas
CREATE TABLE IF NOT EXISTS compras_recibidas (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_arca_id      uuid          REFERENCES cuentas_arca(id) ON DELETE SET NULL,
  -- Receptor (el monotributista que recibió la factura)
  cuit_receptor       text          NOT NULL,
  -- Datos del comprobante (del Excel de ARCA)
  fecha_emision       date          NOT NULL,
  tipo_comprobante    text          NOT NULL,
  punto_venta         text          NOT NULL,
  numero              text          NOT NULL,
  denominacion        text,         -- razón social del proveedor
  cuit_emisor         text,         -- CUIT del proveedor
  imp_total           numeric(14,2) NOT NULL DEFAULT 0,
  -- NC
  anulada             boolean       NOT NULL DEFAULT false,
  factura_asociada_id uuid          REFERENCES compras_recibidas(id) ON DELETE SET NULL,
  -- Control
  synced_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now(),
  UNIQUE (cuit_receptor, cuit_emisor, punto_venta, numero, tipo_comprobante)
);

ALTER TABLE compras_recibidas ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='compras_recibidas' AND policyname='compras_recibidas_auth') THEN
    CREATE POLICY "compras_recibidas_auth" ON compras_recibidas FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END$$;
