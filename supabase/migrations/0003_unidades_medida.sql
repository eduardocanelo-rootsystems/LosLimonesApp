-- ────────────────────────────────────────────────────────────────────────────
-- Migración 0003: Tabla de unidades de medida configurables
-- ────────────────────────────────────────────────────────────────────────────

-- Crear tabla de unidades
create table if not exists unidades_medida (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  activo boolean not null default true,
  orden int not null default 0,
  fecha_creacion timestamptz not null default now(),
  constraint unidades_medida_nombre_unique unique (nombre)
);

-- Cargar las unidades por defecto
insert into unidades_medida (nombre, orden) values
  ('m²',     1),
  ('ml',      2),
  ('Unidad',  3),
  ('kg',      4),
  ('Litro',   5),
  ('Bolsa',   6),
  ('Balde',   7),
  ('Rollo',   8)
on conflict (nombre) do nothing;

-- Cambiar a text (drop default implícito vía CASCADE en el tipo)
alter table materiales alter column unidad drop default;
alter table materiales alter column unidad type text using unidad::text;
alter table materiales alter column unidad set default 'unidad';

-- Eliminar el enum con CASCADE para limpiar cualquier dependencia restante
drop type if exists unidad_medida cascade;

-- RLS
alter table unidades_medida enable row level security;

drop policy if exists "Auth users read unidades" on unidades_medida;
create policy "Auth users read unidades" on unidades_medida
  for select to authenticated using (true);

drop policy if exists "Auth users insert unidades" on unidades_medida;
create policy "Auth users insert unidades" on unidades_medida
  for insert to authenticated with check (true);

drop policy if exists "Auth users update unidades" on unidades_medida;
create policy "Auth users update unidades" on unidades_medida
  for update to authenticated using (true) with check (true);
