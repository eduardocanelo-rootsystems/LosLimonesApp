import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
import { useCobrosPresupuesto, useRegistrarCobro, useEliminarCobro } from '@/hooks/useCobros'
import type { PlanFinanciamiento } from './SeccionFinanciamiento'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECARGO: Record<NonNullable<PlanFinanciamiento>, number> = {
  contado: 0,
  '60dias': 0.10,
  '90dias': 0.35,
}

function cuotasEsperadas(plan: PlanFinanciamiento, importeTotal: number): { numero: number; monto: number; label: string }[] {
  if (!plan || importeTotal <= 0) return []
  const recargo   = RECARGO[plan]
  const sinRecargo = importeTotal / (1 + recargo)
  const anticipo  = sinRecargo * 0.5
  const saldo     = importeTotal - anticipo

  if (plan === 'contado') {
    return [
      { numero: 1, monto: anticipo, label: 'Anticipo (50%)' },
      { numero: 2, monto: saldo,    label: 'Saldo (50%)'    },
    ]
  }
  const dias = plan === '60dias' ? 60 : 90
  return [
    { numero: 1, monto: anticipo,  label: 'Anticipo (50%)'             },
    { numero: 2, monto: saldo / 2, label: `1ª cuota (a ${dias} días)`  },
    { numero: 3, monto: saldo / 2, label: `2ª cuota (a ${dias * 2} días)` },
  ]
}

// ─── Fila de cuota ────────────────────────────────────────────────────────────

function FilaCuota({
  presupuestoId,
  numero,
  label,
  montoEsperado,
  cobro,
}: {
  presupuestoId: string
  numero:        number
  label:         string
  montoEsperado: number
  cobro?:        { id: string; monto: number; fecha_cobro: string; observacion: string | null }
}) {
  const [abierto,    setAbierto]    = useState(false)
  const [fecha,      setFecha]      = useState(() => new Date().toISOString().slice(0, 10))
  const [monto,      setMonto]      = useState(() => montoEsperado.toFixed(2))
  const [obs,        setObs]        = useState('')
  const registrar  = useRegistrarCobro()
  const eliminar   = useEliminarCobro()
  const guardando  = registrar.isPending || eliminar.isPending

  const handleRegistrar = async () => {
    const v = parseFloat(monto.replace(',', '.'))
    if (isNaN(v) || v <= 0) { toast.error('Ingresá un monto válido.'); return }
    try {
      await registrar.mutateAsync({ presupuesto_id: presupuestoId, numero_cuota: numero, monto: v, fecha_cobro: fecha, observacion: obs || undefined })
      toast.success(`Cuota ${numero} registrada.`)
      setAbierto(false)
    } catch { toast.error('Error al registrar el cobro.') }
  }

  const handleEliminar = async () => {
    if (!cobro) return
    try {
      await eliminar.mutateAsync({ id: cobro.id, presupuestoId: presupuestoId })
      toast.success(`Cobro de cuota ${numero} eliminado.`)
    } catch { toast.error('Error al eliminar el cobro.') }
  }

  const cobrada = !!cobro

  return (
    <div className={cn('rounded-lg border p-4 transition-colors', cobrada ? 'border-green-500/20 bg-green-500/5' : 'border-ink-700 bg-ink-900')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {cobrada
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            : <Circle className="h-4 w-4 shrink-0 text-ink-600" />
          }
          <div>
            <p className={cn('text-sm font-medium', cobrada ? 'text-green-300' : 'text-ink-200')}>{label}</p>
            <p className="font-mono text-xs text-ink-500">
              Esperado: {formatCurrency(montoEsperado)}
              {cobrada && cobro && cobro.monto !== montoEsperado && (
                <span className="ml-2 text-amber-400">Cobrado: {formatCurrency(cobro.monto)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cobrada && cobro && (
            <div className="text-right">
              <p className="font-mono text-sm font-semibold text-green-400">{formatCurrency(cobro.monto)}</p>
              <p className="text-xs text-ink-500">{cobro.fecha_cobro}</p>
            </div>
          )}
          {cobrada ? (
            <button
              type="button"
              onClick={handleEliminar}
              disabled={guardando}
              className="rounded p-1.5 text-ink-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="Anular cobro"
            >
              {guardando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMonto(montoEsperado.toFixed(2)); setAbierto(!abierto) }}
              disabled={guardando}
              className="rounded-md border border-ink-700 px-3 py-1 text-xs font-medium text-ink-400 transition-colors hover:border-accent-500 hover:text-accent-400"
            >
              Registrar cobro
            </button>
          )}
        </div>
      </div>

      {/* Formulario inline */}
      {abierto && !cobrada && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink-700 pt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-500">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-base w-36" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-500">Monto cobrado</label>
            <input
              type="text"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="input-base w-36 text-right font-mono"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs text-ink-500">Observación (opcional)</label>
            <input type="text" value={obs} onChange={(e) => setObs(e.target.value)} className="input-base" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleRegistrar} disabled={guardando} className="btn-primary py-1.5 text-xs">
              {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setAbierto(false)} className="btn-ghost py-1.5 text-xs">Cancelar</button>
          </div>
        </div>
      )}

      {cobrada && cobro?.observacion && (
        <p className="mt-2 text-xs text-ink-500 italic">"{cobro.observacion}"</p>
      )}
    </div>
  )
}

// ─── Sección principal ────────────────────────────────────────────────────────

interface SeccionCobrosProps {
  presupuestoId:    string
  plan:             PlanFinanciamiento
  importeTotal:     number | null
  importeServicios: number | null
}

export function SeccionCobros({ presupuestoId, plan, importeTotal, importeServicios }: SeccionCobrosProps) {
  const { data: cobros = [] } = useCobrosPresupuesto(presupuestoId)

  if (!plan || !importeTotal) {
    return (
      <section className="card p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-400">Cobros</h2>
        <p className="text-sm text-ink-500">Guardá el presupuesto con un plan de financiamiento para registrar cobros.</p>
      </section>
    )
  }

  const cuotas = cuotasEsperadas(plan, importeTotal)
  const totalCobrado = cobros.reduce((s, c) => s + c.monto, 0)
  const pctCobrado   = importeTotal > 0 ? (totalCobrado / importeTotal) * 100 : 0
  const poolCobrado  = importeServicios && importeTotal
    ? cobros.reduce((s, c) => s + c.monto * (importeServicios / importeTotal), 0)
    : 0

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Cobros</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Total presupuestado: <span className="font-mono text-ink-300">{formatCurrency(importeTotal)}</span>
          </p>
        </div>
        {totalCobrado > 0 && (
          <div className="text-right">
            <p className="font-mono text-sm font-semibold text-green-400">{formatCurrency(totalCobrado)}</p>
            <p className="text-xs text-ink-500">{pctCobrado.toFixed(1)}% cobrado</p>
            {importeServicios && (
              <p className="text-xs text-ink-600">Pool servicios: {formatCurrency(poolCobrado)}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {cuotas.map((c) => {
          const cobro = cobros.find((co) => co.numero_cuota === c.numero)
          return (
            <FilaCuota
              key={c.numero}
              presupuestoId={presupuestoId}
              numero={c.numero}
              label={c.label}
              montoEsperado={c.monto}
              cobro={cobro}
            />
          )
        })}
      </div>
    </section>
  )
}
