import { useMemo, useRef, useState } from 'react'
import { BarChart2, Loader2, TrendingUp, Package, FlaskConical, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { SortTh } from '@/components/shared/SortTh'
import { PeriodoSelector, getRangoFechas, type Periodo, type RangoFechas } from '@/components/shared/PeriodoSelector'
import { useSort } from '@/hooks/useSort'
import { cn } from '@/lib/utils'
import { useRendimientosData, useActualizarRendimiento } from './useRendimientos'
import type { RendimientoMaterial } from './useRendimientos'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtR(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  const s = v.toFixed(4)
  return Number(s).toString()
}

function fmtCant(v: number): string {
  return Number(v.toFixed(2)).toLocaleString('es-AR')
}

function diffPct(actual: number | null, base: number | null): number | null {
  if (actual === null || base === null || base === 0) return null
  return ((actual - base) / base) * 100
}

// ─── Fila editable ────────────────────────────────────────────────────────────

function FilaMaterial({
  item,
  onActualizar,
}: {
  item:         RendimientoMaterial
  onActualizar: (materialId: string, rendimiento: number) => Promise<void>
}) {
  const [editando,  setEditando]  = useState(false)
  const [valorEdit, setValorEdit] = useState('')
  const [guardando, setGuardando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const diff = diffPct(item.rendimiento_promedio, item.rendimiento_base)

  const iniciarEdicion = () => {
    setValorEdit(item.rendimiento_base !== null ? fmtR(item.rendimiento_base) : fmtR(item.rendimiento_promedio))
    setEditando(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const guardar = async (valor: string) => {
    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) { setEditando(false); return }
    if (!item.material_id) { setEditando(false); return }
    setGuardando(true)
    try {
      await onActualizar(item.material_id, v)
      toast.success(`Rendimiento base actualizado para ${item.nombre}.`)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setGuardando(false)
      setEditando(false)
    }
  }

  const aplicarPromedio = async () => {
    if (!item.material_id) return
    setGuardando(true)
    try {
      await onActualizar(item.material_id, item.rendimiento_promedio)
      toast.success(`Base actualizada a ${fmtR(item.rendimiento_promedio)} para ${item.nombre}.`)
    } catch {
      toast.error('Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <tr className="hover:bg-ink-900/30 transition-colors">

      {/* Material */}
      <td className="px-4 py-3">
        <div className="font-medium text-ink-100">{item.nombre}</div>
        <div className="text-xs text-ink-500">{item.unidad}</div>
      </td>

      {/* N° obras */}
      <td className="px-4 py-3 text-center font-mono text-sm text-ink-300">
        {item.n_obras}
      </td>

      {/* Cant. total / m² total */}
      <td className="px-4 py-3 text-right font-mono text-xs text-ink-400">
        <div>{fmtCant(item.cantidad_total)} {item.unidad}</div>
        <div className="text-ink-600">{fmtCant(item.m2_total)} m²</div>
      </td>

      {/* Rendimiento promedio */}
      <td className="px-4 py-3 text-right">
        <span className="font-mono text-sm font-semibold text-accent-400">
          {fmtR(item.rendimiento_promedio)}
        </span>
        <span className="ml-1 text-xs text-ink-500">{item.unidad}/m²</span>
      </td>

      {/* Rango (min – max) */}
      <td className="px-4 py-3 text-right font-mono text-xs text-ink-500">
        {item.n_obras > 1
          ? <>{fmtR(item.rendimiento_min)} – {fmtR(item.rendimiento_max)}</>
          : <span className="text-ink-700">—</span>}
      </td>

      {/* Base guardada */}
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
            className="w-24 rounded border border-accent-500 bg-ink-900 px-2 py-1 text-right font-mono text-sm text-ink-100 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={iniciarEdicion}
            disabled={!item.material_id || guardando}
            className={cn(
              'rounded px-2 py-0.5 font-mono text-sm transition-colors',
              item.rendimiento_base !== null
                ? 'text-ink-200 hover:bg-ink-800'
                : 'text-ink-600 hover:bg-ink-800 hover:text-ink-400'
            )}
            title="Clic para editar manualmente"
          >
            {item.rendimiento_base !== null ? fmtR(item.rendimiento_base) : '—'}
          </button>
        )}

        {/* Delta respecto al promedio */}
        {diff !== null && !editando && (
          <div className={cn(
            'mt-0.5 text-right text-[10px] font-medium',
            Math.abs(diff) < 5 ? 'text-green-400' :
            Math.abs(diff) < 15 ? 'text-amber-400' : 'text-red-400'
          )}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs prom.
          </div>
        )}
      </td>

      {/* Acción */}
      <td className="px-4 py-3 text-right">
        {item.material_id ? (
          <button
            type="button"
            onClick={aplicarPromedio}
            disabled={guardando}
            title="Guardar el rendimiento promedio calculado como valor base"
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
          <span className="text-xs text-ink-700">Material eliminado</span>
        )}
      </td>
    </tr>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function RendimientosPage() {
  const [periodo, setPeriodo] = useState<Periodo>('todo')
  const [rango,   setRango]   = useState<RangoFechas>(() => getRangoFechas('todo'))

  const { data, isLoading } = useRendimientosData(rango)
  const actualizar = useActualizarRendimiento()

  const [busqueda, setBusqueda] = useState('')

  const materiales = data?.materiales ?? []
  const nPresupuestos = data?.n_presupuestos ?? 0

  const filtrados = useMemo(() =>
    busqueda.trim()
      ? materiales.filter((m) =>
          m.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
      : materiales,
    [materiales, busqueda]
  )

  const { sorted, col, dir, toggle } = useSort(filtrados as unknown as Record<string, unknown>[])
  const filas = sorted as unknown as RendimientoMaterial[]

  const conBase = materiales.filter((m) => m.rendimiento_base !== null).length
  const sinBase = materiales.filter((m) => m.rendimiento_base === null && m.material_id).length

  const handleActualizar = async (materialId: string, rendimiento: number) => {
    await actualizar.mutateAsync({ materialId, rendimiento })
  }

  return (
    <>
      <PageHeader
        title="Rendimientos de materiales"
        subtitle="Cantidad de material por m² de fachada, calculado de presupuestos aprobados y finalizados"
      />

      {/* Info */}
      <div className="mb-6 rounded-xl border border-accent-500/20 bg-accent-500/5 px-5 py-4 text-sm text-ink-300">
        <p>
          El <strong className="text-ink-100">rendimiento</strong> es cuántas unidades de cada material
          se utilizaron por m² de fachada en obras reales. El <strong className="text-ink-100">rendimiento base</strong> es
          el valor guardado en el catálogo — hacé clic en una celda para editarlo manualmente,
          o usá "↑ Aplicar promedio" para actualizarlo con el histórico calculado.
        </p>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Materiales analizados', value: materiales.length,  icon: Package,      color: 'text-accent-400' },
          { label: 'Presupuestos incluidos', value: nPresupuestos,      icon: BarChart2,    color: 'text-blue-400'   },
          { label: 'Con base guardada',      value: conBase,            icon: CheckCircle2, color: 'text-green-400'  },
          { label: 'Sin base definida',      value: sinBase,            icon: FlaskConical, color: sinBase > 0 ? 'text-amber-400' : 'text-ink-600' },
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
            placeholder="Buscar material…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-base max-w-xs"
          />
          <span className="text-xs text-ink-500">{filas.length} de {materiales.length}</span>
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      ) : materiales.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin datos aún"
          description="Cuando haya presupuestos aprobados o finalizados con materiales y m² definido, aparecerán acá."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <SortTh label="Material"        field="nombre"               activeCol={col as string | null} dir={dir} onToggle={toggle} />
                  <SortTh label="Obras"            field="n_obras"              activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Total usado / m²" field="cantidad_total"       activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Rend. promedio"   field="rendimiento_promedio" activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Rango"            field="rendimiento_max"      activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <SortTh label="Base guardada"    field="rendimiento_base"     activeCol={col as string | null} dir={dir} onToggle={toggle} align="right" />
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filas.map((item) => (
                  <FilaMaterial
                    key={item.material_id ?? item.nombre}
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
      {materiales.length > 0 && (
        <p className="mt-4 text-xs text-ink-600">
          El rendimiento promedio es ponderado por m²: cantidad total usada ÷ m² total trabajado.
          El rango muestra la variación entre obras individuales.
        </p>
      )}
    </>
  )
}
