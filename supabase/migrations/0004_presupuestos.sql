-- ────────────────────────────────────────────────────────────────────────────
-- Migración 0004: Presupuestos + ítems (servicios, materiales, mano de obra)
-- ────────────────────────────────────────────────────────────────────────────

-- Función para generar el número correlativo anual
create or replace function next_presupuesto_numero()
returns text
language plpgsql
security definer
as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_count int;
begin
  select count(*) into v_count
  from presupuestos
  where numero like 'PRESU-' || v_year || '-%';

  return 'PRESU-' || v_year || '-' || lpad((v_count + 1)::text, 4, '0');
end;
$$;

-- ─── PRESUPUESTOS ─────────────────────────────────────────────────────────────

create table if not exists presupuestos (
  id uuid primary key default uuid_generate_v4(),
  numero text unique,
  estado text not null default 'emitido'
    check (estado in ('emitido', 'aprobado', 'finalizado')),

  -- Datos del cliente
  cliente_razon_social text,
  cliente_telefono text,
  cliente_direccion text,
  cliente_administrador text,
  cliente_email text,

  -- Características de la edificación
  edif_anios int,
  edif_altura numeric(8, 2),
  edif_color text,
  edif_acabado jsonb not null default '[]'::jsonb,
  edif_m2 numeric(10, 2),
  edif_condicion_estructural text,
  edif_tipologia text,
  edif_clase_incendio text,
  edif_valor_patrimonial boolean not null default false,
  edif_proteccion text,
  coef_k numeric(4, 2),

  -- Observaciones
  observaciones text,

  -- Descuento
  descuento_tipo text check (descuento_tipo in ('fijo', 'porcentaje')),
  descuento_valor numeric(14, 2),

  -- IVA (configurable por presupuesto, default 0%)
  iva_pct numeric(5, 2) not null default 0,

  -- Análisis interno
  dias_estimados_obra int,

  -- Auditoría
  usuario_id uuid references auth.users(id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now(),
  fecha_aprobacion timestamptz,
  factura_asociada_id uuid
);

create index if not exists presupuestos_estado_idx on presupuestos (estado);
create index if not exists presupuestos_numero_idx on presupuestos (numero);
create index if not exists presupuestos_fecha_idx on presupuestos (fecha_creacion desc);

-- Trigger fecha_actualizacion
drop trigger if exists trg_presupuestos_set_fecha_actualizacion on presupuestos;
create trigger trg_presupuestos_set_fecha_actualizacion
  before update on presupuestos
  for each row execute function set_fecha_actualizacion();

-- ─── ÍTEMS DE SERVICIOS ───────────────────────────────────────────────────────

create table if not exists presupuesto_servicios (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid not null references presupuestos(id) on delete cascade,
  servicio_id uuid references servicios(id) on delete set null,
  nombre_snapshot text not null,
  precio_m2_snapshot numeric(14, 2) not null,
  m2_snapshot numeric(10, 2) not null,
  k_snapshot numeric(4, 2) not null,
  subtotal numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists presupuesto_servicios_ppto_idx
  on presupuesto_servicios (presupuesto_id);

-- ─── ÍTEMS DE MATERIALES ─────────────────────────────────────────────────────

create table if not exists presupuesto_materiales (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid not null references presupuestos(id) on delete cascade,
  material_id uuid references materiales(id) on delete set null,
  nombre_snapshot text not null,
  unidad_snapshot text not null,
  precio_snapshot numeric(14, 2) not null,
  cantidad numeric(10, 3) not null,
  subtotal numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists presupuesto_materiales_ppto_idx
  on presupuesto_materiales (presupuesto_id);

-- ─── ÍTEMS DE MANO DE OBRA ───────────────────────────────────────────────────

create table if not exists presupuesto_mano_obra (
  id uuid primary key default uuid_generate_v4(),
  presupuesto_id uuid not null references presupuestos(id) on delete cascade,
  tipo_id uuid references mano_obra_tipos(id) on delete set null,
  tipo_snapshot text not null,
  costo_diario_snapshot numeric(14, 2) not null,
  cantidad_empleados int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists presupuesto_mano_obra_ppto_idx
  on presupuesto_mano_obra (presupuesto_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table presupuestos enable row level security;
alter table presupuesto_servicios enable row level security;
alter table presupuesto_materiales enable row level security;
alter table presupuesto_mano_obra enable row level security;

-- Presupuestos
drop policy if exists "Auth users read presupuestos" on presupuestos;
create policy "Auth users read presupuestos" on presupuestos
  for select to authenticated using (true);

drop policy if exists "Auth users insert presupuestos" on presupuestos;
create policy "Auth users insert presupuestos" on presupuestos
  for insert to authenticated with check (true);

drop policy if exists "Auth users update presupuestos" on presupuestos;
create policy "Auth users update presupuestos" on presupuestos
  for update to authenticated using (true) with check (true);

-- Servicios
drop policy if exists "Auth users all presupuesto_servicios" on presupuesto_servicios;
create policy "Auth users all presupuesto_servicios" on presupuesto_servicios
  for all to authenticated using (true) with check (true);

-- Materiales
drop policy if exists "Auth users all presupuesto_materiales" on presupuesto_materiales;
create policy "Auth users all presupuesto_materiales" on presupuesto_materiales
  for all to authenticated using (true) with check (true);

-- Mano de obra
drop policy if exists "Auth users all presupuesto_mano_obra" on presupuesto_mano_obra;
create policy "Auth users all presupuesto_mano_obra" on presupuesto_mano_obra
  for all to authenticated using (true) with check (true);

-- Permiso para ejecutar la función de número
grant execute on function next_presupuesto_numero() to authenticated;
