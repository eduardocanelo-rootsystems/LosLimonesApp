-- Campos: zona de trabajo (interiores/exteriores/ambos) y trabajo en alturas
ALTER TABLE presupuestos
  ADD COLUMN IF NOT EXISTS zona_trabajo text CHECK (zona_trabajo IN ('interiores', 'exteriores', 'ambos')),
  ADD COLUMN IF NOT EXISTS trabajo_en_alturas boolean;
