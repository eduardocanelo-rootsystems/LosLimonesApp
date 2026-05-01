import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { RequiereRol } from './RequiereRol'
import LoginPage from '@/pages/Auth/LoginPage'
import RegistroPage from '@/pages/Auth/RegistroPage'
import ServiciosPage from '@/pages/Servicios/ServiciosPage'
import MaterialesPage from '@/pages/Materiales/MaterialesPage'
import ManoDeObraPage from '@/pages/ManoDeObra/ManoDeObraPage'
import PresupuestosPage from '@/pages/Presupuestos/PresupuestosPage'
import PresupuestoFormPage from '@/pages/Presupuestos/PresupuestoFormPage'
import ContratoFormPage from '@/pages/Contratos/ContratoFormPage'
import FirmarContratoPage from '@/pages/Firmar/FirmarContratoPage'
import VentasPage from '@/pages/Ventas/VentasPage'
import ComprasPage from '@/pages/Compras/ComprasPage'
import SettingsPage from '@/pages/Settings/SettingsPage'
import DashboardPage from '@/pages/Dashboard/DashboardPage'
import MovimientosPage from '@/pages/Movimientos/MovimientosPage'

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
        element: <RequiereRol roles={[...FINANCIERO]}><DashboardPage /></RequiereRol>,
      },
      {
        path: 'presupuestos',
        element: <RequiereRol roles={[...TODOS]}><PresupuestosPage /></RequiereRol>,
      },
      {
        path: 'presupuestos/nuevo',
        element: <RequiereRol roles={[...TODOS]}><PresupuestoFormPage /></RequiereRol>,
      },
      {
        path: 'presupuestos/:id',
        element: <RequiereRol roles={[...TODOS]}><PresupuestoFormPage /></RequiereRol>,
      },
      {
        path: 'presupuestos/:id/contrato',
        element: <RequiereRol roles={[...TODOS]}><ContratoFormPage /></RequiereRol>,
      },
      {
        path: 'servicios',
        element: <RequiereRol roles={[...OPERATIVO]}><ServiciosPage /></RequiereRol>,
      },
      {
        path: 'materiales',
        element: <RequiereRol roles={[...OPERATIVO]}><MaterialesPage /></RequiereRol>,
      },
      {
        path: 'mano-de-obra',
        element: <RequiereRol roles={[...OPERATIVO]}><ManoDeObraPage /></RequiereRol>,
      },
      {
        path: 'ventas',
        element: <RequiereRol roles={[...FINANCIERO]}><VentasPage /></RequiereRol>,
      },
      {
        path: 'compras',
        element: <RequiereRol roles={[...FINANCIERO]}><ComprasPage /></RequiereRol>,
      },
      {
        path: 'movimientos',
        element: <RequiereRol roles={[...FINANCIERO]}><MovimientosPage /></RequiereRol>,
      },
      {
        path: 'settings',
        element: <RequiereRol roles={[...SOLO_ADMIN]}><SettingsPage /></RequiereRol>,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
