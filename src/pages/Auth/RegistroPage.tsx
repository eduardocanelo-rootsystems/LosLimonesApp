import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buscarInvitacionPorToken, type Invitacion } from '@/hooks/useUsuarios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const ROL_LABEL: Record<string, string> = {
  admin:    'Administrador',
  socio:    'Socio',
  empleado: 'Empleado',
}

export default function RegistroPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const token      = params.get('token') ?? ''

  const [invitacion, setInvitacion] = useState<Invitacion | null>(null)
  const [cargando, setCargando]     = useState(true)
  const [tokenInvalido, setTokenInvalido] = useState(false)

  const [nombre,   setNombre]   = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [enviando, setEnviando] = useState(false)
  const [listo,    setListo]    = useState(false)

  useEffect(() => {
    if (!token) { setTokenInvalido(true); setCargando(false); return }
    buscarInvitacionPorToken(token).then((inv) => {
      if (!inv) setTokenInvalido(true)
      else setInvitacion(inv)
      setCargando(false)
    })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitacion) return
    if (password.length < 8)          { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirm)          { setError('Las contraseñas no coinciden.'); return }
    if (!nombre.trim())                { setError('El nombre es obligatorio.'); return }

    setError('')
    setEnviando(true)
    try {
      // 1. Crear cuenta en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    invitacion.email,
        password,
        options:  { data: { nombre: nombre.trim() } },
      })
      if (signUpError) throw signUpError
      if (!data.user) throw new Error('No se pudo crear el usuario.')

      // 2. Asignar rol desde la invitación
      const { error: rolError } = await db.from('user_roles').insert({
        user_id:      data.user.id,
        email:        invitacion.email,
        nombre:       nombre.trim(),
        rol:          invitacion.rol,
        invitado_por: invitacion.creado_por,
      })
      if (rolError) throw rolError

      // 3. Marcar invitación como usada
      await db.from('invitaciones').update({ usado: true }).eq('id', invitacion.id)

      setListo(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar.')
    } finally {
      setEnviando(false)
    }
  }

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
        <AlertTriangle className="h-10 w-10 text-amber-400" />
        <p className="text-lg font-medium text-ink-100">Invitación inválida o expirada</p>
        <p className="text-sm text-ink-400">Este enlace ya fue usado o no es válido. Pedí una nueva invitación al administrador.</p>
        <button onClick={() => navigate('/login')} className="text-sm text-accent-400 hover:underline">Ir al login</button>
      </div>
    )
  }

  if (listo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-accent-400" />
        <p className="text-lg font-medium text-ink-100">¡Cuenta creada con éxito!</p>
        <p className="text-sm text-ink-400">
          {invitacion?.email && `Tu cuenta ${invitacion.email} fue registrada como `}
          <strong className="text-ink-200">{invitacion?.rol ? ROL_LABEL[invitacion.rol] : ''}</strong>.
        </p>
        <p className="text-xs text-ink-500">
          Si el administrador habilitó confirmación por email, revisá tu casilla antes de ingresar.
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary mt-2">Ir al login</button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-2xl">
            <span className="font-light text-accent-500">/</span>
            <span className="font-medium text-ink-100">root</span>
          </span>
          <p className="mt-2 text-sm text-ink-400">Los Limones Creativos</p>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-900 p-6 shadow-2xl">
          <h1 className="mb-1 text-lg font-semibold text-ink-100">Crear cuenta</h1>
          <p className="mb-5 text-xs text-ink-500">
            Fuiste invitado como <span className="font-medium text-accent-400">{invitacion?.rol ? ROL_LABEL[invitacion.rol] : ''}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Email</label>
              <input
                type="email"
                className="input w-full bg-ink-800 text-ink-400"
                value={invitacion?.email ?? ''}
                readOnly
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Nombre completo</label>
              <input
                type="text"
                className="input w-full"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Luis García"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Contraseña</label>
              <input
                type="password"
                className="input w-full"
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
                className="input w-full"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí la contraseña"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}

            <button type="submit" disabled={enviando} className="btn-primary w-full">
              {enviando ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
