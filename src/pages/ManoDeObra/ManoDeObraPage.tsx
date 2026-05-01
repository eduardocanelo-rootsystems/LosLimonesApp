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
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatCurrency } from '@/lib/utils'
import type { ManoDeObraTipoConCosto } from '@/types/database'
import { useManoDeObra, useToggleEstadoTipo } from './useManoDeObra'
import { ManoDeObraFormModal } from './ManoDeObraFormModal'
import { HistorialCostosModal } from './HistorialCostosModal'

type SortField = 'tipo' | 'costo_diario_actual' | 'fecha_actualizacion'
type SortDir = 'asc' | 'desc'
type FiltroEstado = 'todos' | 'activo' | 'inactivo'

export default function ManoDeObraPage() {
  const { data: tipos = [], isLoading, isError, error } = useManoDeObra()
  const toggleEstado = useToggleEstadoTipo()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [sortField, setSortField] = useState<SortField>('tipo')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<ManoDeObraTipoConCosto | null>(null)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [historialTipo, setHistorialTipo] = useState<ManoDeObraTipoConCosto | null>(null)

  const tiposFiltrados = useMemo(() => {
    let r = tipos

    if (filtroEstado !== 'todos') {
      r = r.filter((t) => t.estado === filtroEstado)
    }

    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase()
      r = r.filter((t) => t.tipo.toLowerCase().includes(q))
    }

    r = [...r].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1

      if (sortField === 'tipo') {
        return a.tipo.localeCompare(b.tipo, 'es') * dir
      }
      if (sortField === 'costo_diario_actual') {
        return ((a.costo_diario_actual ?? -1) - (b.costo_diario_actual ?? -1)) * dir
      }
      return (
        (new Date(a.fecha_actualizacion).getTime() -
          new Date(b.fecha_actualizacion).getTime()) *
        dir
      )
    })

    return r
  }, [tipos, busqueda, filtroEstado, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleToggle = async (t: ManoDeObraTipoConCosto) => {
    const nuevoEstado = t.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await toggleEstado.mutateAsync({ id: t.id, estado: nuevoEstado })
      toast.success(nuevoEstado === 'activo' ? 'Tipo activado.' : 'Tipo desactivado.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar estado.'
      toast.error(msg)
    }
  }

  const handleEditar = (t: ManoDeObraTipoConCosto) => {
    setEditando(t)
    setFormOpen(true)
  }

  const handleNuevo = () => {
    setEditando(null)
    setFormOpen(true)
  }

  const handleVerHistorial = (t: ManoDeObraTipoConCosto) => {
    setHistorialTipo(t)
    setHistorialOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Mano de Obra"
        subtitle="Tipos de empleados y costo diario"
        actions={
          <button onClick={handleNuevo} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo tipo
          </button>
        }
      />

      {/* Filtros */}
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Buscar por tipo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
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
            {tiposFiltrados.length} de {tipos.length}
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
          Error al cargar tipos de empleado:{' '}
          {error instanceof Error ? error.message : 'desconocido'}
        </div>
      )}

      {!isLoading && !isError && tiposFiltrados.length === 0 && (
        <EmptyState
          icon={Users}
          title={tipos.length === 0 ? 'Sin tipos de empleado cargados aún' : 'Sin resultados'}
          description={
            tipos.length === 0
              ? 'Empezá creando los tipos de empleados. Por ejemplo: Oficial, Ayudante, Capataz, Especialista.'
              : 'Probá con otros filtros o limpiá la búsqueda.'
          }
        />
      )}

      {!isLoading && !isError && tiposFiltrados.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <SortHeader
                    label="Tipo de empleado"
                    field="tipo"
                    current={sortField}
                    dir={sortDir}
                    onClick={handleSort}
                  />
                  <SortHeader
                    label="Costo diario"
                    field="costo_diario_actual"
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
                {tiposFiltrados.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-ink-900/30">
                    <td className="px-4 py-3 font-medium text-ink-100">{t.tipo}</td>
                    <td className="px-4 py-3 text-right font-mono tabular text-ink-100">
                      {t.costo_diario_actual !== null
                        ? `${formatCurrency(t.costo_diario_actual)} / día`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {t.estado === 'activo' ? (
                        <span className="badge badge-success">Activo</span>
                      ) : (
                        <span className="badge badge-muted">Inactivo</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-400">
                      {new Date(t.fecha_actualizacion).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleVerHistorial(t)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Ver historial de costos"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditar(t)}
                          className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggle(t)}
                          className={cn(
                            'rounded-md p-1.5 transition-colors hover:bg-ink-800',
                            t.estado === 'activo'
                              ? 'text-success hover:text-success'
                              : 'text-ink-500 hover:text-ink-100'
                          )}
                          title={t.estado === 'activo' ? 'Desactivar' : 'Activar'}
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

      <ManoDeObraFormModal open={formOpen} onClose={() => setFormOpen(false)} tipo={editando} />
      <HistorialCostosModal
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        tipo={historialTipo}
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
