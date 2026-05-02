import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { Rol } from '@/hooks/useUsuarios'
import type { ReactNode } from 'react'

interface Props {
  roles:    Rol[]
  children: ReactNode
  /** Ruta a la que redirigir si no tiene acceso. Por defecto la primera ruta accesible. */
  redirect?: string
}

export function RequiereRol({ roles, children, redirect }: Props) {
  const { rol, activo, loading, user, signOut } = useAuth()

  if (loading) return null

  // Autenticado pero cuenta pendiente de activación
  if (user && rol && !activo) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-ink-400">Tu cuenta está pendiente de activación. Contactá al administrador.</p>
        <button onClick={() => signOut()} className="text-xs text-accent-400 hover:underline">Cerrar sesión</button>
      </div>
    )
  }

  // Autenticado pero sin rol asignado — mostrar mensaje, NO redirigir (evita bucle con LoginPage)
  if (user && !rol) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-ink-400">Tu cuenta no tiene permisos asignados. Contactá al administrador.</p>
        <button onClick={() => signOut()} className="text-xs text-accent-400 hover:underline">Cerrar sesión</button>
      </div>
    )
  }

  if (!rol || !roles.includes(rol)) {
    const destino = redirect ?? (rol === 'empleado' ? '/presupuestos' : '/')
    return <Navigate to={destino} replace />
  }

  return <>{children}</>
}
