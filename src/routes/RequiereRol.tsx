import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Rol } from '@/hooks/useUsuarios'
import type { ReactNode } from 'react'

interface Props {
  roles:    Rol[]
  children: ReactNode
  redirect?: string
}

export function RequiereRol({ roles, children, redirect }: Props) {
  const { rol, activo, loading, user, signOut, refetchRol } = useAuth()
  const [retrying, setRetrying] = useState(false)
  const autoRetried = useRef(false)

  // Si hay sesión pero no hay rol, reintenta automáticamente una vez
  // (cubre el caso de red lenta en mobile que falla el primer fetch)
  useEffect(() => {
    if (!loading && user && !rol && !autoRetried.current) {
      autoRetried.current = true
      setRetrying(true)
      refetchRol().finally(() => setRetrying(false))
    }
  }, [loading, user, rol, refetchRol])

  if (loading || retrying) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
      </div>
    )
  }

  // Autenticado pero cuenta pendiente de activación
  if (user && rol && !activo) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-sm text-ink-400">Tu cuenta está pendiente de activación. Contactá al administrador.</p>
        <button onClick={() => signOut()} className="text-xs text-accent-400 hover:underline">Cerrar sesión</button>
      </div>
    )
  }

  // Sin rol tras el reintento automático
  if (user && !rol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center px-6">
        <p className="text-sm text-ink-400">No se pudo cargar tu cuenta. Verificá tu conexión e intentá de nuevo.</p>
        <button
          onClick={async () => { setRetrying(true); await refetchRol(); setRetrying(false) }}
          className="rounded-md bg-ink-800 px-4 py-2 text-sm text-ink-200 hover:bg-ink-700 transition-colors"
        >
          Reintentar
        </button>
        <button onClick={() => signOut()} className="text-xs text-ink-500 hover:underline">Cerrar sesión</button>
      </div>
    )
  }

  if (!rol || !roles.includes(rol)) {
    const destino = redirect ?? (rol === 'empleado' ? '/presupuestos' : '/')
    return <Navigate to={destino} replace />
  }

  return <>{children}</>
}
