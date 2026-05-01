import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Link, Loader2, Plus, Search, Unlink } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn, formatDate } from '@/lib/utils'
import type { EstadoPresupuesto, Presupuesto } from '@/types/database'
import { usePresupuestos, useAsociarFacturaPresupuesto } from './usePresupuestos'
import { useFacturasEmitidas, type FacturaEmitida } from '@/hooks/useVentas'
import { esNotaCredito, labelTipo } from '@/lib/arcaParser'
import { SortTh } from '@/components/shared/SortTh'
import { useSort } from '@/hooks/useSort'
import { PeriodoSelector, getRangoFechas, type Periodo, type RangoFechas } from '@/components/shared/PeriodoSelector'

// ─── Asociador de factura ─────────────────────────────────────────────────────

function normCuit(s: string | null | undefined) {
  return (s ?? '').replace(/[-\s]/g, '')
}

function FacturaAsociador({ presupuesto, facturas }: {
  presupuesto: Presupuesto
  facturas:    FacturaEmitida[]
}) {
  const [open, setOpen]   = useState(false)
  const asociar           = useAsociarFacturaPresupuesto()

  if (presupuesto.factura_asociada_id) {
    const fc = facturas.find((f) => f.id === presupuesto.factura_asociada_id)
    return (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <span className="flex items-center gap-1 text-xs text-accent-400">
          <Link className="h-3 w-3" />
          {fc ? `${fc.punto_venta}-${fc.numero}` : '—'}
        </span>
        <button
          onClick={() => asociar.mutate({ presupuestoId: presupuesto.id, facturaId: null })}
          className="text-ink-600 hover:text-red-400 transition-colors"
          title="Desasociar factura"
        >
          <Unlink className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // Candidatas: facturas del mismo cliente (por CUIT receptor)
  const clienteCuit = normCuit(presupuesto.cliente_cuit)
  const adminCuit   = normCuit(presupuesto.cliente_administrador_cuit)
  const candidatas  = facturas.filter((f) => {
    if (esNotaCredito(f.tipo_comprobante) || f.anulada) return false
    const receptor = normCuit(f.cuit_receptor)
    return !clienteCuit || receptor === clienteCuit || receptor === adminCuit
  })

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="text-xs text-ink-500 hover:text-accent-400 transition-colors"
      >
        Sin factura{candidatas.length > 0 ? ` (${candidatas.length})` : ''}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[280px]" onClick={(e) => e.stopPropagation()}>
      {candidatas.length === 0 ? (
        <p className="text-xs text-ink-500">Sin facturas para este cliente</p>
      ) : (
        <select
          className="input py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              asociar.mutate({ presupuestoId: presupuesto.id, facturaId: e.target.value })
              setOpen(false)
            }
          }}
        >
          <option value="">— seleccionar factura —</option>
          {candidatas.map((f) => (
            <option key={f.id} value={f.id}>
              {labelTipo(f.tipo_comprobante)} {f.punto_venta}-{f.numero} · {f.fecha_emision} · ${f.imp_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </option>
          ))}
        </select>
      )}
      <button onClick={() => setOpen(false)} className="text-xs text-ink-500 hover:text-ink-300">Cancelar</button>
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const ESTADO_BADGE: Record<EstadoPresupuesto, string> = {
  emitido: 'badge badge-warning',
  aprobado: 'badge badge-success',
  finalizado: 'badge badge-muted',
}

const ESTADO_LABEL: Record<EstadoPresupuesto, string> = {
  emitido: 'Emitido',
  aprobado: 'Aprobado',
  finalizado: 'Finalizado',
}

export default function PresupuestosPage() {
  const { data: presupuestos = [], isLoading, isError, error } = usePresupuestos()
  const { data: facturas = [] }                                 = useFacturasEmitidas()
  const navigate = useNavigate()

  const [busqueda, setBusqueda]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoPresupuesto | 'todos'>('todos')
  const [periodo, setPeriodo]         = useState<Periodo>('mes_actual')
  const [rango, setRango]             = useState<RangoFechas>(() => getRangoFechas('mes_actual'))

  const { sorted, col, dir, toggle } = useSort(presupuestos as unknown as Record<string, unknown>[])
  const presupuestosSorted = sorted as unknown as Presupuesto[]

  const filtrados = presupuestosSorted.filter((p) => {
    if (filtroEstado !== 'todos' && p.estado !== filtroEstado) return false
    const fecha = p.fecha_creacion.slice(0, 10)
    if (fecha < rango.desde || fecha > rango.hasta) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      return (
        p.numero?.toLowerCase().includes(q) ||
        p.cliente_razon_social?.toLowerCase().includes(q) ||
        false
      )
    }
    return true
  })

  return (
    <>
      <PageHeader
        title="Presupuestos"
        subtitle="Armado y gestión de presupuestos para obras"
        actions={
          <button onClick={() => navigate('/presupuestos/nuevo')} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </button>
        }
      />

      {/* Filtros */}
      <div className="card mb-6 flex flex-col gap-3 p-4">
        <PeriodoSelector
          value={periodo}
          onChange={(p, r) => { setPeriodo(p); setRango(r) }}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="text"
              placeholder="Buscar por número o cliente…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-base pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as EstadoPresupuesto | 'todos')}
              className="input-base sm:w-44"
            >
              <option value="todos">Todos los estados</option>
              <option value="emitido">Emitido</option>
              <option value="aprobado">Aprobado</option>
              <option value="finalizado">Finalizado</option>
            </select>
            <span className="hidden whitespace-nowrap text-xs text-ink-500 sm:inline">
              {filtrados.length} de {presupuestos.length}
            </span>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          Error al cargar presupuestos:{' '}
          {error instanceof Error ? error.message : 'desconocido'}
        </div>
      )}

      {!isLoading && !isError && filtrados.length === 0 && (
        <EmptyState
          icon={FileText}
          title={presupuestos.length === 0 ? 'Sin presupuestos aún' : 'Sin resultados'}
          description={
            presupuestos.length === 0
              ? 'Creá tu primer presupuesto para comenzar.'
              : 'Probá con otros filtros o limpiá la búsqueda.'
          }
        />
      )}

      {!isLoading && !isError && filtrados.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <SortTh label="Número"  field="numero"              activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <SortTh label="Cliente" field="cliente_razon_social" activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <SortTh label="Estado"  field="estado"              activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <SortTh label="Fecha"   field="fecha_creacion"      activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Factura</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filtrados.map((p) => (
                  <PresupuestoRow key={p.id} presupuesto={p} facturas={facturas} onClick={() => navigate(`/presupuestos/${p.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function PresupuestoRow({ presupuesto: p, facturas, onClick }: {
  presupuesto: Presupuesto
  facturas:    FacturaEmitida[]
  onClick:     () => void
}) {
  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-ink-900/30"
      onClick={onClick}
    >
      <td className="px-4 py-3 font-mono text-sm font-medium text-accent-400">
        {p.numero ?? '—'}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-ink-100">
          {p.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}
        </div>
        {p.cliente_direccion && (
          <div className="text-xs text-ink-500">{p.cliente_direccion}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={cn(ESTADO_BADGE[p.estado])}>
          {ESTADO_LABEL[p.estado]}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-ink-400">
        {formatDate(p.fecha_creacion)}
      </td>
      <td className="px-4 py-3">
        <FacturaAsociador presupuesto={p} facturas={facturas} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={(e) => { e.stopPropagation(); onClick() }}
          className="text-xs text-accent-500 hover:text-accent-400 transition-colors"
        >
          Abrir →
        </button>
      </td>
    </tr>
  )
}
