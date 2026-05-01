import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Wrench, Package, Users,
  Receipt, ShoppingCart, ArrowLeftRight,
  Settings as SettingsIcon, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Rol } from '@/hooks/useUsuarios'

const navItems = [
  { path: '/',             label: 'Dashboard',    icon: LayoutDashboard, roles: ['superadmin', 'admin', 'socio'] as Rol[] },
  { path: '/presupuestos', label: 'Presupuestos', icon: FileText,         roles: ['superadmin', 'admin', 'socio', 'empleado'] as Rol[] },
  { path: '/servicios',    label: 'Servicios',    icon: Wrench,           roles: ['superadmin', 'admin', 'empleado'] as Rol[] },
  { path: '/materiales',   label: 'Materiales',   icon: Package,          roles: ['superadmin', 'admin', 'empleado'] as Rol[] },
  { path: '/mano-de-obra', label: 'Mano de Obra', icon: Users,            roles: ['superadmin', 'admin', 'empleado'] as Rol[] },
  { path: '/ventas',       label: 'Ventas',        icon: Receipt,          roles: ['superadmin', 'admin', 'socio'] as Rol[] },
  { path: '/compras',      label: 'Compras',       icon: ShoppingCart,     roles: ['superadmin', 'admin', 'socio'] as Rol[] },
  { path: '/movimientos',  label: 'Movimientos',   icon: ArrowLeftRight,   roles: ['superadmin', 'admin', 'socio'] as Rol[] },
]

const ROL_BADGE: Record<Rol, string> = {
  superadmin: 'bg-purple-900/50 text-purple-300',
  admin:      'bg-blue-900/50 text-blue-300',
  socio:      'bg-accent-900/50 text-accent-300',
  empleado:   'bg-ink-800 text-ink-400',
}

export function Header() {
  const { user, signOut, rol, nombre } = useAuth()
  const navigate    = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const itemsVisibles = navItems.filter((i) => rol && i.roles.includes(rol))
  const puedeSettings = rol === 'superadmin' || rol === 'admin'

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="font-mono text-xl select-none">
              <span className="font-light text-accent-500">/</span>
              <span className="font-medium tracking-tight text-ink-100">root</span>
            </span>
            <div className="hidden h-6 w-px bg-ink-700 sm:block" />
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-tight text-ink-100">Los Limones Creativos</div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500">Sistema de gestión</div>
            </div>
          </NavLink>
        </div>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {itemsVisibles.map(({ path, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-300 hover:bg-ink-800/50 hover:text-ink-100')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User menu desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          {puedeSettings && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn('rounded-md p-2 transition-colors',
                  isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-400 hover:bg-ink-800/50 hover:text-ink-100')
              }
              aria-label="Configuración"
            >
              <SettingsIcon className="h-4 w-4" />
            </NavLink>
          )}
          <div className="hidden xl:flex xl:flex-col xl:items-end max-w-[160px]">
            <span className="truncate text-xs text-ink-300">{nombre || user?.email}</span>
            {rol && (
              <span className={cn('mt-0.5 rounded px-1.5 py-px text-[10px] font-medium', ROL_BADGE[rol])}>
                {rol}
              </span>
            )}
          </div>
          <button onClick={handleSignOut} className="btn-ghost" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Toggle mobile */}
        <button
          className="rounded-md p-2 text-ink-300 hover:bg-ink-800 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="border-t border-ink-800 bg-ink-950 lg:hidden">
          <nav className="mx-auto max-w-7xl px-6 py-3">
            <div className="grid gap-1">
              {itemsVisibles.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-300 hover:bg-ink-800/50')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
              <div className="my-2 border-t border-ink-800" />
              {puedeSettings && (
                <NavLink
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-300 hover:bg-ink-800/50')
                  }
                >
                  <SettingsIcon className="h-4 w-4" />
                  Configuración
                </NavLink>
              )}
              <button
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-ink-300 hover:bg-ink-800/50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
              <div className="px-3 pt-2">
                <p className="text-xs text-ink-300">{nombre || user?.email}</p>
                {rol && <span className={cn('mt-1 inline-block rounded px-1.5 py-px text-[10px] font-medium', ROL_BADGE[rol])}>{rol}</span>}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
