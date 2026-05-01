import {
  createContext,
  useContext,
  useEffect,
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

interface AuthContextValue {
  session: Session | null
  user:    User | null
  loading: boolean
  rol:     Rol | null
  activo:  boolean
  nombre:  string
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchRol(userId: string): Promise<RolData> {
  const { data } = await db
    .from('user_roles')
    .select('rol, activo, nombre')
    .eq('user_id', userId)
    .maybeSingle()
  return {
    rol:    data?.rol    ?? null,
    activo: data?.activo ?? false,
    nombre: data?.nombre ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null)
  const [rolData, setRolData]   = useState<RolData>({ rol: null, activo: false, nombre: '' })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) setRolData(await fetchRol(session.user.id))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        setRolData(await fetchRol(session.user.id))
      } else {
        setRolData({ rol: null, activo: false, nombre: '' })
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      loading,
      rol:     rolData.rol,
      activo:  rolData.activo,
      nombre:  rolData.nombre,
      signIn,
      signOut,
    }}>
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
