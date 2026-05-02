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
  session: Session | null
  user:    User | null
  loading: boolean
  rol:     Rol | null
  activo:  boolean
  nombre:  string
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => void
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
  // Fallback: query a user_roles
  try {
    const res = await db
      .from('user_roles')
      .select('rol, activo, nombre')
      .eq('user_id', userId)
      .maybeSingle()
    const data = res?.data
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
    // Safety net: si algo falla en la red, no dejamos el spinner trabado para siempre
    const fallback = setTimeout(() => setLoading(false), 8000)

    // onAuthStateChange dispara INITIAL_SESSION en el primer render con la sesión actual
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        if (newSession?.user) {
          setRolData(await fetchRol(newSession.user.id, newSession.user.app_metadata))
        } else {
          setRolData(ROL_VACIO)
        }
        clearTimeout(fallback)
        setLoading(false)
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(() => {
    supabase.auth.signOut().catch(() => {})
    window.location.replace('/login')
  }, [])

  const value = useMemo(() => ({
    session,
    user:   session?.user ?? null,
    loading,
    rol:    rolData.rol,
    activo: rolData.activo,
    nombre: rolData.nombre,
    signIn,
    signOut,
  }), [session, loading, rolData, signIn, signOut])

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
