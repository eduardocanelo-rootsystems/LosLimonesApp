-- Agrega método de cobro a presupuesto_cobros y movimientos

ALTER TABLE presupuesto_cobros
  ADD COLUMN IF NOT EXISTS metodo_cobro text;

ALTER TABLE movimientos
  ADD COLUMN IF NOT EXISTS metodo_cobro text;
