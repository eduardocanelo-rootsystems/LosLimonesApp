import { useMemo, useRef, useState } from 'react'
import { BarChart2, Loader2, TrendingUp, Users, FlaskConical, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SortTh } from '@/components/shared/SortTh'
import { PeriodoSelector, getRangoFechas, type Periodo, type RangoFechas } from '@/components/shared/PeriodoSelector'
import { useSort } from '@/hooks/useSort'
import { cn } from '@/lib/utils'
import { useRendimientosManoObraData, useActualizarCostoDiario } from './useRendimientosManoObra'
import type { RendimientoManoObra } from './useRendimientosManoObra'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCosto(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtM2(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function diffPct(actual: number | null, base: number | null): number | null {
  if (actual === null || base === null || base === 0) return null
  return ((actual - base) / base) * 100
}

// ─── Fila editable ────────────────────────────────────────────────────────────

function FilaTipo({
  item,
  onActualizar,
}: {
  item:         RendimientoManoObra
  onActualizar: (tipoId: string, costo: number) => Promise<void>
}) {
  const [editando,  setEditando]  = useState(false)
  const [valorEdit, setValorEdit] = useState('')
  const [guardando, setGuardando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const diff = diffPct(item.costo_diario_prom, item.costo_diario_base)

  const iniciarEdicion = () => {
    setValorEdit(
      item.costo_diario_base !== null
        ? fmtCosto(item.costo_diario_base).replace(/\./g, '').replace(',', '.')
        : fmtCosto(item.costo_diario_prom).replace(/\./g, '').replace(',', '.')
    )
    setEditando(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const guardar = async (valor: string) => {
    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) { setEditando(false); return }
    if (!item.tipo_id) { setEditando(false); return }
    setGuardando(true)
    try {
      await onActualizar(item.tipo_id, v)
      toast.success(`Costo diario actualizado para ${item.tipo}.`)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setGuardando(false)
      setEditando(false)
    }
  }

  const aplicarPromedio = async () => {
    if (!item.tipo_id) return
    setGuardando(true)
    try {
      await onActualizar(item.tipo_id, Math.round(item.costo_diario_prom))
      toast.success(`Costo base actualizado a $${fmtCosto(item.costo_diario_prom)} para ${item.tipo}.`)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <tr className="hover:bg-ink-900/30 transition-colors">

      {/* Tipo */}
      <td className="px-4 py-3">
        <div className="font-medium text-ink-100">{item.tipo}</div>
        <div className="text-xs text-ink-500">{item.n_obras} obra{item.n_obras !== 1 ? 's' : ''}</div>
      </td>

      {/* Empleados prom. */}
      <td className="px-4 py-3 text-center font-mono text-sm text-ink-300">
        {item.empleados_promedio.toFixed(1)}
      </td>

      {/* Costo/m² */}
      <td className="px-4 py-3 text-right">
        {item.costo_m2_promedio !== null ? (
          <>
            <span className="font-mono text-sm font-semibold text-accent-400">
              ${fmtM2(item.costo_m2_promedio)}
            </span>
            <span className="ml-1 text-xs text-ink-500">/m²</span>
          </>
        ) : (
          <span className="text-xs text-ink-600">sin m²</span>
        )}
      </td>

      {/* Rango costo/m² */}
      <td className="px-4 py-3 text-right font-mono text-xs text-ink-500">
        {item.costo_m2_min !== null && item.costo_m2_max !== null && item.n_obras > 1
          ? <>${fmtM2(item.costo_m2_min)} – ${fmtM2(item.costo_m2_max)}</>
          : <span className="text-ink-700">—</span>}
      </td>

      {/* Costo diario promedio (histórico) */}
      <td className="px-4 py-3 text-right font-mono text-sm text-ink-300">
        ${fmtCosto(item.costo_diario_prom)}
      </td>

      {/* Costo diario vigente (catálogo) */}
      <td className="px-4 py-3 text-right">
        {editando ? (
          <input
            ref={inputRef}
            type="text"
            value={valorEdit}
            onChange={(e) => setValorEdit(e.target.value)}
            onBlur={() => guardar(valorEdit)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') guardar(valorEdit)
              if (e.key === 'Escape') setEditando(false)
            }}
            className="w-28 rounded border border-accent-500 bg-ink-900 px-2 py-1 text-right font-mono text-sm text-ink-100 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={iniciarEdicion}
            disabled={!item.tipo_id || guardando}
            className={cn(
              'rounded px-2 py-0.5 font-mono text-sm transition-colors',
              item.costo_diario_base !== null
                ? 'text-ink-200 hover:bg-ink-800'
                : 'text-ink-600 hover:bg-ink-800 hover:text-ink-400'
            )}
            title="Clic para editar el costo vigente"
          >
            {item.costo_diario_base !== null ? `$${fmtCosto(item.costo_diario_base)}` : '—'}
          </button>
        )}

        {/* Delta histórico vs catálogo */}
        {diff !== null && !editando && (
          <div className={cn(
            'mt-0.5 text-right text-[10px] font-medium',
            Math.abs(diff) < 5  ? 'text-green-400' :
            Math.abs(diff) < 15 ? 'text-amber-400' : 'text-red-400'
          )}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}% prom. vs vigente
          </div>
        )}
      </td>

      {/* Acción */}
      <td className="px-4 py-3 text-right">
        {item.tipo_id ? (
          <button
            type="button"
            onClick={aplicarPromedio}
            disabled={guardando}
            title="Actualizar el costo vigente al promedio histórico calculado"
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              guardando
                ? 'border-ink-700 text-ink-600'
                : 'border-ink-700 text-ink-400 hover:border-accent-500 hover:text-accent-400'
            )}
          >
            {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : '↑ Aplicar promedio'}
          </button>
        ) : (
          <span className="text-xs text-ink-700">Tipo eliminado</span>
        )}
      </td>
    </tr>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function RendimientosManoObraPage() {
  const [periodo, setPeriodo] = useState<Periodo>('todo')
  const [rango,   setRango]   = useState<RangoFechas>(() => getRangoFechas('todo'))

  const { data, isLoading } = useRendimientosManoObraData(rango)
  const actualizar = useActualizarCostoDiario()

  const [busqueda, setBusqueda] = useState('')

  const tipos        = data?.tipos         ?? []
  const nPresupuestos = data?.n_presupuestos ?? 0

  const filtrados = useMemo(() =>
    busqueda.trim()
      ? tipos.filter((t) => t.tipo.toLowerCase().includes(busqueda.toLowerCase()))
      : tipos,
    [tipos, busqueda]
  )

  const { sorted, col, dir, toggle } = useSort(filtrados as unknown as Record<string, unknown>[])
  const filas = sorted as unknown as RendimientoManoObra[]

  const conBase = tipos.filter((t) => t.costo_diario_base !== null).length
  const sinBase = tipos.filter((t) => t.costo_diario_base === null && t.tipo_id).length

  const handleActualizar = async (tipoId: string, costo: number) => {
    await actualizar.mutateAsync({ tipoId, costo })
  }

  return (
    <>
      <PageHeader
        title="Rendimientos de mano de obra"
        subtitle="Costo de mano de obra por m² de fachada, calculado de presupuestos aprobados y finalizados"
      />

      {/* Info */}
      <div className="mb-6 rounded-xl border border-accent-500/20 bg-accent-500/5 px-5 py-4 text-sm text-ink-300">
        <p>
          El <strong className="text-ink-100">costo/m²</strong> indica cuánto cuesta cada tipo de
          mano de obra por m² de fachada trabajada, calculado como{' '}
          <span className="font-mono text-xs text-accent-400">
            (costo_diario × empleados × días_obra) ÷ m²
          </span>. El{' '}
          <strong className="text-ink-100">costo vigente</strong> es el valor actual en el catálogo
          — hacé clic para editarlo, o usá "↑ Aplicar promedio" para actualizar al histórico.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Tipos analizados',   value: tipos.length,   icon: Users,        color: 'text-accent-400' },
          { label: 'Presupuestos incl.', value: nPresupuestos,   icon: BarChart2,    color: 'text-blue-400'   },
          { label: 'Con costo vigente',  value: conBase,         icon: CheckCircle2, color: 'text-green-400'  },
          { label: 'Sin costo vigente',  value: sinBase,         icon: FlaskConical, color: sinBase > 0 ? 'text-amber-400' : 'text-ink-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-ink-700 bg-ink-900 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-ink-400">{label}</span>
              <Icon className={cn('h-4 w-4', color)} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-ink-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card mb-4 flex flex-col gap-3 p-4">
        <PeriodoSelector
          value={periodo}
          onChange={(p, r) => { setPeriodo(p); setRango(r) }}
        />
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar tipo…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-base max-w-xs"
          />
          <span className="text-xs text-ink-500">{filas.length} de {tipos.length}</span>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      ) : tipos.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin datos aún"
          description="Cuando haya presupuestos aprobados o finalizados con mano de obra y días estimados definidos, aparecerán acá."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <SortTh label="Tipo"              field="tipo"               activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <SortTh label="Empl. prom."       field="empleados_promedio" activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Costo/m² prom."    field="costo_m2_promedio"  activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Rango costo/m²"    field="costo_m2_max"       activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="$ Diario histórico" field="costo_diario_prom"  activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="$ Diario vigente"  field="costo_diario_base"  activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filas.map((item) => (
                  <FilaTipo
                    key={item.tipo_id ?? item.tipo}
                    item={item}
                    onActualizar={handleActualizar}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota al pie */}
      {tipos.length > 0 && (
        <p className="mt-4 text-xs text-ink-600">
          El costo/m² se calcula como: suma(costo_diario × empleados × días) ÷ m² total.
          Sólo incluye presupuestos con días estimados de obra definidos.
          El rango muestra la variación entre obras individuales.
        </p>
      )}
    </>
  )
}
