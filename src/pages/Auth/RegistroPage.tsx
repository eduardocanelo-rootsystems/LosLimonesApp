import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buscarInvitacionPorToken } from '@/hooks/useUsuarios'
import type { Invitacion } from '@/hooks/useUsuarios'

export default function RegistroPage() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const token           = params.get('token')

  const [invitacion, setInvitacion] = useState<Invitacion | null>(null)
  const [cargando,   setCargando]   = useState(!!token)
  const [tokenInvalido, setTokenInvalido] = useState(false)

  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo,    setListo]    = useState(false)

  useEffect(() => {
    if (!token) return
    buscarInvitacionPorToken(token).then((inv) => {
      if (!inv) {
        setTokenInvalido(true)
      } else {
        setInvitacion(inv)
        setEmail(inv.email)
      }
      setCargando(false)
    })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirm)  { setError('Las contraseñas no coinciden.'); return }
    if (!nombre.trim())        { setError('El nombre es obligatorio.'); return }

    setError('')
    setEnviando(true)
    try {
      // El trigger on_auth_user_created en la DB crea user_roles y marca la invitación
      // como usada server-side, independientemente del estado de la sesión del cliente.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:   email.trim().toLowerCase(),
        password,
        options: { data: { nombre: nombre.trim() } },
      })
      if (signUpError) {
        const msg = signUpError.message
        throw new Error(msg.includes('already registered') ? 'Este email ya tiene una cuenta.' : msg)
      }
      if (!data.user) throw new Error('No se pudo crear el usuario.')

      setListo(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Estados de pantalla ──────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
      </div>
    )
  }

  if (tokenInvalido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-4 text-center">
        <p className="text-lg font-medium text-ink-100">Enlace inválido o vencido</p>
        <p className="text-sm text-ink-400">
          Este enlace de invitación ya fue usado o expiró. Pedí al administrador que te envíe uno nuevo.
        </p>
        <button onClick={() => navigate('/login')} className="btn-secondary mt-2">Ir al login</button>
      </div>
    )
  }

  if (listo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-accent-500" />
        <p className="text-lg font-medium text-ink-100">¡Cuenta creada!</p>
        <p className="text-sm text-ink-400">
          {invitacion
            ? 'Tu cuenta está activa. Ya podés iniciar sesión.'
            : 'El administrador activará tu cuenta antes de que puedas ingresar.'}
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary mt-2">Ir al login</button>
      </div>
    )
  }

  // ── Formulario ───────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-2xl">
            <span className="font-light text-sys-500">/</span>
            <span className="font-medium text-ink-100">root</span>
          </span>
          <p className="mt-2 text-sm text-ink-400">Limones - Rope Access</p>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl">
          <h1 className="mb-1 text-lg font-semibold text-ink-100">Crear cuenta</h1>
          <p className="mb-5 text-xs text-ink-500">
            {invitacion
              ? `Invitado como ${invitacion.rol} · El email ya está confirmado.`
              : 'El administrador habilitará tu acceso una vez registrado.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Nombre completo</label>
              <input
                type="text"
                className="input-base"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Luis García"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Email</label>
              <input
                type="email"
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                readOnly={!!invitacion}
                disabled={!!invitacion}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Contraseña</label>
              <input
                type="password"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Confirmar contraseña</label>
              <input
                type="password"
                className="input-base"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button type="submit" disabled={enviando} className="btn-primary w-full">
              {enviando ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-ink-500">
            ¿Ya tenés cuenta?{' '}
            <button onClick={() => navigate('/login')} className="text-accent-400 hover:underline">
              Iniciar sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
