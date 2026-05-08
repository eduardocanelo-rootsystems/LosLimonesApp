import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Rol } from '@/hooks/useUsuarios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface RolData {
  rol:    Rol | null
  activo: boolean
  nombre: string
}

const ROL_VACIO: RolData = { rol: null, activo: false, nombre: '' }

interface AuthContextValue {
  session:     Session | null
  user:        User | null
  loading:     boolean
  rol:         Rol | null
  activo:      boolean
  nombre:      string
  signIn:      (email: string, password: string) => Promise<{ error: string | null }>
  signOut:     () => void
  refetchRol:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchRol(userId: string, appMeta?: Record<string, unknown>): Promise<RolData> {
  // Leer primero desde app_metadata del JWT (no requiere query a la DB)
  if (appMeta?.rol) {
    return {
      rol:    appMeta.rol    as Rol,
      activo: appMeta.activo !== false,
      nombre: (appMeta.nombre as string) ?? '',
    }
  }
  // Fallback: query a user_roles con timeout para no colgar en Android
  try {
    const res = await Promise.race([
      db.from('user_roles').select('rol, activo, nombre').eq('user_id', userId).maybeSingle(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchRol timeout')), 8_000)
      ),
    ])
    const data = (res as { data?: { rol?: Rol; activo?: boolean; nombre?: string } })?.data
    return {
      rol:    data?.rol    ?? null,
      activo: data?.activo ?? false,
      nombre: data?.nombre ?? '',
    }
  } catch (err) {
    console.error('[fetchRol] error:', err)
    return ROL_VACIO
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [rolData, setRolData] = useState<RolData>(ROL_VACIO)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    // Fallback reducido: getSession() debería resolver en <100ms desde localStorage
    const fallback = setTimeout(() => { if (mounted) setLoading(false) }, 3000)

    // Patrón recomendado por Supabase para mobile: getSession() lee localStorage
    // directamente sin red, garantizando que loading se resuelve rápido en Android.
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return
      clearTimeout(fallback)
      setSession(s)
      if (s?.user) {
        setRolData(await fetchRol(s.user.id, s.user.app_metadata))
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) { clearTimeout(fallback); setLoading(false) }
    })

    // Escucha cambios posteriores: sign-in, sign-out, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return
        // En SIGNED_IN bloqueamos loading para que RequiereRol no dispare
        // auto-retry con rol=null antes de que fetchRol termine.
        if (_event === 'SIGNED_IN') setLoading(true)
        setSession(newSession)
        if (newSession?.user) {
          setRolData(await fetchRol(newSession.user.id, newSession.user.app_metadata))
        } else {
          setRolData(ROL_VACIO)
        }
        if (mounted) setLoading(false)
      }
    )

    return () => { mounted = false; subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const timeoutMs = 20_000
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    )
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
      return { error: result.error?.message ?? null }
    } catch (err) {
      if (err instanceof Error && err.message === 'timeout') {
        return { error: 'Tiempo de espera agotado. Verificá tu conexión e intentá de nuevo.' }
      }
      return { error: 'Error de conexión. Intentá de nuevo.' }
    }
  }, [])

  const signOut = useCallback(() => {
    supabase.auth.signOut()
      .catch(() => {})
      .finally(() => { window.location.replace('/login') })
  }, [])

  const refetchRol = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession()
    if (s?.user) {
      setRolData(await fetchRol(s.user.id, s.user.app_metadata))
    }
  }, [])

  const value = useMemo(() => ({
    session,
    user:      session?.user ?? null,
    loading,
    rol:       rolData.rol,
    activo:    rolData.activo,
    nombre:    rolData.nombre,
    signIn,
    signOut,
    refetchRol,
  }), [session, loading, rolData, signIn, signOut, refetchRol])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
