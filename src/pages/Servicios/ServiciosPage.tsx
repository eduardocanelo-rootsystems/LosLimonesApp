import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  History,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatCurrency } from '@/lib/utils'
import {
  useServicios,
  useToggleEstadoServicio,
} from './useServicios'
import { ServicioFormModal } from './ServicioFormModal'
import { HistorialPreciosModal } from './HistorialPreciosModal'
import type { ServicioConPrecio } from '@/types/database'

type SortField = 'nombre' | 'precio_m2_actual' | 'fecha_actualizacion'
type SortDir = 'asc' | 'desc'
type FiltroEstado = 'todos' | 'activo' | 'inactivo'

export default function ServiciosPage() {
  const { data: servicios = [], isLoading, isError, error } = useServicios()
  const toggleEstado = useToggleEstadoServicio()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<ServicioConPrecio | null>(null)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialServicio, setHistorialServicio] =
    useState<ServicioConPrecio | null>(null)

  // Filtrado + ordenamiento en cliente (cantidades pequeñas)
  const serviciosFiltrados = useMemo(() => {
    let r = servicios

    if (filtroEstado !== 'todos') {
      r = r.filter((s) => s.estado === filtroEstado)
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      r = r.filter((s) => s.nombre.toLowerCase().includes(q))
    }

    r = [...r].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1

      if (sortField === 'nombre') {
        return a.nombre.localeCompare(b.nombre, 'es') * dir
      }
      if (sortField === 'precio_m2_actual') {
        const va = a.precio_m2_actual ?? -1
        const vb = b.precio_m2_actual ?? -1
        return (va - vb) * dir
      }
      // fecha_actualizacion
      return (
        (new Date(a.fecha_actualizacion).getTime() -
          new Date(b.fecha_actualizacion).getTime()) *
        dir
      )
    })

    return r
  }, [servicios, busqueda, filtroEstado, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleToggle = async (s: ServicioConPrecio) => {
    const nuevoEstado = s.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await toggleEstado.mutateAsync({ id: s.id, estado: nuevoEstado })
      toast.success(
        nuevoEstado === 'activo' ? 'Servicio activado.' : 'Servicio desactivado.'
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado.'
      toast.error(msg)
    }
  }

  const handleEditar = (s: ServicioConPrecio) => {
    setEditando(s)
    setFormOpen(true)
  }

  const handleNuevo = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const handleVerHistorial = (s: ServicioConPrecio) => {
    setHistorialServicio(s)
    setHistorialOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios con precio por m² e historial de cambios"
        actions={
          <button onClick={handleNuevo} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo servicio
          </button>
        }
      />

      {/* Filtros */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            className="input-base sm:w-44"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </select>
          <span className="hidden whitespace-nowrap text-xs text-ink-500 sm:inline">
            {serviciosFiltrados.length} de {servicios.length}
          </span>
        </div>
      </div>

      {/* Estados */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Error al cargar servicios:{' '}
          {error instanceof Error ? error.message : 'desconocido'}
        </div>
      )}

      {!isLoading && !isError && serviciosFiltrados.length === 0 && (
        <EmptyState
          icon={Wrench}
          title={
            servicios.length === 0
              ? 'Sin servicios cargados aún'
              : 'Sin resultados'
          }
          description={
            servicios.length === 0
              ? 'Empezá creando tu primer servicio. Por ejemplo: limpieza de fachada, pintura, reparación de revoque.'
              : 'Probá con otros filtros o limpiá la búsqueda.'
          }
        />
      )}

      {/* Tabla */}
      {!isLoading && !isError && serviciosFiltrados.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <SortHeader
                    label="Nombre"
                    field="nombre"
                    current={sortField}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <SortHeader
                    label="Precio por m²"
                    field="precio_m2_actual"
                    current={sortField}
                    dir={sortDir}
                    onClick={handleSort}
                    align="right"
                  />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                    Estado
                  </th>
                  <SortHeader
                    label="Última modif."
                    field="fecha_actualizacion"
                    current={sortField}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {serviciosFiltrados.map((s) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-ink-900/30"
                  >
                    <td className="px-4 py-3 font-medium text-ink-100">
                      {s.nombre}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular text-ink-100">
                      {s.precio_m2_actual !== null
                        ? formatCurrency(s.precio_m2_actual)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {s.estado === 'activo' ? (
                        <span className="badge badge-success">Activo</span>
                      ) : (
                        <span className="badge badge-muted">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-400">
                      {new Date(s.fecha_actualizacion).toLocaleDateString(
                        'es-AR'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleVerHistorial(s)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Ver historial de precios"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditar(s)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(s)}
                          className={cn(
                            'rounded-md p-1.5 transition-colors hover:bg-ink-800',
                            s.estado === 'activo'
                              ? 'text-success hover:text-success'
                              : 'text-ink-500 hover:text-ink-100'
                          )}
                          title={
                            s.estado === 'activo' ? 'Desactivar' : 'Activar'
                          }
                          disabled={toggleEstado.isPending}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <ServicioFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        servicio={editando}
      />
      <HistorialPreciosModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        servicio={historialServicio}
      />
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string
  field: SortField
  current: SortField
  dir: SortDir
  onClick: (field: SortField) => void
  align?: 'left' | 'right'
}

function SortHeader({
  label,
  field,
  current,
  dir,
  onClick,
  align = 'left',
}: SortHeaderProps) {
  const active = current === field
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink-400',
        align === 'right' ? 'text-right' : 'text-left'
      )}
    >
      <button
        onClick={() => onClick(field)}
        className={cn(
          'inline-flex items-center gap-1.5 transition-colors hover:text-ink-100',
          align === 'right' && 'flex-row-reverse',
          active && 'text-accent-400'
        )}
      >
        {label}
        {!active && <ArrowUpDown className="h-3 w-3 opacity-60" />}
        {active && dir === 'asc' && <ArrowUp className="h-3 w-3" />}
        {active && dir === 'desc' && <ArrowDown className="h-3 w-3" />}
      </button>
    </th>
  )
}
