# LosLimonesApp

Sistema de gestión para **Limones - Rope Access** (trabajos en altura y fachadas).

## Stack

- **Frontend:** React 18 + Vite 5 + TypeScript + Tailwind CSS
- **Backend / DB:** Supabase (PostgreSQL + RLS + RPCs)
- **PDF:** @react-pdf/renderer
- **Data fetching:** @tanstack/react-query

## Infraestructura

| Servicio | Cuenta | Detalle |
|---|---|---|
| **Hosting** | Vercel | `eduardocanelo@gmail.com` — proyecto `los-limones-app` |
| **Dominio** | Donweb | `limonescreativos.com` → CNAME `cname.vercel-dns.com` |
| **Base de datos** | Supabase | Org `eduardocanelo+limones@rootsystems.com.ar`, región `sa-east-1` |
| **Repo** | GitHub | `eduardocanelo-rootsystems/LosLimonesApp` |

**URL producción:** https://www.limonescreativos.com

> **Importante:** En Vercel existen dos proyectos. El que sirve el dominio es **`los-limones-app`** (`prj_vInPJCKYCK6posw2LLW7S0VXcBLD`). El otro (`loslimones-app`) no tiene dominio y puede ignorarse.

## Desarrollo local

```bash
cd loslimones-app
npm install
npm run dev
```

Requiere archivo `.env.local` con:

```
VITE_SUPABASE_URL=https://ezysjzajhobkuzkvccsb.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deploy

### Normal (automático)

Cada `git push origin main` dispara un deploy automático en Vercel vía el proyecto `los-limones-app`.

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

### Emergencia (manual via CLI)

Si el auto-deploy falla o está bloqueado, deployar directamente desde la terminal:

```bash
cd loslimones-app
npx vercel --prod --yes --token "<token-vercel>" --project "prj_vInPJCKYCK6posw2LLW7S0VXcBLD"
```

El token se genera en Vercel → avatar → **Account Settings → Tokens → Create Token** (Full Account).

### Commits

Este proyecto usa **Conventional Commits**:

```
feat(area): descripción    # nueva funcionalidad
fix(area): descripción     # corrección de bug
docs: descripción          # documentación
refactor(area): descripción
```

## Módulos y funcionalidades

### Dashboard (`/`)
Indicadores del período seleccionable:
- **Ventas:** facturado, cobrado, pendiente de cobro, NC emitidas
- **Compras y resultado:** compras del negocio, facturado neto, capital configurable, utilidad neta
- **Presupuestos:** emitidos, aprobados, finalizados, sin facturar en el período
- **Relevamientos:** en curso (total activos), creados en el período, creados hoy
- **Rentabilidad:** presupuestado en servicios, cobros brutos, pool neto; distribución por socio
- **Tablas de seguimiento:** contratos pendientes de firma, presupuestos por vencer

### Presupuestos (`/presupuestos`)
- Creación y edición con secciones: cliente, edificación, servicios, mano de obra, importe
- **Servicios especiales** (`es_especial = true` en tabla `servicios`): panel dedicado con descripción específica, precio especial, referencia de materiales y opción "cliente provee materiales"
- Generación de PDF, envío por email con destinatario fijo (`luis.alfonzo@gmail.com`) + destinatarios adicionales ingresados por el usuario
- Contratos con firma digital (token único por presupuesto)
- Rentabilidad calculada automáticamente

### Relevamientos (`/relevamientos`)
Formulario de campo para relevadores (pre-visita), que al exportarse convierte el relevamiento en presupuesto `estado = 'emitido'`. Transfiere al presupuesto:
- Datos completos del cliente y administrador (con buscador/autocomplete desde historial)
- Características de la edificación: tipo de obra, zona de trabajo, trabajo en alturas, antigüedad, altura, m², tipología, condición estructural, protección contra incendios, etc.
- Servicios pre-seleccionados en campo (incluyendo servicios especiales)
- Diagnóstico técnico y alcance de obra (texto libre, base para el presupuestador)
- Fotos adjuntas

### Email (Edge Function `enviar-presupuesto`)
- Destinatario fijo siempre incluido: `luis.alfonzo@gmail.com`
- Destinatarios adicionales configurables por envío (acepta `emails: string[]` o `email: string` legado)
- PDF del presupuesto adjunto, vía Resend API

## Migraciones de base de datos

Las migraciones están en `supabase/migrations/`. Se aplican **manualmente** en orden numérico desde el SQL Editor del proyecto `loslimones-app` en Supabase (cuenta `eduardocanelo+limones@rootsystems.com.ar`).

| # | Descripción |
|---|---|
| 0001–0037 | Esquema base, presupuestos, servicios, contratos, cobros, movimientos, socios |
| 0038 | Campos `tipo`, `zona_trabajo`, `trabajo_en_alturas`, `diagnostico_tecnico`, `alcance_obra` en tabla `presupuestos`; campo `es_especial` en tabla `servicios` |
