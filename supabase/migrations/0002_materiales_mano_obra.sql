-- ────────────────────────────────────────────────────────────────────────────
-- Migración 0002: Materiales + Mano de Obra con historial de precios/costos
-- ────────────────────────────────────────────────────────────────────────────

-- Enum de unidades de medida para materiales
do $$ begin
  create type unidad_medida as enum (
    'm2', 'ml', 'unidad', 'kg', 'litro', 'bolsa', 'balde', 'rollo'
  );
exception
  when duplicate_object then null;
end $$;

-- ─── MATERIALES ──────────────────────────────────────────────────────────────

create table if not exists materiales (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  unidad unidad_medida not null default 'unidad',
  estado estado_item not null default 'activo',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists materiales_estado_idx on materiales (estado);
create index if not exists materiales_nombre_idx on materiales (nombre);
create index if not exists materiales_unidad_idx on materiales (unidad);

-- Historial de precios de materiales
-- Convención: precio vigente tiene fecha_hasta = null
create table if not exists materiales_precios (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references materiales(id) on delete cascade,
  precio numeric(14, 2) not null check (precio >= 0),
  fecha_desde timestamptz not null default now(),
  fecha_hasta timestamptz null,
  usuario_id uuid null references auth.users(id) on delete set null
);

create index if not exists materiales_precios_material_idx
  on materiales_precios (material_id);

-- Solo un precio vigente por material
create unique index if not exists materiales_precios_vigente_unico_idx
  on materiales_precios (material_id)
  where fecha_hasta is null;

-- Trigger para fecha_actualizacion en materiales
drop trigger if exists trg_materiales_set_fecha_actualizacion on materiales;
create trigger trg_materiales_set_fecha_actualizacion
  before update on materiales
  for each row execute function set_fecha_actualizacion();

-- ─── MANO DE OBRA ────────────────────────────────────────────────────────────

create table if not exists mano_obra_tipos (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null,
  estado estado_item not null default 'activo',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists mano_obra_tipos_estado_idx on mano_obra_tipos (estado);
create index if not exists mano_obra_tipos_tipo_idx on mano_obra_tipos (tipo);

-- Historial de costos diarios de mano de obra
create table if not exists mano_obra_costos (
  id uuid primary key default uuid_generate_v4(),
  tipo_id uuid not null references mano_obra_tipos(id) on delete cascade,
  costo_diario numeric(14, 2) not null check (costo_diario >= 0),
  fecha_desde timestamptz not null default now(),
  fecha_hasta timestamptz null,
  usuario_id uuid null references auth.users(id) on delete set null
);

create index if not exists mano_obra_costos_tipo_idx
  on mano_obra_costos (tipo_id);

-- Solo un costo vigente por tipo de empleado
create unique index if not exists mano_obra_costos_vigente_unico_idx
  on mano_obra_costos (tipo_id)
  where fecha_hasta is null;

-- Trigger para fecha_actualizacion en mano_obra_tipos
drop trigger if exists trg_mano_obra_set_fecha_actualizacion on mano_obra_tipos;
create trigger trg_mano_obra_set_fecha_actualizacion
  before update on mano_obra_tipos
  for each row execute function set_fecha_actualizacion();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

alter table materiales enable row level security;
alter table materiales_precios enable row level security;
alter table mano_obra_tipos enable row level security;
alter table mano_obra_costos enable row level security;

-- Materiales
drop policy if exists "Auth users read materiales" on materiales;
create policy "Auth users read materiales" on materiales
  for select to authenticated using (true);

drop policy if exists "Auth users insert materiales" on materiales;
create policy "Auth users insert materiales" on materiales
  for insert to authenticated with check (true);

drop policy if exists "Auth users update materiales" on materiales;
create policy "Auth users update materiales" on materiales
  for update to authenticated using (true) with check (true);

-- Materiales precios
drop policy if exists "Auth users read materiales_precios" on materiales_precios;
create policy "Auth users read materiales_precios" on materiales_precios
  for select to authenticated using (true);

drop policy if exists "Auth users insert materiales_precios" on materiales_precios;
create policy "Auth users insert materiales_precios" on materiales_precios
  for insert to authenticated with check (true);

drop policy if exists "Auth users update materiales_precios" on materiales_precios;
create policy "Auth users update materiales_precios" on materiales_precios
  for update to authenticated using (true) with check (true);

-- Mano de obra tipos
drop policy if exists "Auth users read mano_obra_tipos" on mano_obra_tipos;
create policy "Auth users read mano_obra_tipos" on mano_obra_tipos
  for select to authenticated using (true);

drop policy if exists "Auth users insert mano_obra_tipos" on mano_obra_tipos;
create policy "Auth users insert mano_obra_tipos" on mano_obra_tipos
  for insert to authenticated with check (true);

drop policy if exists "Auth users update mano_obra_tipos" on mano_obra_tipos;
create policy "Auth users update mano_obra_tipos" on mano_obra_tipos
  for update to authenticated using (true) with check (true);

-- Mano de obra costos
drop policy if exists "Auth users read mano_obra_costos" on mano_obra_costos;
create policy "Auth users read mano_obra_costos" on mano_obra_costos
  for select to authenticated using (true);

drop policy if exists "Auth users insert mano_obra_costos" on mano_obra_costos;
create policy "Auth users insert mano_obra_costos" on mano_obra_costos
  for insert to authenticated with check (true);

drop policy if exists "Auth users update mano_obra_costos" on mano_obra_costos;
create policy "Auth users update mano_obra_costos" on mano_obra_costos
  for update to authenticated using (true) with check (true);
