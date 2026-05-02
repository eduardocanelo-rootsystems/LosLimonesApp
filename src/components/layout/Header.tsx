import { useRef, useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Package, Receipt,
  ChevronDown, Settings as SettingsIcon, LogOut, Menu, X,
  Wrench, Users, ShoppingCart, ArrowLeftRight, TrendingUp, ClipboardList,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Rol } from '@/hooks/useUsuarios'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItem {
  path:  string
  label: string
  icon:  React.ElementType
  roles: Rol[]
}

interface NavGroup {
  label:  string
  icon:   React.ElementType
  roles:  Rol[]
  items:  NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(e: NavEntry): e is NavGroup {
  return 'items' in e
}

// ─── Configuración de navegación ──────────────────────────────────────────────

const NAV: NavEntry[] = [
  {
    path:  '/',
    label: 'Dashboard',
    icon:  LayoutDashboard,
    roles: ['superadmin', 'admin', 'socio'],
  },
  {
    path:  '/presupuestos',
    label: 'Presupuestos',
    icon:  FileText,
    roles: ['superadmin', 'admin', 'socio', 'empleado'],
  },
  {
    path:  '/relevamientos',
    label: 'Relevamientos',
    icon:  ClipboardList,
    roles: ['superadmin', 'admin', 'empleado'],
  },
  {
    label: 'Catálogo',
    icon:  Package,
    roles: ['superadmin', 'admin', 'empleado'],
    items: [
      { path: '/servicios',                 label: 'Servicios',          icon: Wrench,     roles: ['superadmin', 'admin', 'empleado'] },
      { path: '/materiales',                label: 'Materiales',         icon: Package,    roles: ['superadmin', 'admin', 'empleado'] },
      { path: '/materiales/rendimientos',   label: 'Rendimientos mat.',  icon: TrendingUp, roles: ['superadmin', 'admin', 'empleado'] },
      { path: '/mano-de-obra',              label: 'Mano de Obra',       icon: Users,      roles: ['superadmin', 'admin', 'empleado'] },
      { path: '/mano-de-obra/rendimientos', label: 'Rendimientos MO',    icon: TrendingUp, roles: ['superadmin', 'admin', 'empleado'] },
    ],
  },
  {
    label: 'Finanzas',
    icon:  Receipt,
    roles: ['superadmin', 'admin', 'socio'],
    items: [
      { path: '/ventas',      label: 'Ventas',      icon: Receipt,        roles: ['superadmin', 'admin', 'socio'] },
      { path: '/compras',     label: 'Compras',     icon: ShoppingCart,   roles: ['superadmin', 'admin', 'socio'] },
      { path: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight, roles: ['superadmin', 'admin', 'socio'] },
    ],
  },
]

const ROL_BADGE: Record<Rol, string> = {
  superadmin: 'bg-purple-900/50 text-purple-300',
  admin:      'bg-blue-900/50 text-blue-300',
  socio:      'bg-accent-900/50 text-accent-300',
  empleado:   'bg-ink-800 text-ink-400',
}

// ─── Dropdown de grupo ────────────────────────────────────────────────────────

function NavGroupButton({ group, rol }: { group: NavGroup; rol: Rol | null }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()

  const visibles = group.items.filter((i) => rol && i.roles.includes(rol))
  if (!visibles.length) return null

  const isGroupActive = visibles.some((i) => location.pathname.startsWith(i.path))

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isGroupActive
            ? 'bg-ink-800 text-accent-400'
            : 'text-ink-300 hover:bg-ink-800/50 hover:text-ink-100'
        )}
      >
        {group.label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg border border-ink-700 bg-ink-900 py-1 shadow-xl">
          {visibles.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-ink-800 text-accent-400'
                    : 'text-ink-300 hover:bg-ink-800/60 hover:text-ink-100'
                )
              }
            >
              <item.icon className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Logo del cliente ─────────────────────────────────────────────────────────
// Cuando el archivo /logo-cliente.png esté listo, colocarlo en public/
// y se mostrará automáticamente en lugar de las iniciales.

function ClienteLogo() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError]   = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload  = () => setLoaded(true)
    img.onerror = () => setError(true)
    img.src = '/logo-cliente.png'
  }, [])

  if (loaded && !error) {
    return (
      <img
        src="/logo-cliente.png"
        alt="Los Limones Creativos"
        className="h-10 w-10 shrink-0 rounded-lg object-contain"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-limones-lima text-sm font-bold tracking-tight text-limones-carbon">
      LL
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const { user, signOut, rol, nombre } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileGroups, setMobileGroups] = useState<Record<string, boolean>>({})

  const puedeSettings  = rol === 'superadmin' || rol === 'admin'
  const handleSignOut  = () => signOut()

  const toggleMobileGroup = (label: string) =>
    setMobileGroups((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 shrink-0">
          {/* /root block */}
          <div className="flex flex-col leading-none select-none">
            <span className="font-mono text-xl">
              <span className="font-light text-accent-500">/</span>
              <span className="font-medium tracking-tight text-ink-100">root</span>
            </span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-500">
              Systems
            </span>
          </div>

          <div className="hidden h-10 w-px bg-ink-700 sm:block" />

          {/* Client block */}
          <div className="hidden sm:flex items-center gap-2.5">
            <ClienteLogo />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-limones-lima leading-tight">
                Los Limones Creativos
              </span>
              <span className="mt-1 text-[9px] uppercase tracking-wider text-ink-500">
                Trabajos en altura - Fachadas - Impermeabilizaciones
              </span>
            </div>
          </div>
        </NavLink>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((entry) => {
            if (!rol) return null
            if (!entry.roles.includes(rol)) return null

            if (isGroup(entry)) {
              return <NavGroupButton key={entry.label} group={entry} rol={rol} />
            }

            return (
              <NavLink
                key={entry.path}
                to={entry.path}
                end={entry.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-800 text-accent-400'
                      : 'text-ink-300 hover:bg-ink-800/50 hover:text-ink-100'
                  )
                }
              >
                {entry.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User menu desktop */}
        <div className="hidden items-center gap-2 lg:flex shrink-0">
          {puedeSettings && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'rounded-md p-2 transition-colors',
                  isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-400 hover:bg-ink-800/50 hover:text-ink-100'
                )
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
          <button type="button" onClick={handleSignOut} className="btn-ghost" aria-label="Cerrar sesión">
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
            <div className="grid gap-0.5">
              {NAV.map((entry) => {
                if (!rol) return null
                if (!entry.roles.includes(rol)) return null

                if (isGroup(entry)) {
                  const visibles = entry.items.filter((i) => i.roles.includes(rol))
                  if (!visibles.length) return null
                  const expanded = !!mobileGroups[entry.label]

                  return (
                    <div key={entry.label}>
                      <button
                        onClick={() => toggleMobileGroup(entry.label)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-ink-300 hover:bg-ink-800/50 transition-colors"
                      >
                        <span className="flex items-center gap-3">
                          <entry.icon className="h-4 w-4" />
                          {entry.label}
                        </span>
                        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')} />
                      </button>
                      {expanded && (
                        <div className="ml-4 mt-0.5 grid gap-0.5 border-l border-ink-800 pl-3">
                          {visibles.map((item) => (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                  isActive ? 'text-accent-400' : 'text-ink-400 hover:bg-ink-800/50 hover:text-ink-200'
                                )
                              }
                            >
                              <item.icon className="h-3.5 w-3.5" />
                              {item.label}
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <NavLink
                    key={entry.path}
                    to={entry.path}
                    end={entry.path === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-300 hover:bg-ink-800/50'
                      )
                    }
                  >
                    <entry.icon className="h-4 w-4" />
                    {entry.label}
                  </NavLink>
                )
              })}

              <div className="my-2 border-t border-ink-800" />

              {puedeSettings && (
                <NavLink
                  to="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-ink-800 text-accent-400' : 'text-ink-300 hover:bg-ink-800/50'
                    )
                  }
                >
                  <SettingsIcon className="h-4 w-4" />
                  Configuración
                </NavLink>
              )}

              <button
                type="button"
                onClick={() => { setMobileOpen(false); handleSignOut() }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-ink-300 hover:bg-ink-800/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>

              <div className="px-3 pt-2">
                <p className="text-xs text-ink-300">{nombre || user?.email}</p>
                {rol && (
                  <span className={cn('mt-1 inline-block rounded px-1.5 py-px text-[10px] font-medium', ROL_BADGE[rol])}>
                    {rol}
                  </span>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
