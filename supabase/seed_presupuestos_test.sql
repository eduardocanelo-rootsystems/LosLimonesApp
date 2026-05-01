-- ────────────────────────────────────────────────────────────────────────────
-- Datos de prueba: 3 presupuestos ficticios
-- Pegar y ejecutar en el SQL Editor de Supabase
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  p1_id uuid;
  p2_id uuid;
  p3_id uuid;
BEGIN

-- ─── PRESUPUESTO 1: Torre Belgrano · Emitido ─────────────────────────────────
INSERT INTO presupuestos (
  numero, estado,
  cliente_razon_social, cliente_telefono, cliente_direccion,
  cliente_administrador, cliente_email,
  edif_anios, edif_altura, edif_m2,
  edif_color, edif_acabado, edif_condicion_estructural,
  edif_tipologia, edif_clase_incendio, coef_k,
  iva_pct, observaciones
) VALUES (
  next_presupuesto_numero(), 'emitido',
  'Consorcio Torre Belgrano', '+54 11 4345-7890', 'Av. Cabildo 1234, CABA',
  'María González', 'administracion@torrebelgrano.com.ar',
  28, 32.5, 1450,
  'Blanco hueso', '["revocar","pintura"]'::jsonb, 'buena',
  'residencial', 'A', 1.2,
  21, 'Edificio en buen estado general. Requiere limpieza de juntas en fachada norte y reposición de sellador en balcones del piso 8.'
) RETURNING id INTO p1_id;

INSERT INTO presupuesto_servicios (presupuesto_id, servicio_id, nombre_snapshot, precio_m2_snapshot, m2_snapshot, k_snapshot, subtotal) VALUES
  (p1_id, NULL, 'Limpieza de fachada con agua a presión', 1800, 1450, 1.2, 3132000),
  (p1_id, NULL, 'Reparación de grietas y fisuras', 2400, 1450, 1.2, 4176000);

INSERT INTO presupuesto_materiales (presupuesto_id, material_id, nombre_snapshot, unidad_snapshot, precio_snapshot, cantidad, subtotal) VALUES
  (p1_id, NULL, 'Pintura látex exterior premium', 'Litro', 4200, 180, 756000),
  (p1_id, NULL, 'Sellador poliuretánico para juntas', 'Litro', 6800, 24, 163200),
  (p1_id, NULL, 'Membrana asfáltica autoadhesiva', 'm²', 3900, 35, 136500);

-- ─── PRESUPUESTO 2: Edificio Palermo Chico · Aprobado ────────────────────────
INSERT INTO presupuestos (
  numero, estado,
  cliente_razon_social, cliente_telefono, cliente_direccion,
  cliente_administrador, cliente_email,
  edif_anios, edif_altura, edif_m2,
  edif_color, edif_acabado, edif_condicion_estructural,
  edif_tipologia, edif_clase_incendio, coef_k,
  iva_pct, observaciones,
  descuento_tipo, descuento_valor,
  fecha_aprobacion
) VALUES (
  next_presupuesto_numero(), 'aprobado',
  'Palermo Chico S.A.', '+54 11 5234-9912', 'Av. del Libertador 3500, CABA',
  'Carlos Etcheverría', 'admin@palermochico.com.ar',
  15, 48, 2800,
  'Gris perla', '["revestimiento","pintura"]'::jsonb, 'muy buena',
  'corporativo', 'B', 1.4,
  21, 'Fachada con revestimiento de piedra reconstituida en planta baja. El cliente solicita trabajo en horario restringido (9-17hs). Acceso por calle lateral.',
  'porcentaje', 5,
  now() - interval '3 days'
) RETURNING id INTO p2_id;

INSERT INTO presupuesto_servicios (presupuesto_id, servicio_id, nombre_snapshot, precio_m2_snapshot, m2_snapshot, k_snapshot, subtotal) VALUES
  (p2_id, NULL, 'Limpieza de fachada con agua a presión', 1800, 2800, 1.4, 7056000),
  (p2_id, NULL, 'Hidrolavado y desengrase profesional', 1200, 2800, 1.4, 4704000),
  (p2_id, NULL, 'Aplicación de pintura con hidrofugante', 3100, 2800, 1.4, 12152000);

INSERT INTO presupuesto_materiales (presupuesto_id, material_id, nombre_snapshot, unidad_snapshot, precio_snapshot, cantidad, subtotal) VALUES
  (p2_id, NULL, 'Pintura látex exterior premium', 'Litro', 4200, 340, 1428000),
  (p2_id, NULL, 'Hidrofugante concentrado', 'Litro', 8900, 60, 534000);

-- ─── PRESUPUESTO 3: Consorcio San Telmo · Finalizado ─────────────────────────
INSERT INTO presupuestos (
  numero, estado,
  cliente_razon_social, cliente_telefono, cliente_direccion,
  cliente_administrador, cliente_email,
  edif_anios, edif_altura, edif_m2,
  edif_color, edif_acabado, edif_condicion_estructural,
  edif_tipologia, edif_clase_incendio, coef_k,
  iva_pct, observaciones,
  descuento_tipo, descuento_valor,
  edif_valor_patrimonial, edif_proteccion
) VALUES (
  next_presupuesto_numero(), 'finalizado',
  'Consorcio Balcarce 460', '+54 11 4300-1122', 'Balcarce 460, San Telmo, CABA',
  'Roberto Villanueva', 'rvillanueva@balcarce460.com.ar',
  92, 18, 720,
  'Ocre colonial', '["revocar","pintura","molduras"]'::jsonb, 'regular',
  'residencial', 'A', 1.6,
  21, 'Edificio catalogado de valor patrimonial. Requiere coordinación con Ministerio de Cultura para aprobación de materiales. Trabajo de molduras con mano especializada.',
  'fijo', 150000,
  true, 'Nivel 2 — Protección estructural y elementos decorativos'
) RETURNING id INTO p3_id;

INSERT INTO presupuesto_servicios (presupuesto_id, servicio_id, nombre_snapshot, precio_m2_snapshot, m2_snapshot, k_snapshot, subtotal) VALUES
  (p3_id, NULL, 'Restauración y reparación de revoques', 4200, 720, 1.6, 4838400),
  (p3_id, NULL, 'Limpieza de molduras y ornamentos', 3800, 720, 1.6, 4377600),
  (p3_id, NULL, 'Aplicación de pintura mineral transpirable', 2900, 720, 1.6, 3340800);

INSERT INTO presupuesto_materiales (presupuesto_id, material_id, nombre_snapshot, unidad_snapshot, precio_snapshot, cantidad, subtotal) VALUES
  (p3_id, NULL, 'Cal hidratada especial para restauración', 'Bolsa', 2800, 45, 126000),
  (p3_id, NULL, 'Pintura mineral silicatada', 'Litro', 9600, 85, 816000),
  (p3_id, NULL, 'Adhesivo para molduras de yeso', 'kg', 3200, 20, 64000);

END $$;
