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
| **Hosting** | Vercel | `eduardocanelo@gmail.com` — auto-deploy desde `main` |
| **Dominio** | Donweb | `limonescreativos.com` → CNAME `cname.vercel-dns.com` |
| **Base de datos** | Supabase | Org `eduardocanelo+limones@rootsystems.com.ar`, región `sa-east-1` |
| **Repo** | GitHub | `eduardocanelo-rootsystems/LosLimonesApp` |

**URL producción:** https://www.limonescreativos.com

## Desarrollo local

```bash
cd loslimones-app
npm install
npm run dev
```

Requiere archivo `loslimones-app/.env.local` con:

```
VITE_SUPABASE_URL=https://ezysjzajhobkuzkvccsb.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Deploy

Cada push a `main` dispara un deploy automático en Vercel.
Migraciones de DB se aplican manualmente desde el SQL Editor de Supabase.

## Migraciones

Las migraciones están en `supabase/migrations/`. Se aplican en orden numérico desde el SQL Editor del proyecto `loslimones-app` en Supabase.
