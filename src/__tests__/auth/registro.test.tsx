import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RegistroPage from '@/pages/Auth/RegistroPage'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, loading: false, rol: null }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const { mockBuscarInvitacion, mockAuthSignUp, mockDbFrom } = vi.hoisted(() => ({
  mockBuscarInvitacion: vi.fn(),
  mockAuthSignUp: vi.fn(),
  mockDbFrom: vi.fn(),
}))

vi.mock('@/hooks/useUsuarios', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/hooks/useUsuarios')>()
  return { ...original, buscarInvitacionPorToken: mockBuscarInvitacion }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { signUp: mockAuthSignUp },
    from: mockDbFrom,
  },
}))

const INV_VALIDA = {
  id: 'inv-1', email: 'invitado@test.com', rol: 'socio',
  token: 'tok-ok', usado: false, creado_por: 'admin-uid',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  created_at: new Date().toISOString(),
}

function renderRegistro(token?: string) {
  const url = token ? `/registro?token=${token}` : '/registro'
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/login"    element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => vi.clearAllMocks())

// ─── Token inválido / vencido ─────────────────────────────────────────────────

describe('RegistroPage — token inválido / vencido', () => {
  it('muestra "enlace inválido" para token inexistente', async () => {
    mockBuscarInvitacion.mockResolvedValue(null)
    renderRegistro('token-malo')
    await waitFor(() =>
      expect(screen.getByText(/enlace inválido/i)).toBeInTheDocument()
    )
  })

  it('muestra "enlace inválido" para token ya usado', async () => {
    mockBuscarInvitacion.mockResolvedValue(null)
    renderRegistro('token-usado')
    await waitFor(() =>
      expect(screen.getByText(/enlace inválido/i)).toBeInTheDocument()
    )
  })

  it('ofrece ir al login desde la pantalla de error', async () => {
    mockBuscarInvitacion.mockResolvedValue(null)
    renderRegistro('token-malo')
    await waitFor(() => screen.getByText(/enlace inválido/i))
    expect(screen.getByRole('button', { name: /ir al login/i })).toBeInTheDocument()
  })
})

// ─── Con invitación válida ────────────────────────────────────────────────────

describe('RegistroPage — con invitación válida', () => {
  it('pre-rellena y bloquea el campo email con el de la invitación', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    renderRegistro('tok-ok')
    await waitFor(() =>
      expect(screen.getByDisplayValue('invitado@test.com')).toBeInTheDocument()
    )
    expect(screen.getByDisplayValue('invitado@test.com')).toBeDisabled()
  })

  it('muestra el rol de la invitación', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    renderRegistro('tok-ok')
    await waitFor(() =>
      expect(screen.getByText(/socio/i)).toBeInTheDocument()
    )
  })

  it('valida contraseña mínima de 8 caracteres', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    renderRegistro('tok-ok')
    await waitFor(() => screen.getByPlaceholderText(/mínimo 8/i))
    await userEvent.type(screen.getByPlaceholderText('Luis García'), 'Juan')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8/i), 'corta')
    await userEvent.type(screen.getByPlaceholderText(/repetí/i), 'corta')
    const form = screen.getByPlaceholderText(/mínimo 8/i).closest('form')!
    fireEvent.submit(form)
    await waitFor(() =>
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument()
    )
  })

  it('valida que las contraseñas coincidan', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    renderRegistro('tok-ok')
    await waitFor(() => screen.getByPlaceholderText(/mínimo 8/i))
    await userEvent.type(screen.getByPlaceholderText('Luis García'), 'Juan')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8/i), 'password123')
    await userEvent.type(screen.getByPlaceholderText(/repetí/i), 'diferente123')
    const form = screen.getByPlaceholderText(/mínimo 8/i).closest('form')!
    fireEvent.submit(form)
    await waitFor(() =>
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument()
    )
  })

  it('valida que el nombre no esté vacío', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    renderRegistro('tok-ok')
    await waitFor(() => screen.getByPlaceholderText(/mínimo 8/i))
    // Type a space — satisfies HTML required but fails nombre.trim() check
    await userEvent.type(screen.getByPlaceholderText('Luis García'), ' ')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8/i), 'password123')
    await userEvent.type(screen.getByPlaceholderText(/repetí/i), 'password123')
    const form = screen.getByPlaceholderText(/mínimo 8/i).closest('form')!
    fireEvent.submit(form)
    await waitFor(() =>
      expect(screen.getByText(/nombre es obligatorio/i)).toBeInTheDocument()
    )
  })

  it('crea cuenta exitosa con acceso inmediato (cuenta activa)', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    mockAuthSignUp.mockResolvedValue({
      data: { user: { id: 'new-uid' } }, error: null,
    })
    mockDbFrom
      .mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
      .mockReturnValueOnce({ update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })

    renderRegistro('tok-ok')
    await waitFor(() => screen.getByPlaceholderText('Luis García'))

    await userEvent.type(screen.getByPlaceholderText('Luis García'), 'María López')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8/i), 'segura1234')
    await userEvent.type(screen.getByPlaceholderText(/repetí/i), 'segura1234')
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(screen.getByText(/cuenta creada/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/ya podés iniciar sesión/i)).toBeInTheDocument()
  })

  it('muestra error si el email ya está registrado', async () => {
    mockBuscarInvitacion.mockResolvedValue(INV_VALIDA)
    mockAuthSignUp.mockResolvedValue({
      data: { user: null },
      error: new Error('User already registered'),
    })
    renderRegistro('tok-ok')
    await waitFor(() => screen.getByPlaceholderText('Luis García'))

    await userEvent.type(screen.getByPlaceholderText('Luis García'), 'María López')
    await userEvent.type(screen.getByPlaceholderText(/mínimo 8/i), 'segura1234')
    await userEvent.type(screen.getByPlaceholderText(/repetí/i), 'segura1234')
    await userEvent.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() =>
      expect(screen.getByText(/ya tiene una cuenta/i)).toBeInTheDocument()
    )
  })
})

// ─── Sin token (registro libre) ───────────────────────────────────────────────

describe('RegistroPage — sin token', () => {
  it('muestra aviso de activación manual por el admin', () => {
    renderRegistro()
    expect(screen.getByText(/administrador habilitará/i)).toBeInTheDocument()
  })

  it('el campo email está habilitado', () => {
    renderRegistro()
    expect(screen.getByPlaceholderText(/tu@email.com/i)).not.toBeDisabled()
  })
})
