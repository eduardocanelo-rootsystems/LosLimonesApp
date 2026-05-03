import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequiereRol } from './RequiereRol'

// Eager — pequeños, necesarios en el primer render
import LoginPage    from '@/pages/Auth/LoginPage'
import RegistroPage from '@/pages/Auth/RegistroPage'
import FirmarContratoPage from '@/pages/Firmar/FirmarContratoPage'

// Lazy — se cargan solo cuando el usuario navega a esa ruta
const DashboardPage           = lazy(() => import('@/pages/Dashboard/DashboardPage'))
const PresupuestosPage        = lazy(() => import('@/pages/Presupuestos/PresupuestosPage'))
const PresupuestoFormPage     = lazy(() => import('@/pages/Presupuestos/PresupuestoFormPage'))
const ContratoFormPage        = lazy(() => import('@/pages/Contratos/ContratoFormPage'))
const ClientesPage            = lazy(() => import('@/pages/Clientes/ClientesPage'))
const ServiciosPage           = lazy(() => import('@/pages/Servicios/ServiciosPage'))
const MaterialesPage          = lazy(() => import('@/pages/Materiales/MaterialesPage'))
const RendimientosPage        = lazy(() => import('@/pages/Materiales/RendimientosPage'))
const ManoDeObraPage          = lazy(() => import('@/pages/ManoDeObra/ManoDeObraPage'))
const RendimientosManoObraPage = lazy(() => import('@/pages/ManoDeObra/RendimientosManoObraPage'))
const VentasPage              = lazy(() => import('@/pages/Ventas/VentasPage'))
const ComprasPage             = lazy(() => import('@/pages/Compras/ComprasPage'))
const MovimientosPage         = lazy(() => import('@/pages/Movimientos/MovimientosPage'))
const RelevamientosPage       = lazy(() => import('@/pages/Relevamientos/RelevamientosPage'))
const RelevamientoFormPage    = lazy(() => import('@/pages/Relevamientos/RelevamientoFormPage'))
const SettingsPage            = lazy(() => import('@/pages/Settings/SettingsPage'))

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
