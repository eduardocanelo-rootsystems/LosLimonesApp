-- ────────────────────────────────────────────────────────────────────────────
-- Migración 0001: Servicios + historial de precios
-- ────────────────────────────────────────────────────────────────────────────

-- Extensiones útiles
create extension if not exists "uuid-ossp";

-- Enum de estado genérico
do $$ begin
  create type estado_item as enum ('activo', 'inactivo');
exception
  when duplicate_object then null;
end $$;

-- Tabla servicios
create table if not exists servicios (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  estado estado_item not null default 'activo',
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create index if not exists servicios_estado_idx on servicios (estado);
create index if not exists servicios_nombre_idx on servicios (nombre);

-- Tabla de precios de servicios (historial)
-- Convención: el precio vigente es el que tiene fecha_hasta = null
create table if not exists servicios_precios (
  id uuid primary key default uuid_generate_v4(),
  servicio_id uuid not null references servicios(id) on delete cascade,
  precio_m2 numeric(14, 2) not null check (precio_m2 >= 0),
  fecha_desde timestamptz not null default now(),
  fecha_hasta timestamptz null,
  usuario_id uuid null references auth.users(id) on delete set null
);

create index if not exists servicios_precios_servicio_idx
  on servicios_precios (servicio_id);

-- Solo un precio vigente por servicio (fecha_hasta IS NULL)
create unique index if not exists servicios_precios_vigente_unico_idx
  on servicios_precios (servicio_id)
  where fecha_hasta is null;

-- Trigger para mantener fecha_actualizacion en servicios
create or replace function set_fecha_actualizacion()
returns trigger as $$
begin
  new.fecha_actualizacion = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_servicios_set_fecha_actualizacion on servicios;
create trigger trg_servicios_set_fecha_actualizacion
  before update on servicios
  for each row execute function set_fecha_actualizacion();

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

alter table servicios enable row level security;
alter table servicios_precios enable row level security;

-- Por ahora: cualquier usuario autenticado puede leer y escribir.
-- Cuando definamos roles más adelante, refinamos con usuarios_roles.

drop policy if exists "Auth users read servicios" on servicios;
create policy "Auth users read servicios" on servicios
  for select to authenticated using (true);

drop policy if exists "Auth users insert servicios" on servicios;
create policy "Auth users insert servicios" on servicios
  for insert to authenticated with check (true);

drop policy if exists "Auth users update servicios" on servicios;
create policy "Auth users update servicios" on servicios
  for update to authenticated using (true) with check (true);

drop policy if exists "Auth users read precios" on servicios_precios;
create policy "Auth users read precios" on servicios_precios
  for select to authenticated using (true);

drop policy if exists "Auth users insert precios" on servicios_precios;
create policy "Auth users insert precios" on servicios_precios
  for insert to authenticated with check (true);

drop policy if exists "Auth users update precios" on servicios_precios;
create policy "Auth users update precios" on servicios_precios
  for update to authenticated using (true) with check (true);
