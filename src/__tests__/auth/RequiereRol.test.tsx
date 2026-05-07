import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RequiereRol } from '@/routes/RequiereRol'
import '../mocks/supabase'

const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth:     () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function makeAuth(overrides = {}) {
  return {
    user: { id: 'uid-1' }, loading: false,
    rol: 'admin', activo: true, nombre: 'Test',
    signIn: vi.fn(), signOut: vi.fn(), refetchRol: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function renderGuard(roles: string[], authOverrides = {}) {
  mockUseAuth.mockReturnValue(makeAuth(authOverrides))
  return render(
    <MemoryRouter initialEntries={['/protegido']}>
      <Routes>
        <Route path="/"          element={<div>HOME</div>} />
        <Route path="/presupuestos" element={<div>PRESUPUESTOS</div>} />
        <Route
          path="/protegido"
          element={
            <RequiereRol roles={roles as never[]}>
              <div>ACCESO CONCEDIDO</div>
            </RequiereRol>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('RequiereRol — control de acceso por rol', () => {
  it('permite acceso cuando el rol está en la lista', () => {
    renderGuard(['superadmin', 'admin'])
    expect(screen.getByText('ACCESO CONCEDIDO')).toBeInTheDocument()
  })

  it('redirige cuando el rol no está en la lista', () => {
    renderGuard(['superadmin'], { rol: 'empleado' })
    expect(screen.queryByText('ACCESO CONCEDIDO')).not.toBeInTheDocument()
    // empleado redirige a /presupuestos
    expect(screen.getByText('PRESUPUESTOS')).toBeInTheDocument()
  })

  it('bloquea cuenta inactiva aunque el rol sea correcto', () => {
    renderGuard(['admin'], { activo: false })
    expect(screen.queryByText('ACCESO CONCEDIDO')).not.toBeInTheDocument()
    expect(screen.getByText(/pendiente de activación/i)).toBeInTheDocument()
  })

  it('bloquea usuario autenticado sin rol asignado', async () => {
    renderGuard(['admin'], { rol: null })
    expect(screen.queryByText('ACCESO CONCEDIDO')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
    })
  })

  it('socio NO puede acceder a ruta solo-admin', () => {
    renderGuard(['superadmin', 'admin'], { rol: 'socio' })
    expect(screen.queryByText('ACCESO CONCEDIDO')).not.toBeInTheDocument()
    expect(screen.getByText('HOME')).toBeInTheDocument()
  })

  it('empleado NO puede acceder a dashboard (financiero)', () => {
    renderGuard(['superadmin', 'admin', 'socio'], { rol: 'empleado' })
    expect(screen.queryByText('ACCESO CONCEDIDO')).not.toBeInTheDocument()
    expect(screen.getByText('PRESUPUESTOS')).toBeInTheDocument()
  })

  it('superadmin puede acceder a cualquier ruta', () => {
    renderGuard(['superadmin', 'admin', 'socio', 'empleado'], { rol: 'superadmin' })
    expect(screen.getByText('ACCESO CONCEDIDO')).toBeInTheDocument()
  })
})
