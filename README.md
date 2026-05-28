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

## Migraciones de base de datos

Las migraciones están en `supabase/migrations/`. Se aplican **manualmente** en orden numérico desde el SQL Editor del proyecto `loslimones-app` en Supabase (cuenta `eduardocanelo+limones@rootsystems.com.ar`).
