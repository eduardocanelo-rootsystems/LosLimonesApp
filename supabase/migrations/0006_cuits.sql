-- Migración 0006: CUIT de razón social y administrador
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS cliente_cuit text,
  ADD COLUMN IF NOT EXISTS cliente_administrador_cuit text;
