# Los Limones Creativos · Sistema de Gestión

> Web app de gestión integral para **Los Limones Creativos** — empresa de trabajos en altura y fachadas de edificios en Buenos Aires.
>
> **Desarrollado por** /root · Eduardo Canelo

[![Status](https://img.shields.io/badge/status-producción-green)]()
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase%20%2B%20Vercel-blue)]()
[![License](https://img.shields.io/badge/license-private-red)]()

---

## Estado actual del proyecto

El sistema está **en producción y uso activo**. Todos los módulos principales están implementados y funcionando.

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Dashboard** | ✅ completo | KPIs financieros, rentabilidad por cobros, distribución MO, socios |
| **Presupuestos** | ✅ completo | ABM completo, PDF, contrato, cobros por cuotas |
| **Clientes** | ✅ completo | Vista agregada de clientes derivada de presupuestos, exporta PDF/Excel |
| **Relevamientos** | ✅ completo | Registro de relevamientos de obra con fotos y observaciones |
| **Servicios** | ✅ completo | ABM con historial de precios snapshot |
| **Materiales** | ✅ completo | ABM, rendimientos históricos editables |
| **Mano de Obra** | ✅ completo | ABM con historial de costos, rendimientos por obra |
| **Ventas** | ✅ completo | Integración ARCA (AFIP), facturas emitidas, NC |
| **Compras** | ✅ completo | Integración ARCA, compras recibidas, NC proveedores |
| **Movimientos** | ✅ completo | Ingresos, egresos y retiros de socios por período |
| **Contratos** | ✅ completo | Generación de contrato PDF, firma digital cliente/contratista |
| **Configuración** | ✅ completo | Usuarios, roles, datos fiscales, firma del contratista |

---

## Arrancar el proyecto

### Requisitos

- **Node.js** ≥ 20.x
- **npm** (o pnpm/yarn)

### Instalar y configurar

```bash
cd loslimones-app
npm install
```

Crear el archivo de variables de entorno:

```bash
cp .env.example .env.local
```

En [Supabase](https://app.supabase.com) → **Settings → API**, copiar:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public key** → `VITE_SUPABASE_ANON_KEY`

### Aplicar migraciones SQL

```bash
# Con Supabase CLI:
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

O copiar cada archivo de `supabase/migrations/` manualmente en el SQL Editor de Supabase.

Las migraciones van del `0001` al `0021`. Deben aplicarse en orden.

### Levantar el dev server

```bash
npm run dev
# → http://localhost:5173
```

---

## Arquitectura general

### Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS (paleta dark custom) |
| Routing | React Router v6 |
| Estado del servidor | TanStack Query v5 |
| Backend / DB | Supabase (Postgres + Auth + RLS + Edge Functions) |
| PDF | @react-pdf/renderer |
| Notificaciones | Sonner |
| Iconos | Lucide React |
| Deploy | Vercel |

### Estructura de carpetas relevante

```
src/
├── components/
│   ├── layout/         # Header (nav + auth), AppLayout
│   ├── shared/         # PageHeader, EmptyState, PeriodoSelector, SortTh, SignatureCanvas
│   └── ui/             # Modal y primitivos
├── hooks/
│   ├── useAuth.tsx         # Auth provider + hook
│   ├── useUsuarios.ts      # Roles: superadmin | admin | socio | empleado
│   ├── useSocios.ts        # Socios y sus porcentajes de pool
│   ├── useCobros.ts        # Cobros de cuotas de presupuestos
│   ├── useMovimientos.ts   # Movimientos + stats de MO + rentabilidad
│   └── useConfiguracion.ts # Firma contratista, ajustes globales
├── pages/
│   ├── Dashboard/          # KPIs financieros + rentabilidad
│   ├── Presupuestos/       # ABM presupuestos + form completo + PDF + cobros
│   ├── Contratos/          # Formulario de contrato + firma digital
│   ├── Firmar/             # Página pública de firma del cliente (sin auth)
│   ├── Servicios/          # ABM servicios con historial de precios
│   ├── Materiales/         # ABM materiales + rendimientos históricos
│   ├── ManoDeObra/         # ABM tipos + costos + rendimientos históricos
│   ├── Ventas/             # Facturas emitidas (ARCA)
│   ├── Compras/            # Facturas recibidas (ARCA)
│   ├── Movimientos/        # Ingresos / egresos / retiros de socios
│   ├── Settings/           # Configuración de usuarios y empresa
│   └── Auth/               # Login + Registro
├── routes/
│   ├── router.tsx          # createBrowserRouter con todas las rutas
│   ├── ProtectedRoute.tsx  # Redirige a /login si no hay sesión
│   └── RequiereRol.tsx     # Controla acceso por rol
├── lib/
│   ├── supabase.ts         # Cliente Supabase tipado
│   ├── arcaParser.ts       # Parser de XMLs de ARCA (AFIP)
│   ├── chunkReload.ts      # Detecta chunks obsoletos post-deploy y recarga la página
│   └── utils.ts            # cn(), formatCurrency, formatDate, diasHastaVencimiento
└── types/
    └── database.ts         # Tipos generados del schema Supabase + tipos de formulario
```

---

## Módulos en detalle

### Dashboard (`/`)

Acceso: roles financiero (superadmin, admin, socio).

Secciones:
- **Ventas**: facturado, cobrado, pendiente de cobro, NC emitidas — del período seleccionado
- **Compras y resultado**: compras del negocio, facturado neto, capital (% configurable), utilidad neta
- **Presupuestos**: emitidos, aprobados, finalizados, sin facturar en el período
- **Contratos pendientes de firma**: tabla de presupuestos cuyo contrato todavía no fue firmado por el cliente
- **Presupuestos por vencer**: presupuestos en estado "emitido" ordenados por días hasta vencimiento (30 días)
- **Rentabilidad (presupuestos cobrados)**: KPIs de presupuestado vs cobrado + pool neto de servicios
- **Mano de obra — distribución por tipo**: barras de costo MO por tipo, % sobre total presupuestado
- **Distribución por socio**: cada socio activo con su % de pool bruto, retiros y neto del período
- **Exportar PDF**: resumen para contador con toda la información del período

**Lógica de pool:**
El pool a distribuir entre socios se calcula a partir de los **cobros de cuotas de presupuestos** (`presupuesto_cobros`) del período, no de los presupuestos aprobados. Solo cuenta la porción de servicios de cada cobro: `cobro.monto × (importe_servicios / importe_total)`. Se le suman ingresos extra y se restan egresos generales del módulo Movimientos.

**Lógica de NC (notas de crédito):**
Las facturas anuladas (marcadas `anulada=true` por asociación con una NC) se incluyen en `totalFacturado` para evitar doble deducción. Las NC se deducen por separado. Lo mismo aplica para compras.

**Capital:**
Un card editable muestra el porcentaje del resultado que va a "capital" (reserva). Persiste en `localStorage`.

### Presupuestos (`/presupuestos`)

Acceso: todos los roles.

Flujo completo de un presupuesto:
1. **Crear** → estado `emitido` → el sistema asigna un número correlativo via RPC `next_presupuesto_numero`
2. **Editar** → secciones: cliente, edificación, servicios, materiales, mano de obra, plan de financiamiento, descuento, IVA, fotos, observaciones
3. **Aprobar** → estado `aprobado` → activa la sección de Cobros
4. **Cobros** (`SeccionCobros`): registra cada cuota del plan (anticipo + 1 o 2 cuotas según el plan). Cada cobro se guarda en `presupuesto_cobros` con upsert por `(presupuesto_id, numero_cuota)`.
5. **Finalizar** → estado `finalizado`
6. **Facturar** → se asocia una factura de ARCA al presupuesto
7. **Generar PDF** del presupuesto detallado
8. **Generar contrato** → navega a `/presupuestos/:id/contrato`

**Importes snapshot:**
Al guardar un presupuesto, se calculan y persisten `importe_servicios` e `importe_total` (con recargo de financiamiento incluido). Estos valores son la base para el cálculo del pool de rentabilidad.

**Planes de financiamiento:**
- `contado`: 2 cuotas (anticipo 50% + saldo 50%), sin recargo
- `60dias`: 3 cuotas (anticipo 50% + 2 × 25%), recargo 10%
- `90dias`: 3 cuotas (anticipo 50% + 2 × ~42.5%), recargo 35%
- Anticipo = `(importe_total / (1 + recargo)) × 0.5`

### Contratos (`/presupuestos/:id/contrato`)

Genera un contrato de Locación de Obra con:
- Datos del comitente, administrador, dirección de obra
- Plan de financiamiento (calculado desde el presupuesto)
- Plazos (inicio, fin calculado por días hábiles, multa por demora)
- Firma digital del contratista (guardada globalmente en `configuracion`)
- Firma digital del cliente (vía link con token único, página pública `/firmar/:token`)

La firma se puede dibujar en canvas o subir como imagen (JPG/PNG). El contrato exporta a PDF con ambas firmas embebidas.

### Ventas y Compras

Integración con **ARCA (ex-AFIP)**:
- El usuario pega el XML de respuesta de AFIP
- `arcaParser.ts` extrae tipo de comprobante, CUIT, importes, fecha
- Se guarda en Supabase con marca de cuál es NC y si está anulada
- Las facturas se pueden marcar como cobradas con fecha
- Las NCs se pueden asociar a una factura (la marca como `anulada = true`)

### Servicios, Materiales y Mano de Obra

Tres catálogos con **historial de precios/costos**:
- `servicios_precios`: precio por m² vigente (fecha_hasta IS NULL = precio activo)
- `materiales` con campo `rendimiento_m2` (cantidad de material por m² de fachada)
- `mano_obra_costos`: costo diario del empleado vigente (fecha_hasta IS NULL = activo)

Cada catálogo tiene una página de **Rendimientos** (`/materiales/rendimientos` y `/mano-de-obra/rendimientos`) que analiza los presupuestos aprobados/finalizados para calcular estadísticas históricas por ítem:
- **Materiales**: cantidad usada / m² → compara con el rendimiento base del catálogo, permite actualizarlo
- **Mano de obra**: costo laboral / m² → compara el costo_diario del snapshot vs el vigente del catálogo, permite actualizar

### Movimientos (`/movimientos`)

Registro de movimientos de caja del negocio:
- `ingreso`: dinero extra que suma al pool (ej. trabajos al contado no presupuestados)
- `egreso`: gasto general que resta del pool (ej. herramientas, equipos)
- `retiro`: retiro de un socio específico (se resta del neto individual de ese socio)

Todos los movimientos se filtran por período. Los retiros aparecen descontados en la tabla "Distribución por socio" del Dashboard.

---

## Sistema de roles

| Rol | Acceso |
|-----|--------|
| `superadmin` | Todo |
| `admin` | Todo excepto crear superadmins |
| `socio` | Dashboard, Presupuestos, Ventas, Compras, Movimientos |
| `empleado` | Presupuestos, Servicios, Materiales, Mano de Obra |

Los roles se definen en la tabla `usuarios` de Supabase y se leen en `useAuth`. La asignación de rol se hace desde Settings (solo superadmin/admin).

---

## Base de datos — tablas principales

```
presupuestos              — cabecera del presupuesto (estado, cliente, importes snapshot)
presupuesto_servicios     — ítems de servicios del presupuesto (con snapshots de precio)
presupuesto_materiales    — ítems de materiales del presupuesto (con snapshots)
presupuesto_mano_obra     — ítems de MO del presupuesto (con snapshot de costo_diario)
presupuesto_fotos         — fotos adjuntas al presupuesto
presupuesto_cobros        — cobros de cuotas registrados (unique: presupuesto_id, numero_cuota)
contratos                 — contrato asociado al presupuesto, firmas y token
servicios                 — catálogo de servicios
servicios_precios         — historial de precios por servicio
materiales                — catálogo de materiales (incluye rendimiento_m2)
mano_obra_tipos           — tipos de empleados
mano_obra_costos          — historial de costo diario por tipo
facturas_emitidas         — ventas registradas desde ARCA
facturas_recibidas        — compras registradas desde ARCA
movimientos               — ingresos / egresos / retiros
socios                    — socios activos con % de participación
usuarios                  — usuarios del sistema con rol
configuracion             — ajustes globales (firma contratista, datos fiscales)
unidades_medida           — unidades para materiales
```

Todas las tablas tienen **Row Level Security (RLS)** activo. La política actual permite lectura/escritura a cualquier usuario autenticado. Para endurecer permisos por rol, editar las policies en Supabase.

---

## Decisiones de arquitectura

### Snapshots de precios en presupuestos
Los ítems de presupuesto guardan `*_snapshot` de nombre, precio, etc. al momento de guardar. Esto garantiza que editar el catálogo no altera presupuestos históricos.

### Pool de rentabilidad basado en cobros
El pool a repartir entre socios usa **cobros efectivos** de cuotas, no el total presupuestado. Solo la porción de servicios cuenta como ganancia (materiales son pass-through). Ver `useManoObraStats` y `useCobrosPeriodo` en `src/hooks/`.

### Doble deducción de NC
Las facturas anuladas (por asociación con NC) siguen sumando en `totalFacturado`; las NC se deducen una sola vez. Sin este manejo, la misma venta quedaría neutralizada dos veces.

### Firma digital
`SignatureCanvas` permite dibujar o subir imagen (JPG/PNG). La firma se serializa como base64 PNG y se guarda en Supabase. La firma del contratista se guarda globalmente en `configuracion`; la del cliente se guarda por contrato tras validar el token de un solo uso.

### Tipos de Supabase
El archivo `src/types/database.ts` contiene los tipos generados. Cuando se agregan tablas nuevas (ej. `presupuesto_cobros`, `presupuesto_fotos`) hay que regenerar con `npm run db:types` o actualizar manualmente. Mientras tanto, se usa `supabase as any` en los hooks afectados.

---

## Comandos disponibles

```bash
npm run dev          # Dev server → http://localhost:5173
npm run build        # Build de producción
npm run preview      # Preview del build
npm run test         # Vitest (solo src/__tests__, excluye e2e)
npm run lint         # ESLint
npm run type-check   # TypeScript check sin emitir
npm run db:push      # Aplicar migraciones (requiere Supabase CLI)
npm run db:types     # Generar tipos desde el schema de Supabase
```

---

## Sistema de diseño

**Paleta (dark-first):**
- Fondo: `ink-950` (#0e1014)
- Cards: `ink-900` (#13161a)
- Borders: `ink-800` (#1a1d21) / `ink-700`
- Texto principal: `ink-100` (#e8eaee)
- Texto secundario: `ink-300` (#9ba1ad) / `ink-400` (#6b7281)
- Acento: `accent-500` (#B7FF00) — lima neon (botones primarios, foco, highlights)
- Cyan /root: `sys-500` (#00e5ff) — solo en el bloque `/root` del header
- Estados: `success` (#10b981), `warning` (#f59e0b), `danger` (#ef4444)

**Tipografía:** Jost (UI) + ui-monospace (datos numéricos)

**Componentes base** (en `index.css` como `@layer components`):
`.card`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input-base`, `.badge` + variantes

---

## Convenciones de desarrollo

### Commits — Conventional Commits

Todos los commits deben seguir el formato **Conventional Commits** (validado por commitlint + husky en el hook `commit-msg`):

```
tipo(scope opcional): descripción en minúsculas
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

```bash
feat: agregar módulo de relevamientos
fix(pdf): recargar página al detectar chunk obsoleto tras deploy
perf: diferir vendor-pdf a imports dinámicos
chore: actualizar dependencias
```

El hook `pre-commit` corre `npm test` antes de cada commit. Si los tests fallan, el commit se rechaza.

### Deploy

El proyecto se despliega automáticamente en **Vercel** al hacer push a `main`. Las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) están configuradas en el dashboard de Vercel.

**Chunks obsoletos post-deploy:** Vite genera nombres con hash de contenido. Si un usuario tiene la app abierta durante un deploy, los links a chunks viejos fallan con MIME-type error. `src/lib/chunkReload.ts` detecta este caso y recarga la página automáticamente.

---

## Licencia

Software privado. Todos los derechos reservados © Los Limones Creativos · /root · 2026.

---

<sub>Hecho con ☕ y pensamiento sistémico por /root</sub>
