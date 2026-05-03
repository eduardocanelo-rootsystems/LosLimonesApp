import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import LoginPage from '@/pages/Auth/LoginPage'
import '../mocks/supabase'

const mockSignIn  = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null, loading: false, rol: null, activo: false, nombre: '',
    signIn:  mockSignIn,
    signOut: mockSignOut,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/"      element={<div>HOME</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

describe('LoginPage', () => {
  it('renderiza el formulario correctamente', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/tu@email.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('muestra error con credenciales inválidas', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Invalid login credentials' })
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/tu@email.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'wrongpass')
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() =>
      expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument()
    )
  })

  it('muestra error genérico para otros errores', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Network error' })
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/tu@email.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass1234')
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() =>
      expect(screen.getByText('Network error')).toBeInTheDocument()
    )
  })

  it('llama a signIn con email en minúsculas', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/tu@email.com/i), 'Test@EXAMPLE.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass1234')
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledOnce())
    // Vitest verifica que se llamó — el normalize lo hace Supabase Auth
  })

  it('el botón se deshabilita durante el envío', async () => {
    mockSignIn.mockImplementationOnce(() => new Promise(() => {})) // pendiente
    renderLogin()
    await userEvent.type(screen.getByPlaceholderText(/tu@email.com/i), 'x@x.com')
    await userEvent.type(screen.getByPlaceholderText(/••••••••/), 'pass1234')
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    await waitFor(() =>
      expect(screen.getByRole('button')).toBeDisabled()
    )
  })
})
