import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequiereRol } from './RequiereRol'
import { isStaleChunkError } from '@/lib/chunkReload'

// Eager — pequeños, necesarios en el primer render
import LoginPage    from '@/pages/Auth/LoginPage'
import RegistroPage from '@/pages/Auth/RegistroPage'
import FirmarContratoPage from '@/pages/Firmar/FirmarContratoPage'

// Cuando un chunk no se encuentra (deploy nuevo mientras el usuario tenía la app abierta),
// recargamos la página para que cargue el index.html actualizado.
const CHUNK_RELOAD_KEY = 'chunk_reloads'

function lazyWithReload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err: unknown) => {
      if (isStaleChunkError(err)) {
        // Evita bucle infinito en Android con red inestable: máximo 2 recargas
        const count = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0)
        if (count < 2) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(count + 1))
          window.location.reload()
          return new Promise<never>(() => {})
        }
        sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      }
      throw err
    })
  )
}

// Lazy — se cargan solo cuando el usuario navega a esa ruta
const DashboardPage           = lazyWithReload(() => import('@/pages/Dashboard/DashboardPage'))
const PresupuestosPage        = lazyWithReload(() => import('@/pages/Presupuestos/PresupuestosPage'))
const PresupuestoFormPage     = lazyWithReload(() => import('@/pages/Presupuestos/PresupuestoFormPage'))
const ContratoFormPage        = lazyWithReload(() => import('@/pages/Contratos/ContratoFormPage'))
const ClientesPage            = lazyWithReload(() => import('@/pages/Clientes/ClientesPage'))
const ServiciosPage           = lazyWithReload(() => import('@/pages/Servicios/ServiciosPage'))
const MaterialesPage          = lazyWithReload(() => import('@/pages/Materiales/MaterialesPage'))
const RendimientosPage        = lazyWithReload(() => import('@/pages/Materiales/RendimientosPage'))
const ManoDeObraPage          = lazyWithReload(() => import('@/pages/ManoDeObra/ManoDeObraPage'))
const RendimientosManoObraPage = lazyWithReload(() => import('@/pages/ManoDeObra/RendimientosManoObraPage'))
const VentasPage              = lazyWithReload(() => import('@/pages/Ventas/VentasPage'))
const ComprasPage             = lazyWithReload(() => import('@/pages/Compras/ComprasPage'))
const MovimientosPage         = lazyWithReload(() => import('@/pages/Movimientos/MovimientosPage'))
const RelevamientosPage       = lazyWithReload(() => import('@/pages/Relevamientos/RelevamientosPage'))
const RelevamientoFormPage    = lazyWithReload(() => import('@/pages/Relevamientos/RelevamientoFormPage'))
const SettingsPage            = lazyWithReload(() => import('@/pages/Settings/SettingsPage'))

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-700 border-t-accent-400" />
    </div>
  )
}

const FINANCIERO  = ['superadmin', 'admin', 'socio']  as const
const OPERATIVO   = ['superadmin', 'admin', 'empleado'] as const
const TODOS       = ['superadmin', 'admin', 'socio', 'empleado'] as const
const SOLO_ADMIN  = ['superadmin', 'admin'] as const

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/registro',
    element: <RegistroPage />,
  },
  {
    path: '/firmar/:token',
    element: <FirmarContratoPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <RequiereRol roles={[...FINANCIERO]}><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></RequiereRol>,
      },
      {
        path: 'presupuestos',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><PresupuestosPage /></Suspense></RequiereRol>,
      },
      {
        path: 'clientes',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><ClientesPage /></Suspense></RequiereRol>,
      },
      {
        path: 'presupuestos/nuevo',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><PresupuestoFormPage /></Suspense></RequiereRol>,
      },
      {
        path: 'presupuestos/:id',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><PresupuestoFormPage /></Suspense></RequiereRol>,
      },
      {
        path: 'presupuestos/:id/contrato',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><ContratoFormPage /></Suspense></RequiereRol>,
      },
      {
        path: 'servicios',
        element: <RequiereRol roles={[...OPERATIVO]}><Suspense fallback={<PageLoader />}><ServiciosPage /></Suspense></RequiereRol>,
      },
      {
        path: 'materiales',
        element: <RequiereRol roles={[...OPERATIVO]}><Suspense fallback={<PageLoader />}><MaterialesPage /></Suspense></RequiereRol>,
      },
      {
        path: 'materiales/rendimientos',
        element: <RequiereRol roles={[...OPERATIVO]}><Suspense fallback={<PageLoader />}><RendimientosPage /></Suspense></RequiereRol>,
      },
      {
        path: 'mano-de-obra',
        element: <RequiereRol roles={[...OPERATIVO]}><Suspense fallback={<PageLoader />}><ManoDeObraPage /></Suspense></RequiereRol>,
      },
      {
        path: 'mano-de-obra/rendimientos',
        element: <RequiereRol roles={[...OPERATIVO]}><Suspense fallback={<PageLoader />}><RendimientosManoObraPage /></Suspense></RequiereRol>,
      },
      {
        path: 'ventas',
        element: <RequiereRol roles={[...FINANCIERO]}><Suspense fallback={<PageLoader />}><VentasPage /></Suspense></RequiereRol>,
      },
      {
        path: 'compras',
        element: <RequiereRol roles={[...FINANCIERO]}><Suspense fallback={<PageLoader />}><ComprasPage /></Suspense></RequiereRol>,
      },
      {
        path: 'movimientos',
        element: <RequiereRol roles={[...FINANCIERO]}><Suspense fallback={<PageLoader />}><MovimientosPage /></Suspense></RequiereRol>,
      },
      {
        path: 'relevamientos',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><RelevamientosPage /></Suspense></RequiereRol>,
      },
      {
        path: 'relevamientos/nuevo',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><RelevamientoFormPage /></Suspense></RequiereRol>,
      },
      {
        path: 'relevamientos/:id',
        element: <RequiereRol roles={[...TODOS]}><Suspense fallback={<PageLoader />}><RelevamientoFormPage /></Suspense></RequiereRol>,
      },
      {
        path: 'settings',
        element: <RequiereRol roles={[...SOLO_ADMIN]}><Suspense fallback={<PageLoader />}><SettingsPage /></Suspense></RequiereRol>,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
