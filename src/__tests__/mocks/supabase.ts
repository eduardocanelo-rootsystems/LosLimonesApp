import { vi } from 'vitest'

// Mock del cliente Supabase — permite controlar respuestas en cada test
export const mockSelect    = vi.fn()
export const mockInsert    = vi.fn()
export const mockUpdate    = vi.fn()
export const mockDelete    = vi.fn()
export const mockEq        = vi.fn()
export const mockMaybeSingle = vi.fn()
export const mockSingle    = vi.fn()
export const mockSignIn    = vi.fn()
export const mockSignUp    = vi.fn()
export const mockSignOut   = vi.fn()
export const mockGetSession = vi.fn()
export const mockGetUser   = vi.fn()
export const mockOnAuthStateChange = vi.fn()
export const mockInvoke    = vi.fn()

const buildChain = () => {
  const chain: Record<string, unknown> = {}
  chain.select      = vi.fn(() => chain)
  chain.insert      = vi.fn(() => chain)
  chain.update      = vi.fn(() => chain)
  chain.delete      = vi.fn(() => chain)
  chain.eq          = vi.fn(() => chain)
  chain.neq         = vi.fn(() => chain)
  chain.gt          = vi.fn(() => chain)
  chain.order       = vi.fn(() => chain)
  chain.maybeSingle = mockMaybeSingle
  chain.single      = mockSingle
  return chain
}

export const supabaseMock = {
  from: vi.fn(() => buildChain()),
  auth: {
    signInWithPassword: mockSignIn,
    signUp:             mockSignUp,
    signOut:            mockSignOut,
    getSession:         mockGetSession,
    getUser:            mockGetUser,
    onAuthStateChange:  mockOnAuthStateChange,
    resetPasswordForEmail: vi.fn(),
  },
  functions: {
    invoke: mockInvoke,
  },
}

vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }))
