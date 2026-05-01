# Los Limones Creativos · Sistema de Gestión

> Web app de gestión integral para **Los Limones Creativos** — empresa de obras en fachadas de edificios en Buenos Aires.
>
> **Desarrollado por** /root · Eduardo Canelo

[![Status](https://img.shields.io/badge/status-fase%201-orange)]()
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Supabase%20%2B%20Vercel-blue)]()
[![License](https://img.shields.io/badge/license-private-red)]()

---

## 🎯 Estado actual

**Fase 1 — Fundación:** layout global con branding /root + sistema de auth + página **Servicios** funcionando 100%.

| # | Módulo | Estado |
|---|---|---|
| 1 | Presupuesto | 🔜 placeholder |
| 2 | **Servicios** | ✅ **completo** |
| 3 | Materiales | 🔜 placeholder |
| 4 | Mano de Obra | 🔜 placeholder |
| 5 | Contrato | 🔜 placeholder |
| 6 | Ventas | 🔜 placeholder |
| 7 | Compras | 🔜 placeholder |
| 8 | Dashboard | 🔜 placeholder |
| 9 | Movimientos | 🔜 placeholder |
| - | Configuración | 🔜 placeholder |

La página de **Servicios** valida el flujo end-to-end: ABM completo, búsqueda, sort por columnas, filtro por estado, historial de precios con snapshot, validación de inputs, manejo de errores y notificaciones toast.

---

## 🚀 Arrancar el proyecto

### 1. Requisitos

- **Node.js** ≥ 20.x
- **pnpm** (recomendado), npm o yarn

```bash
# Si no tenés pnpm
npm install -g pnpm
```

### 2. Instalar dependencias

```bash
cd loslimones-app
pnpm install
```

### 3. Configurar Supabase

Primero, copiá el archivo de variables de entorno:

```bash
cp .env.example .env.local
```

Después, abrí tu proyecto en [Supabase](https://app.supabase.com) → **Settings → API** y copiá:

- **Project URL** → pegá en `VITE_SUPABASE_URL`
- **anon public key** → pegá en `VITE_SUPABASE_ANON_KEY`

### 4. Aplicar la migración SQL

Tenés dos opciones:

**Opción A — Supabase CLI (recomendado):**

```bash
# Si no tenés Supabase CLI instalado:
npm install -g supabase

# Linkear tu proyecto
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Aplicar migración
supabase db push
```

**Opción B — copy/paste manual:**

1. Abrí Supabase Dashboard → **SQL Editor**.
2. Copiá el contenido de `supabase/migrations/0001_servicios.sql`.
3. Pegá y ejecutá.

### 5. Crear un usuario de prueba

En Supabase Dashboard → **Authentication → Users → Add user**:

- Email: el que vayas a usar
- Password: una contraseña segura
- Marcá **Auto Confirm User** para evitar el flujo de email.

### 6. Levantar el dev server

```bash
pnpm dev
```

Abrí `http://localhost:5173` y logueate con el usuario que creaste.

---

## 📁 Estructura del proyecto

```
loslimones-app/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/         # Header, Footer, AppLayout
│   │   ├── shared/         # PageHeader, EmptyState, RootLogo
│   │   └── ui/             # Modal y otros primitivos
│   ├── hooks/
│   │   └── useAuth.tsx     # Provider y hook de autenticación
│   ├── lib/
│   │   ├── supabase.ts     # Cliente Supabase tipado
│   │   └── utils.ts        # cn(), formatCurrency, formatDate
│   ├── pages/
│   │   ├── Auth/
│   │   │   └── LoginPage.tsx
│   │   ├── Servicios/
│   │   │   ├── ServiciosPage.tsx           # Página principal
│   │   │   ├── ServicioFormModal.tsx       # Modal crear/editar
│   │   │   ├── HistorialPreciosModal.tsx   # Modal de historial
│   │   │   └── useServicios.ts             # Queries y mutations
│   │   ├── ...                             # otras 8 páginas (placeholder)
│   │   └── placeholders.tsx
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   └── router.tsx
│   ├── types/
│   │   └── database.ts     # Tipos del schema Supabase
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── supabase/
│   └── migrations/
│       └── 0001_servicios.sql
├── docs/
│   └── ESPECIFICACION_FUNCIONAL.md
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 🛠 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS (paleta /root custom) |
| Routing | React Router v6 |
| Data fetching | TanStack Query |
| Backend | Supabase (Postgres + Auth + RLS) |
| Notificaciones | Sonner (toasts) |
| Iconos | Lucide React |
| Tipografía | **Jost** (Google Fonts) |
| Deploy | Vercel |

---

## 🎨 Sistema de diseño

### Paleta

- **Fondo principal**: `ink-950` (#0e1014) — oscuro profundo
- **Cards**: `ink-900` (#13161a) — un escalón más claro
- **Borders**: `ink-800` (#1a1d21)
- **Texto principal**: `ink-100` (#e8eaee)
- **Texto secundario**: `ink-400` (#6b7281)
- **Acento**: `accent-500` (#00e5ff) — cyan /root

### Tipografía

- **Sans (UI)**: Jost · pesos 100–900
- **Mono (datos numéricos)**: ui-monospace, SF Mono, Consolas

### Componentes base

Definidos como `@layer components` en `index.css`:

- `.card` — contenedor con bordes y blur
- `.btn-primary` / `.btn-secondary` / `.btn-ghost`
- `.input-base`
- `.badge` + variantes `success`, `warning`, `danger`, `muted`

### Animaciones

- `animate-fade-in`
- `animate-slide-up`
- `animate-scale-in`

---

## 🏗 Decisiones de arquitectura

### Snapshot de precios

El módulo de Servicios usa **historial de precios con vigencia**: cuando se cambia el precio de un servicio, no se sobrescribe — se cierra el precio vigente (`fecha_hasta = now()`) y se inserta uno nuevo. Esto garantiza que los presupuestos antiguos mantengan el precio congelado del momento en que se cargaron.

Implementación:
- Tabla `servicios` (datos maestros).
- Tabla `servicios_precios` (historial con `fecha_desde` y `fecha_hasta`).
- **Constraint único**: solo un precio vigente (`fecha_hasta IS NULL`) por servicio.

Ver `supabase/migrations/0001_servicios.sql` y `src/pages/Servicios/useServicios.ts`.

### Row Level Security (RLS)

Por ahora, cualquier usuario autenticado puede leer/escribir todas las tablas. Cuando definamos los 3 roles (Admin / Operario / Contable), refinaremos las políticas.

### Auth

Sesión persistente en `localStorage` (default de Supabase). El `AuthProvider` escucha cambios y los propaga al árbol. `ProtectedRoute` redirige a `/login` si no hay sesión.

---

## 📜 Comandos disponibles

```bash
pnpm dev               # Dev server en http://localhost:5173
pnpm build             # Build de producción
pnpm preview           # Preview del build
pnpm lint              # ESLint
pnpm lint:fix          # ESLint con auto-fix
pnpm format            # Prettier
pnpm type-check        # TypeScript check
pnpm db:push           # Aplicar migraciones (requiere Supabase CLI)
pnpm db:types          # Generar tipos desde el schema
```

---

## 🗺 Próximos pasos

Según el roadmap del proyecto:

1. **Materiales** — ABM con unidades de medida e historial de precios (similar a Servicios).
2. **Mano de Obra** — ABM de tipos de empleados con costo diario.
3. **Configuración global** — IVA configurable, datos fiscales.
4. **Presupuesto** — formulario completo con todas las secciones, cálculos cliente/interno, estados.
5. **Contrato + Firma digital** — upload PDF, concatenación, firma con `signature_pad`, hash + auditoría.
6. **Movimientos** — cuentas, categorías, ABM con cálculo de saldos.
7. **Integración ARCA** — Edge Functions con `wsfev1`, Vault para certificados, vistas de Ventas y Compras.
8. **Dashboard** — pulso, salud financiera, rentabilidad por obra.

---

## 📚 Documentación adicional

- **Especificación funcional completa** → [`docs/ESPECIFICACION_FUNCIONAL.md`](./docs/ESPECIFICACION_FUNCIONAL.md)

---

## 📄 Licencia

Software privado. Todos los derechos reservados © Los Limones Creativos · /root · 2026.

---

<sub>Hecho con ☕ y pensamiento sistémico por /root</sub>
