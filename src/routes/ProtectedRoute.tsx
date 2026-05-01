import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, activo, rol, signOut } = useAuth()
  const location = useLocation()

  // Si el usuario existe pero está desactivado o no tiene rol asignado → forzar logout
  useEffect(() => {
    if (!loading && user && (!activo || !rol)) {
      signOut()
    }
  }, [loading, user, activo, rol, signOut])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!activo || !rol) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-950 text-center">
        <p className="text-sm text-ink-400">Tu cuenta no está activa o no tiene permisos asignados.</p>
        <button onClick={signOut} className="text-xs text-accent-400 hover:underline">Cerrar sesión</button>
      </div>
    )
  }

  return <>{children}</>
}
