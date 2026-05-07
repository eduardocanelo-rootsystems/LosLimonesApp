import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { RootLogo } from '@/components/shared/RootLogo'

export default function LoginPage() {
  const { user, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si ya está logueado, redirigir
  if (!authLoading && user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signIn(email, password)
    setSubmitting(false)

    if (error) {
      // Mensaje genérico para no filtrar info
      setError(
        error.includes('Invalid login')
          ? 'Credenciales inválidas. Verificá tu email y contraseña.'
          : error
      )
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Brand top */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex flex-col leading-none select-none">
              <span className="font-mono text-xl">
                <span className="font-light text-sys-500">/</span>
                <span className="font-medium tracking-tight text-ink-100">root</span>
              </span>
              <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-400">Systems</span>
            </div>
            <div className="h-10 w-px bg-ink-700" />
            <div className="flex items-center gap-2.5">
              <img src="/logo-cliente.svg" alt="Limones · Rope Access" className="h-16 w-auto object-contain" />
              <div className="flex flex-col leading-none text-left">
                <span className="text-sm font-semibold text-limones-lima leading-tight">Limones · Rope Access</span>
                <span className="mt-1 text-[9px] uppercase tracking-wider text-ink-400">Trabajos en altura - Fachadas - Impermeabilizaciones</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="card p-8 shadow-2xl shadow-black/40"
        >
          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-300"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="input-base"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-300"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="input-base"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </div>
        </form>

        {/* Footer mini */}
        <div className="mt-8 text-center text-xs text-ink-400">
          <span>Desarrollado por </span>
          <RootLogo size="sm" className="mx-1 text-[11px]" />
          <span>· Eduardo Canelo</span>
        </div>
      </div>
    </div>
  )
}
