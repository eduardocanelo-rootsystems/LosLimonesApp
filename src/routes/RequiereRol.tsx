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
  const { rol } = useAuth()

  if (!rol || !roles.includes(rol)) {
    // Redirigir a una página que sí puede ver
    const destino = redirect ?? (rol === 'empleado' ? '/presupuestos' : '/')
    return <Navigate to={destino} replace />
  }

  return <>{children}</>
}
