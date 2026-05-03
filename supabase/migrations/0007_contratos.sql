CREATE TABLE IF NOT EXISTS contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presupuesto_id uuid NOT NULL UNIQUE REFERENCES presupuestos(id) ON DELETE CASCADE,
  nombre_comitente text,
  direccion_obra text,
  nombre_administrador text,
  administrador_dni text,
  sector_obra text,
  adelanto numeric(12,2),
  num_cuotas integer,
  monto_cuota numeric(12,2),
  monto_multa numeric(12,2),
  direccion_legal text,
  fecha_inicio_obra date,
  fecha_firma date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
