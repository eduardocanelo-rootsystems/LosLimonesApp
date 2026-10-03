import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign, TrendingDown, Clock, CheckCircle, FileText, ShoppingCart,
  Users, FileDown, AlertTriangle, Landmark, CreditCard, Loader2,
  ClipboardList, Star, TrendingUp, Hammer,
} from 'lucide-react'
import { toast } from 'sonner'
import { reloadOnStaleChunk } from '@/lib/chunkReload'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodoSelector, getRangoFechas, type Periodo } from '@/components/shared/PeriodoSelector'
import { useFacturasEmitidas } from '@/hooks/useVentas'
import { useComprasRecibidas } from '@/hooks/useCompras'
import { usePresupuestos } from '@/pages/Presupuestos/usePresupuestos'
import { useRelevamientos } from '@/pages/Relevamientos/useRelevamientos'
import { useContratosResumen } from '@/pages/Contratos/useContrato'
import { diasHastaVencimiento } from '@/lib/utils'
import { useMovimientos, usePresupuestosRentabilidad, useManoObraStats } from '@/hooks/useMovimientos'
import { useCobrosPeriodo, METODOS_COBRO } from '@/hooks/useCobros'
import { useSocios } from '@/hooks/useSocios'
import { esNotaCredito } from '@/lib/arcaParser'
import type { ResumenContadorData } from './ResumenContadorPDF'
import type { Presupuesto } from '@/types/database'

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── KPI card rediseñada ─────────────────────────────────────────────────────

const COLOR_BORDER: Record<string, string> = {
  'text-accent-400':  'border-l-accent-400',
  'text-green-400':   'border-l-green-400',
  'text-amber-400':   'border-l-amber-400',
  'text-red-400':     'border-l-red-400',
  'text-blue-400':    'border-l-blue-400',
  'text-violet-400':  'border-l-violet-400',
  'text-ink-500':     'border-l-ink-700',
  'text-ink-600':     'border-l-ink-700',
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  const borderColor = COLOR_BORDER[color] ?? 'border-l-ink-700'
  return (
    <div className={`rounded-xl border border-ink-700 border-l-2 ${borderColor} bg-ink-900 p-4 hover:bg-ink-800/50 transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-500 truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink-100 tabular-nums leading-none">{value}</p>
          {sub && <p className="mt-1.5 text-xs text-ink-500 leading-tight">{sub}</p>}
        </div>
        <div className={`shrink-0 rounded-lg bg-ink-800 p-2 mt-0.5`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Hero financiero ─────────────────────────────────────────────────────────

function ResultadoHero({ resultado, facturadoNeto, totalCompras, poolNeto }: {
  resultado: number; facturadoNeto: number; totalCompras: number; poolNeto: number
}) {
  return (
    <div className={`mb-6 rounded-xl border p-5 ${resultado >= 0 ? 'border-accent-500/30 bg-gradient-to-br from-accent-500/5 to-ink-900' : 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-ink-900'}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-500">Resultado del período</p>
          <p className={`text-4xl font-bold tabular-nums leading-none ${resultado >= 0 ? 'text-accent-400' : 'text-red-400'}`}>
            ${fmtImporte(resultado)}
          </p>
          <p className="mt-2 text-xs text-ink-500">Facturado neto − compras del negocio</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <div className="text-right">
            <p className="text-xs text-ink-500">Facturado neto</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-ink-200 tabular-nums">${fmtImporte(facturadoNeto)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-500">Compras negocio</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-ink-200 tabular-nums">${fmtImporte(totalCompras)}</p>
          </div>
          {poolNeto !== 0 && (
            <div className="text-right">
              <p className="text-xs text-ink-500">Pool neto servicios</p>
              <p className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${poolNeto >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                ${fmtImporte(poolNeto)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Capital card ─────────────────────────────────────────────────────────────

function CapitalCard({ pct, capital, onChangePct }: {
  pct: number; capital: number; onChangePct: (v: number) => void
}) {
  const [editando, setEditando]   = useState(false)
  const [valorEdit, setValorEdit] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const iniciarEdicion = () => {
    setValorEdit(String(pct))
    setEditando(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const guardar = (valor: string) => {
    const v = parseFloat(valor.replace(',', '.'))
    if (!isNaN(v) && v >= 0 && v <= 100) onChangePct(v)
    setEditando(false)
  }

  return (
    <div className="rounded-xl border border-l-2 border-ink-700 border-l-violet-400 bg-ink-900 p-4 hover:bg-ink-800/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Capital</p>
          <p className="mt-2 text-2xl font-bold text-ink-100 tabular-nums leading-none">${fmtImporte(capital)}</p>
          <div className="mt-1.5 flex items-center gap-1 text-xs text-ink-500">
            {editando ? (
              <>
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
                  className="w-12 rounded border border-violet-500 bg-ink-900 px-1 py-0.5 text-center font-mono text-xs text-ink-100 focus:outline-none"
                />
                <span>% del resultado</span>
              </>
            ) : (
              <button onClick={iniciarEdicion} className="flex items-center gap-1 transition-colors hover:text-ink-300" title="Clic para editar">
                <span className="font-mono text-violet-400">{pct}%</span>
                <span>del resultado</span>
              </button>
            )}
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-ink-800 p-2 mt-0.5">
          <Landmark className="h-4 w-4 text-violet-400" />
        </div>
      </div>
    </div>
  )
}

// ─── Alertas ──────────────────────────────────────────────────────────────────

function ContratosPendientesFirma({
  contratos, presupuestos,
}: {
  contratos:    import('@/pages/Contratos/useContrato').ContratoResumen[]
  presupuestos: Presupuesto[]
}) {
  const pendientes = contratos.filter((c) => !c.firmado_cliente && c.token_firma)
  if (pendientes.length === 0) return null
  const presupuestoMap = new Map(presupuestos.map((p) => [p.id, p]))

  return (
    <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-500/20">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wider text-amber-400">
          {pendientes.length} contrato{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de firma
        </span>
      </div>
      <div className="divide-y divide-amber-500/10">
        {pendientes.map((c) => {
          const p = presupuestoMap.get(c.presupuesto_id)
          return (
            <div key={c.presupuesto_id} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <Link to={`/presupuestos/${c.presupuesto_id}/contrato`} className="font-mono text-xs text-accent-400 hover:underline">
                  {p?.numero ?? '—'}
                </Link>
                <span className="text-sm text-ink-300">
                  {c.nombre_comitente || p?.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}
                </span>
              </div>
              <span className="text-xs text-amber-400">Pendiente de firma</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PresupuestosPorVencer({ presupuestos }: { presupuestos: Presupuesto[] }) {
  const emitidos = presupuestos
    .filter((p) => p.estado === 'emitido')
    .map((p) => ({ ...p, dias: diasHastaVencimiento(p.fecha_creacion) }))
    .filter((p) => p.dias <= 7)
    .sort((a, b) => a.dias - b.dias)

  if (emitidos.length === 0) return null

  return (
    <div className="mb-4 rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800">
        <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
          Presupuestos por vencer (próximos 7 días)
        </span>
      </div>
      <div className="divide-y divide-ink-800">
        {emitidos.map((p) => {
          const vencido = p.dias <= 0
          const urgente = p.dias > 0 && p.dias <= 3
          const colorText = vencido || urgente ? 'text-red-400' : 'text-amber-400'
          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-3">
                <Link to={`/presupuestos/${p.id}`} className="font-mono text-xs text-accent-400 hover:underline">
                  {p.numero ?? '—'}
                </Link>
                <span className="text-sm text-ink-300">{p.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}</span>
              </div>
              <span className={`flex items-center gap-1 font-mono text-xs font-semibold ${colorText}`}>
                {(vencido || urgente) && <AlertTriangle className="h-3 w-3" />}
                {vencido ? 'Vencido' : `${p.dias}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Obras en curso ───────────────────────────────────────────────────────────

function ObrasEnCurso({ presupuestos }: { presupuestos: Presupuesto[] }) {
  const aprobados = presupuestos
    .filter((p) => p.estado === 'aprobado')
    .sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))

  if (aprobados.length === 0) return null

  const total = aprobados.reduce((s, p) => s + ((p as any).importe_total ?? 0), 0)

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-ink-800 p-2">
            <Hammer className="h-4 w-4 text-accent-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Obras en curso — cobro pendiente</p>
            <p className="mt-0.5 text-xl font-bold text-ink-100 tabular-nums">${fmtImporte(total)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-300">{aprobados.length} presupuesto{aprobados.length !== 1 ? 's' : ''}</p>
          <p className="text-xs text-ink-500">aprobados sin cerrar</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[420px]">
          <thead className="bg-ink-800/60 text-xs text-ink-400 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2.5 text-left">N.º</th>
              <th className="px-4 py-2.5 text-left">Cliente</th>
              <th className="px-4 py-2.5 text-right">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {aprobados.map((p) => (
              <tr key={p.id} className="text-ink-300 hover:bg-ink-800/40 transition-colors">
                <td className="px-4 py-2.5">
                  <Link to={`/presupuestos/${p.id}`} className="font-mono text-xs text-accent-400 hover:underline">
                    {p.numero ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-ink-200 text-sm">
                  {p.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold text-ink-100">
                  {(p as any).importe_total ? `$${fmtImporte((p as any).importe_total)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes_actual')
  const rango                 = getRangoFechas(periodo)

  const [capitalPct, setCapitalPctState] = useState<number>(() => {
    const stored = localStorage.getItem('capital_pct')
    return stored !== null ? Number(stored) : 10
  })
  const setCapitalPct = (v: number) => {
    setCapitalPctState(v)
    localStorage.setItem('capital_pct', String(v))
  }

  const { data: facturas           = [] } = useFacturasEmitidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: compras            = [] } = useComprasRecibidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: presupuestos       = [] } = usePresupuestos()
  const { data: contratosResumen   = [] } = useContratosResumen()
  const { data: relevamientos      = [] } = useRelevamientos()
  const { data: movimientos        = [] } = useMovimientos(rango)
  const { data: presupRent         = [] } = usePresupuestosRentabilidad(rango)
  const { data: cobros             = [] } = useCobrosPeriodo(rango)
  const { data: moStats                } = useManoObraStats(rango)
  const { data: socios             = [] } = useSocios()

  // Ventas
  const todasFacturas  = facturas.filter((f) => !esNotaCredito(f.tipo_comprobante))
  const facturasSolo   = todasFacturas.filter((f) => !f.anulada)
  const ncsEmitidas    = facturas.filter((f) =>  esNotaCredito(f.tipo_comprobante))
  const totalFacturado = todasFacturas.reduce((s, f) => s + f.imp_total, 0)
  const totalNcEmitido = ncsEmitidas.reduce((s, f) => s + f.imp_total, 0)
  const totalCobrado   = facturasSolo.filter((f) => f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)
  const pendienteCobro = facturasSolo.filter((f) => !f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)

  // Compras
  const todasCompras   = compras.filter((c) => !esNotaCredito(c.tipo_comprobante) && c.es_negocio)
  const comprasSolo    = todasCompras.filter((c) => !c.anulada)
  const ncsCompras     = compras.filter((c) =>  esNotaCredito(c.tipo_comprobante) && c.es_negocio)
  const totalNcCompras = ncsCompras.reduce((s, c) => s + c.imp_total, 0)
  const totalCompras   = todasCompras.reduce((s, c) => s + c.imp_total, 0) - totalNcCompras

  // Resultado
  const facturadoNeto = totalFacturado - totalNcEmitido
  const resultado     = facturadoNeto - totalCompras
  const capital       = resultado > 0 ? resultado * capitalPct / 100 : 0
  const utilidadNeta  = resultado - capital

  // Presupuestos del período
  const presupPeriodo = presupuestos.filter((p) => {
    const fecha = p.fecha_creacion.slice(0, 10)
    return fecha >= rango.desde && fecha <= rango.hasta
  })
  const presupEmitidos    = presupPeriodo.filter((p) => p.estado === 'emitido').length
  const presupAprobados   = presupPeriodo.filter((p) => p.estado === 'aprobado').length
  const presupFinalizados = presupPeriodo.filter((p) => p.estado === 'finalizado').length
  const presupRechazados  = presupPeriodo.filter((p) => p.estado === 'rechazado').length

  const totalParaConversion = presupEmitidos + presupAprobados + presupFinalizados + presupRechazados
  const tasaConversion = totalParaConversion > 0
    ? ((presupAprobados + presupFinalizados) / totalParaConversion) * 100
    : null

  const montoAprobadoPeriodo = presupPeriodo
    .filter((p) => p.estado === 'aprobado')
    .reduce((s, p) => s + ((p as any).importe_total ?? 0), 0)

  const sinFacturaItems = presupuestos.filter(
    (p) => !p.factura_asociada_id && (p.estado === 'aprobado' || p.estado === 'finalizado')
  )
  const sinFacturaCount = sinFacturaItems.length
  const sinFacturaMonto = sinFacturaItems.reduce((s, p) => s + ((p as any).importe_total ?? 0), 0)

  // Relevamientos
  const hoy       = new Date().toISOString().slice(0, 10)
  const relevHoy  = relevamientos.filter((r) => r.fecha_creacion.slice(0, 10) === hoy).length

  // Rentabilidad promedio
  const aprobadosConRent = presupPeriodo.filter(
    (p) => (p.estado === 'aprobado' || p.estado === 'finalizado') &&
      (p as any).rentabilidad_pct !== null && (p as any).rentabilidad_pct !== undefined
  )
  const rentabilidadPromedio = aprobadosConRent.length > 0
    ? aprobadosConRent.reduce((s, p) => s + Number((p as any).rentabilidad_pct), 0) / aprobadosConRent.length
    : null

  // Pool cobrado
  const poolCobros = cobros.reduce((s, c) => {
    const p = c.presupuesto
    if (!p.importe_servicios || !p.importe_total || p.importe_total === 0) return s
    return s + c.monto * (p.importe_servicios / p.importe_total)
  }, 0)
  const ingresosExtra    = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosGenerales = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const poolNeto         = poolCobros + ingresosExtra - egresosGenerales
  const totalPresupuestado = presupRent.reduce((s, p) => s + (p.importe_servicios ?? 0), 0)
  const totalCobrosBruto   = cobros.reduce((s, c) => s + c.monto, 0)
  const sociosActivos      = socios.filter((s) => s.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  const pdfData = useMemo<ResumenContadorData>(() => ({
    periodo,
    rango,
    totalFacturado,
    totalNcEmitido,
    totalCobrado,
    pendienteCobro,
    nFacturas:   facturasSolo.length,
    nNcs:        ncsEmitidas.length,
    totalCompras,
    nCompras:    comprasSolo.length,
    facturadoNeto,
    resultado,
    poolNeto,
    socios: sociosActivos.map((soc) => {
      const ventaNeta  = soc.cuit
        ? todasFacturas.filter((f) => f.cuit_emisor === soc.cuit).reduce((a, f) => a + f.imp_total, 0)
          - ncsEmitidas.filter((f) => f.cuit_emisor === soc.cuit).reduce((a, f) => a + f.imp_total, 0)
        : 0
      const compraNeta = soc.cuit
        ? todasCompras.filter((c) => c.cuit_receptor === soc.cuit).reduce((a, c) => a + c.imp_total, 0)
          - ncsCompras.filter((c) => c.cuit_receptor === soc.cuit).reduce((a, c) => a + c.imp_total, 0)
        : 0
      const poolBruto = poolNeto * (soc.porcentaje / 100)
      const retiros   = movimientos.filter((m) => m.tipo === 'retiro' && m.socio_id === soc.id).reduce((a, m) => a + m.monto, 0)
      return { id: soc.id, nombre: soc.nombre, cuit: soc.cuit, porcentaje: soc.porcentaje, ventaNeta, compraNeta, poolBruto, retiros, neto: poolBruto - retiros }
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [periodo, rango.desde, rango.hasta, facturas, compras, movimientos, socios])

  const [generandoPDF, setGenerandoPDF] = useState(false)
  const handleExportarPDF = async () => {
    setGenerandoPDF(true)
    try {
      const [{ pdf }, { ResumenContadorPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ResumenContadorPDF'),
      ])
      const blob = await pdf(<ResumenContadorPDF data={pdfData} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resumen-contador-${rango.desde}-${rango.hasta}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      if (!reloadOnStaleChunk(err)) toast.error('Error al generar el PDF.')
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Pulso financiero del período"
        actions={
          <button className="btn-ghost flex items-center gap-2 text-sm" disabled={generandoPDF} onClick={handleExportarPDF}>
            {generandoPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {generandoPDF ? 'Generando…' : 'Exportar PDF'}
          </button>
        }
      />

      <div className="mb-6">
        <PeriodoSelector value={periodo} onChange={(p) => setPeriodo(p)} />
      </div>

      {/* ── Alertas ── */}
      <ContratosPendientesFirma contratos={contratosResumen} presupuestos={presupuestos} />
      <PresupuestosPorVencer presupuestos={presupuestos} />

      {/* ── Hero resultado ── */}
      <ResultadoHero
        resultado={resultado}
        facturadoNeto={facturadoNeto}
        totalCompras={totalCompras}
        poolNeto={poolNeto}
      />

      {/* ── Ventas ── */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Ventas del período</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Facturado"
          value={`$${fmtImporte(totalFacturado)}`}
          sub={`${facturasSolo.length} comprobantes`}
          icon={DollarSign}
          color="text-accent-400"
        />
        <KpiCard
          label="Cobrado"
          value={`$${fmtImporte(totalCobrado)}`}
          sub={`${facturasSolo.filter((f) => f.fecha_cobro).length} facturas`}
          icon={CheckCircle}
          color="text-green-400"
        />
        <KpiCard
          label="Pendiente de cobro"
          value={`$${fmtImporte(pendienteCobro)}`}
          sub={`${facturasSolo.filter((f) => !f.fecha_cobro).length} facturas sin cobrar`}
          icon={Clock}
          color="text-amber-400"
        />
        <KpiCard
          label="NC emitidas"
          value={`$${fmtImporte(totalNcEmitido)}`}
          sub={`${ncsEmitidas.length} notas de crédito`}
          icon={TrendingDown}
          color={totalNcEmitido > 0 ? 'text-red-400' : 'text-ink-500'}
        />
      </div>

      {/* ── Compras / Capital / Utilidad ── */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Costos y distribución</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Compras del negocio"
          value={`$${fmtImporte(totalCompras)}`}
          sub={`${comprasSolo.length} comprobantes`}
          icon={ShoppingCart}
          color="text-blue-400"
        />
        <CapitalCard pct={capitalPct} capital={capital} onChangePct={setCapitalPct} />
        <KpiCard
          label="Utilidad neta"
          value={`$${fmtImporte(utilidadNeta)}`}
          sub={`Resultado − capital ${capitalPct}%`}
          icon={TrendingUp}
          color={utilidadNeta >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      {/* ── Obras en curso ── */}
      <ObrasEnCurso presupuestos={presupuestos} />

      {/* ── Presupuestos del período ── */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Presupuestos del período</p>
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Emitidos"
          value={String(presupEmitidos)}
          sub="pendientes de respuesta"
          icon={FileText}
          color="text-amber-400"
        />
        <KpiCard
          label="Aprobados"
          value={String(presupAprobados)}
          sub={montoAprobadoPeriodo > 0 ? `$${fmtImporte(montoAprobadoPeriodo)}` : 'en ejecución'}
          icon={FileText}
          color="text-accent-400"
        />
        <KpiCard
          label="Finalizados"
          value={String(presupFinalizados)}
          sub="cerrados en el período"
          icon={CheckCircle}
          color="text-green-400"
        />
        <KpiCard
          label="Rechazados"
          value={String(presupRechazados)}
          sub="en el período"
          icon={FileText}
          color={presupRechazados > 0 ? 'text-red-400' : 'text-ink-500'}
        />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3">
        <KpiCard
          label="Tasa de conversión"
          value={tasaConversion !== null ? `${tasaConversion.toFixed(0)}%` : '—'}
          sub={totalParaConversion > 0 ? `${presupAprobados + presupFinalizados} de ${totalParaConversion}` : 'sin datos en el período'}
          icon={CheckCircle}
          color={tasaConversion !== null && tasaConversion >= 50 ? 'text-green-400' : tasaConversion !== null && tasaConversion >= 25 ? 'text-amber-400' : 'text-ink-500'}
        />
        <KpiCard
          label="Sin facturar (global)"
          value={String(sinFacturaCount)}
          sub={sinFacturaMonto > 0 ? `$${fmtImporte(sinFacturaMonto)} pendiente` : 'aprobados o finalizados'}
          icon={FileText}
          color={sinFacturaCount > 0 ? 'text-amber-400' : 'text-ink-500'}
        />
      </div>

      {/* ── Margen comprometido ── */}
      {rentabilidadPromedio !== null && (
        <>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">
            Margen comprometido — aprobados / finalizados
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard
              label="Rentabilidad promedio"
              value={`${rentabilidadPromedio.toFixed(1)}%`}
              sub={`${aprobadosConRent.length} presupuesto${aprobadosConRent.length !== 1 ? 's' : ''}`}
              icon={TrendingUp}
              color={rentabilidadPromedio >= 30 ? 'text-green-400' : rentabilidadPromedio >= 10 ? 'text-amber-400' : 'text-red-400'}
            />
            <KpiCard
              label="Mayor rentabilidad"
              value={`${Math.max(...aprobadosConRent.map((p) => Number((p as any).rentabilidad_pct))).toFixed(1)}%`}
              sub="en el período"
              icon={CheckCircle}
              color="text-accent-400"
            />
            <KpiCard
              label="Menor rentabilidad"
              value={`${Math.min(...aprobadosConRent.map((p) => Number((p as any).rentabilidad_pct))).toFixed(1)}%`}
              sub="en el período"
              icon={AlertTriangle}
              color="text-amber-400"
            />
          </div>
        </>
      )}

      {/* ── Pool cobrado ── */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Pool cobrado — ingresos reales del período</p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard
          label="Presupuestado en servicios"
          value={`$${fmtImporte(totalPresupuestado)}`}
          sub={`${presupRent.length} presupuestos`}
          icon={FileText}
          color="text-accent-400"
        />
        <KpiCard
          label="Cobrado (total cuotas)"
          value={`$${fmtImporte(totalCobrosBruto)}`}
          sub={`${cobros.length} cobros registrados`}
          icon={CheckCircle}
          color="text-green-400"
        />
        <KpiCard
          label="Pool neto servicios"
          value={`$${fmtImporte(poolNeto)}`}
          sub="cobros servicios + ingresos − egresos"
          icon={DollarSign}
          color={poolNeto >= 0 ? 'text-violet-400' : 'text-red-400'}
        />
      </div>

      {/* ── Cobros por método ── */}
      {totalCobrosBruto > 0 && (() => {
        const porMetodo = METODOS_COBRO.map((m) => ({
          label: m.label,
          total: cobros.filter((c) => c.metodo_cobro === m.value).reduce((s, c) => s + c.monto, 0),
        })).filter((m) => m.total > 0)
        const sinMetodo = cobros.filter((c) => !c.metodo_cobro).reduce((s, c) => s + c.monto, 0)
        if (porMetodo.length === 0 && sinMetodo === 0) return null
        return (
          <>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Cobros por método de pago</p>
            <div className="mb-6 rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
              <div className="divide-y divide-ink-800">
                {porMetodo.map((m) => {
                  const pct = totalCobrosBruto > 0 ? (m.total / totalCobrosBruto) * 100 : 0
                  return (
                    <div key={m.label} className="flex items-center gap-4 px-5 py-3">
                      <CreditCard className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                      <span className="flex-1 text-sm text-ink-300">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-28 h-1.5 overflow-hidden rounded-full bg-ink-800">
                          <div className="h-full rounded-full bg-accent-500/60 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-10 text-right font-mono text-xs text-ink-500">{pct.toFixed(1)}%</span>
                        <span className="w-32 text-right font-mono text-sm font-semibold text-green-400">${fmtImporte(m.total)}</span>
                      </div>
                    </div>
                  )
                })}
                {sinMetodo > 0 && (
                  <div className="flex items-center gap-4 px-5 py-3">
                    <CreditCard className="h-3.5 w-3.5 shrink-0 text-ink-600" />
                    <span className="flex-1 text-sm text-ink-500">Sin método registrado</span>
                    <span className="font-mono text-sm text-ink-500">${fmtImporte(sinMetodo)}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })()}

      {/* ── Distribución por socio ── */}
      {sociosActivos.length > 0 && (
        <>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Distribución por socio</p>
            <span className="text-xs text-ink-500">
              Pool neto:&nbsp;
              <span className="font-mono font-semibold text-ink-300">${fmtImporte(poolNeto)}</span>
            </span>
          </div>
          <div className="mb-6 overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead className="bg-ink-800/60 text-xs text-ink-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Socio</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3 text-right">Bruto</th>
                    <th className="px-4 py-3 text-right">Retiros</th>
                    <th className="px-4 py-3 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {sociosActivos.map((socio) => {
                    const bruto   = poolNeto * (socio.porcentaje / 100)
                    const retiros = movimientos
                      .filter((m) => m.tipo === 'retiro' && m.socio_id === socio.id)
                      .reduce((s, m) => s + m.monto, 0)
                    const neto = bruto - retiros
                    return (
                      <tr key={socio.id} className="text-ink-300 hover:bg-ink-800/30 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-ink-500 shrink-0" />
                          {socio.nombre}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink-400">{socio.porcentaje}%</td>
                        <td className="px-4 py-3 text-right font-mono text-accent-400">${fmtImporte(bruto)}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">
                          {retiros > 0 ? `−$${fmtImporte(retiros)}` : '—'}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-semibold ${neto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${fmtImporte(neto)}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="border-t border-ink-700 bg-ink-800/40 text-ink-400">
                    <td className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider" colSpan={2}>Total</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-accent-400/80">
                      ${fmtImporte(sociosActivos.reduce((s, soc) => s + poolNeto * (soc.porcentaje / 100), 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-red-400/80">
                      {(() => {
                        const t = movimientos.filter((m) => m.tipo === 'retiro').reduce((s, m) => s + m.monto, 0)
                        return t > 0 ? `−$${fmtImporte(t)}` : '—'
                      })()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold text-ink-300">
                      {(() => {
                        const totalBruto   = sociosActivos.reduce((s, soc) => s + poolNeto * (soc.porcentaje / 100), 0)
                        const totalRetiros = movimientos.filter((m) => m.tipo === 'retiro').reduce((s, m) => s + m.monto, 0)
                        return `$${fmtImporte(totalBruto - totalRetiros)}`
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Mano de obra ── */}
      {moStats && moStats.byTipo.length > 0 && (
        <>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">
            Mano de obra — distribución por tipo
          </p>
          <div className="mb-6 overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
            <div className="flex flex-wrap gap-6 border-b border-ink-800 px-5 py-4">
              <div>
                <p className="text-xs text-ink-500">Costo total MO</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-ink-100">${fmtImporte(moStats.totalMO)}</p>
              </div>
              {moStats.totalImporte > 0 && (
                <div>
                  <p className="text-xs text-ink-500">% sobre total presupuestado</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-amber-400">
                    {((moStats.totalMO / moStats.totalImporte) * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-ink-500">Presupuestos incluidos</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-ink-300">{moStats.cantPresupuestos}</p>
              </div>
            </div>
            <div className="divide-y divide-ink-800">
              {moStats.byTipo.map((t) => {
                const pct = moStats.totalMO > 0 ? (t.totalCosto / moStats.totalMO) * 100 : 0
                return (
                  <div key={t.tipo} className="px-5 py-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-200">{t.tipo}</span>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs text-ink-500">{t.cantPresupuestos} presup.</span>
                        <span className="font-mono text-sm font-semibold text-ink-100">${fmtImporte(t.totalCosto)}</span>
                        <span className="w-10 text-right font-mono text-xs text-ink-500">{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
                      <div className="h-full rounded-full bg-amber-500/70 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Relevamientos ── */}
      {(relevamientos.length > 0 || relevHoy > 0) && (
        <>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Relevamientos</p>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <KpiCard
              label="En curso"
              value={String(relevamientos.length)}
              sub="pendientes de exportar"
              icon={ClipboardList}
              color="text-accent-400"
            />
            <KpiCard
              label="Creados hoy"
              value={String(relevHoy)}
              sub={new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              icon={Star}
              color={relevHoy > 0 ? 'text-green-400' : 'text-ink-500'}
            />
          </div>
        </>
      )}
    </>
  )
}
