import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  History,
  Loader2,
  Package,
  Pencil,
  Plus,
  Power,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatCurrency } from '@/lib/utils'
import type { MaterialConPrecio } from '@/types/database'
import { useMateriales, useToggleEstadoMaterial } from './useMateriales'
import { useUnidades } from './useUnidades'
import { MaterialFormModal } from './MaterialFormModal'
import { HistorialPreciosMaterialModal } from './HistorialPreciosMaterialModal'

type SortField = 'nombre' | 'precio_actual' | 'unidad' | 'fecha_actualizacion'
type SortDir = 'asc' | 'desc'
type FiltroEstado = 'todos' | 'activo' | 'inactivo'

export default function MaterialesPage() {
  const { data: materiales = [], isLoading, isError, error } = useMateriales()
  const { data: unidades = [] } = useUnidades()
  const toggleEstado = useToggleEstadoMaterial()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroUnidad, setFiltroUnidad] = useState<string>('todos')
  const [sortField, setSortField] = useState<SortField>('nombre')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<MaterialConPrecio | null>(null)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialMaterial, setHistorialMaterial] = useState<MaterialConPrecio | null>(null)

  const materialesFiltrados = useMemo(() => {
    let r = materiales

    if (filtroEstado !== 'todos') {
      r = r.filter((m) => m.estado === filtroEstado)
    }

    if (filtroUnidad !== 'todos') {
      r = r.filter((m) => m.unidad === filtroUnidad)
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      r = r.filter((m) => m.nombre.toLowerCase().includes(q))
    }

    r = [...r].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1

      if (sortField === 'nombre') {
        return a.nombre.localeCompare(b.nombre, 'es') * dir
      }
      if (sortField === 'precio_actual') {
        return ((a.precio_actual ?? -1) - (b.precio_actual ?? -1)) * dir
      }
      if (sortField === 'unidad') {
        return a.unidad.localeCompare(b.unidad, 'es') * dir
      }
      return (
        (new Date(a.fecha_actualizacion).getTime() -
          new Date(b.fecha_actualizacion).getTime()) *
        dir
      )
    })

    return r
  }, [materiales, busqueda, filtroEstado, filtroUnidad, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleToggle = async (m: MaterialConPrecio) => {
    const nuevoEstado = m.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await toggleEstado.mutateAsync({ id: m.id, estado: nuevoEstado })
      toast.success(nuevoEstado === 'activo' ? 'Material activado.' : 'Material desactivado.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado.'
      toast.error(msg)
    }
  }

  const handleEditar = (m: MaterialConPrecio) => {
    setEditando(m)
    setFormOpen(true)
  }

  const handleNuevo = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const handleVerHistorial = (m: MaterialConPrecio) => {
    setHistorialMaterial(m)
    setHistorialOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Materiales"
        subtitle="Catálogo de materiales con historial de precios"
        actions={
          <button onClick={handleNuevo} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo material
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
            value={filtroUnidad}
            onChange={(e) => setFiltroUnidad(e.target.value)}
            className="input-base sm:w-36"
          >
            <option value="todos">Todas las unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.nombre}>
                {u.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
            className="input-base sm:w-44"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Solo activos</option>
            <option value="inactivo">Solo inactivos</option>
          </select>
          <span className="hidden whitespace-nowrap text-xs text-ink-500 sm:inline">
            {materialesFiltrados.length} de {materiales.length}
          </span>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Error al cargar materiales:{' '}
          {error instanceof Error ? error.message : 'desconocido'}
        </div>
      )}

      {!isLoading && !isError && materialesFiltrados.length === 0 && (
        <EmptyState
          icon={Package}
          title={materiales.length === 0 ? 'Sin materiales cargados aún' : 'Sin resultados'}
          description={
            materiales.length === 0
              ? 'Empezá creando tu primer material. Por ejemplo: pintura látex, membrana, sellador.'
              : 'Probá con otros filtros o limpiá la búsqueda.'
          }
        />
      )}

      {!isLoading && !isError && materialesFiltrados.length > 0 && (
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
                    label="Unidad"
                    field="unidad"
                    current={sortField}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <SortHeader
                    label="Precio"
                    field="precio_actual"
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
                {materialesFiltrados.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-ink-900/30">
                    <td className="px-4 py-3 font-medium text-ink-100">{m.nombre}</td>
                    <td className="px-4 py-3 text-ink-300">{m.unidad}</td>
                    <td className="px-4 py-3 text-right font-mono tabular text-ink-100">
                      {m.precio_actual !== null ? formatCurrency(m.precio_actual) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {m.estado === 'activo' ? (
                        <span className="badge badge-success">Activo</span>
                      ) : (
                        <span className="badge badge-muted">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-400">
                      {new Date(m.fecha_actualizacion).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleVerHistorial(m)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Ver historial de precios"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditar(m)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(m)}
                          className={cn(
                            'rounded-md p-1.5 transition-colors hover:bg-ink-800',
                            m.estado === 'activo'
                              ? 'text-success hover:text-success'
                              : 'text-ink-500 hover:text-ink-100'
                          )}
                          title={m.estado === 'activo' ? 'Desactivar' : 'Activar'}
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

      <MaterialFormModal open={formOpen} onClose={() => setFormOpen(false)} material={editando} />
      <HistorialPreciosMaterialModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        material={historialMaterial}
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

function SortHeader({ label, field, current, dir, onClick, align = 'left' }: SortHeaderProps) {
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
