import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import '../mocks/supabase'
import { mockOnAuthStateChange } from '../mocks/supabase'

// Mock de useAuth para controlar el estado en cada test
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderWithRouter(authed: boolean, loading = false, rol = 'admin') {
  mockUseAuth.mockReturnValue({
    user:    authed ? { id: 'uid-1', email: 'test@test.com' } : null,
    loading,
    rol:     authed ? rol : null,
    activo:  true,
    nombre:  'Test',
    signIn:  vi.fn(),
    signOut: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>CONTENIDO PROTEGIDO</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
})

describe('ProtectedRoute', () => {
  it('muestra spinner mientras carga', () => {
    renderWithRouter(false, true)
    // Durante loading no redirige ni muestra contenido
    expect(screen.queryByText('CONTENIDO PROTEGIDO')).not.toBeInTheDocument()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
  })

  it('redirige a /login cuando no hay sesión', () => {
    renderWithRouter(false, false)
    expect(screen.getByText('LOGIN')).toBeInTheDocument()
    expect(screen.queryByText('CONTENIDO PROTEGIDO')).not.toBeInTheDocument()
  })

  it('muestra el contenido cuando el usuario está autenticado', () => {
    renderWithRouter(true, false)
    expect(screen.getByText('CONTENIDO PROTEGIDO')).toBeInTheDocument()
    expect(screen.queryByText('LOGIN')).not.toBeInTheDocument()
  })
})
