import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stub de variables de entorno de Supabase
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock global de window.location.replace
Object.defineProperty(window, 'location', {
  value: { ...window.location, replace: vi.fn() },
  writable: true,
})
