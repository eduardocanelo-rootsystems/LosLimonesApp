import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingDown, Clock, CheckCircle, FileText, ShoppingCart, Users, FileDown, AlertTriangle, Landmark, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { reloadOnStaleChunk } from '@/lib/chunkReload'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodoSelector, getRangoFechas, type Periodo } from '@/components/shared/PeriodoSelector'
import { useFacturasEmitidas } from '@/hooks/useVentas'
import { useComprasRecibidas } from '@/hooks/useCompras'
import { usePresupuestos } from '@/pages/Presupuestos/usePresupuestos'
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

function ContratosPendientesFirma({
  contratos,
  presupuestos,
}: {
  contratos:    import('@/pages/Contratos/useContrato').ContratoResumen[]
  presupuestos: Presupuesto[]
}) {
  const pendientes = contratos.filter((c) => !c.firmado_cliente && c.token_firma)

  if (pendientes.length === 0) return null

  const presupuestoMap = new Map(presupuestos.map((p) => [p.id, p]))

  return (
    <>
      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-500">
        Contratos pendientes de firma del cliente
      </p>
      <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {pendientes.map((c) => {
                const p = presupuestoMap.get(c.presupuesto_id)
                return (
                  <tr key={c.presupuesto_id} className="text-ink-300 hover:bg-ink-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent-400">
                      <Link to={`/presupuestos/${c.presupuesto_id}/contrato`} className="hover:underline">
                        {p?.numero ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-200">
                      {c.nombre_comitente || p?.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-amber-400">Pendiente de firma</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function PresupuestosPorVencer({ presupuestos }: { presupuestos: Presupuesto[] }) {
  const emitidos = presupuestos
    .filter((p) => p.estado === 'emitido')
    .map((p) => ({ ...p, dias: diasHastaVencimiento(p.fecha_creacion) }))
    .sort((a, b) => a.dias - b.dias)

  if (emitidos.length === 0) return null

  return (
    <>
      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-500">
        Seguimiento de presupuestos emitidos
      </p>
      <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">Número</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-right">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {emitidos.map((p) => {
                const vencido   = p.dias <= 0
                const urgente   = p.dias > 0 && p.dias <= 3
                const proximo   = p.dias > 3 && p.dias <= 7
                const etiqueta  = vencido ? 'Vencido' : `${p.dias}d`
                const colorText = vencido || urgente ? 'text-red-400' : proximo ? 'text-amber-400' : 'text-ink-400'
                return (
                  <tr key={p.id} className="text-ink-300 hover:bg-ink-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-accent-400">
                      <Link to={`/presupuestos/${p.id}`} className="hover:underline">
                        {p.numero ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-200">
                      {p.cliente_razon_social || <span className="text-ink-500">Sin cliente</span>}
                    </td>
                    <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${colorText}`}>
                      <span className="flex items-center justify-end gap-1">
                        {(vencido || urgente) && <AlertTriangle className="h-3 w-3" />}
                        {etiqueta}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-400 uppercase tracking-wider">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-2 text-xl font-semibold text-ink-100 sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
    </div>
  )
}

function CapitalCard({ pct, capital, onChangePct }: {
  pct:         number
  capital:     number
  onChangePct: (v: number) => void
}) {
  const [editando,  setEditando]  = useState(false)
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
    <div className="rounded-xl border border-violet-500/30 bg-ink-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-400 uppercase tracking-wider">Capital</span>
        <Landmark className="h-4 w-4 text-violet-400" />
      </div>
      <p className="mt-2 text-xl font-semibold text-ink-100 sm:text-2xl">${fmtImporte(capital)}</p>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
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
          <button
            onClick={iniciarEdicion}
            className="flex items-center gap-1 transition-colors hover:text-ink-300"
            title="Clic para editar el porcentaje"
          >
            <span className="font-mono text-violet-400">{pct}%</span>
            <span>del resultado bruto</span>
          </button>
        )}
      </div>
    </div>
  )
}

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

  const { data: facturas       = [] } = useFacturasEmitidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: compras        = [] } = useComprasRecibidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: presupuestos       = [] } = usePresupuestos()
  const { data: contratosResumen   = [] } = useContratosResumen()
  const { data: movimientos    = [] } = useMovimientos(rango)
  const { data: presupRent     = [] } = usePresupuestosRentabilidad(rango)
  const { data: cobros         = [] } = useCobrosPeriodo(rango)
  const { data: moStats            } = useManoObraStats(rango)
  const { data: socios         = [] } = useSocios()

  // Ventas — todasFacturas incluye las anuladas por NC para evitar doble deducción
  const todasFacturas  = facturas.filter((f) => !esNotaCredito(f.tipo_comprobante))
  const facturasSolo   = todasFacturas.filter((f) => !f.anulada)  // solo activas: cobrado/pendiente/conteos
  const ncsEmitidas    = facturas.filter((f) =>  esNotaCredito(f.tipo_comprobante))
  const totalFacturado = todasFacturas.reduce((s, f) => s + f.imp_total, 0)  // bruto incl. anuladas por NC
  const totalNcEmitido = ncsEmitidas.reduce((s, f) => s + f.imp_total, 0)
  const totalCobrado   = facturasSolo.filter((f) => f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)
  const pendienteCobro = facturasSolo.filter((f) => !f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)

  // Compras — todasCompras incluye anuladas; ncsCompras se resta para dar neto correcto
  const todasCompras   = compras.filter((c) => !esNotaCredito(c.tipo_comprobante) && c.es_negocio)
  const comprasSolo    = todasCompras.filter((c) => !c.anulada)  // solo activas: conteos
  const ncsCompras     = compras.filter((c) =>  esNotaCredito(c.tipo_comprobante) && c.es_negocio)
  const totalNcCompras = ncsCompras.reduce((s, c) => s + c.imp_total, 0)
  const totalCompras   = todasCompras.reduce((s, c) => s + c.imp_total, 0) - totalNcCompras

  // Resultado bruto: facturado neto (- NC) - compras del negocio
  const facturadoNeto = totalFacturado - totalNcEmitido
  const resultado     = facturadoNeto - totalCompras
  const capital       = resultado > 0 ? resultado * capitalPct / 100 : 0
  const utilidadNeta  = resultado - capital

  // Presupuestos del período (client-side)
  const presupPeriodo = presupuestos.filter((p) => {
    const fecha = p.fecha_creacion.slice(0, 10)
    return fecha >= rango.desde && fecha <= rango.hasta
  })
  const presupEmitidos   = presupPeriodo.filter((p) => p.estado === 'emitido').length
  const presupAprobados  = presupPeriodo.filter((p) => p.estado === 'aprobado').length
  const presupFinalizados = presupPeriodo.filter((p) => p.estado === 'finalizado').length
  const sinFactura       = presupPeriodo.filter((p) => !p.factura_asociada_id && p.estado !== 'emitido').length

  // Rentabilidad
  // Pool = sum of (cobro.monto × services_ratio) — only services portion counts as profit
  const poolCobros = cobros.reduce((s, c) => {
    const p = c.presupuesto
    if (!p.importe_servicios || !p.importe_total || p.importe_total === 0) return s
    return s + c.monto * (p.importe_servicios / p.importe_total)
  }, 0)
  const ingresosExtra      = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosGenerales   = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const poolNeto           = poolCobros + ingresosExtra - egresosGenerales
  // Presupuestado = sum of importe_servicios of aprobados/finalizados in period
  const totalPresupuestado = presupRent.reduce((s, p) => s + (p.importe_servicios ?? 0), 0)
  // Cobrado bruto (monto total cobrado, all cuotas in period)
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

  const nombreArchivo = `resumen-contador-${rango.desde}-${rango.hasta}.pdf`

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
      a.download = nombreArchivo
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
        <PeriodoSelector
          value={periodo}
          onChange={(p) => setPeriodo(p)}
        />
      </div>

      {/* Ventas */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Ventas</p>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          sub={`${facturasSolo.filter((f) => !f.fecha_cobro).length} facturas`}
          icon={Clock}
          color="text-amber-400"
        />
        <KpiCard
          label="NC emitidas"
          value={`$${fmtImporte(totalNcEmitido)}`}
          sub={`${ncsEmitidas.length} notas de crédito`}
          icon={TrendingDown}
          color="text-red-400"
        />
      </div>

      {/* Compras y resultado */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Compras y resultado</p>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Compras del negocio"
          value={`$${fmtImporte(totalCompras)}`}
          sub={`${comprasSolo.length} comprobantes`}
          icon={ShoppingCart}
          color="text-blue-400"
        />
        <KpiCard
          label="Facturado neto"
          value={`$${fmtImporte(facturadoNeto)}`}
          sub="Facturado − NC"
          icon={DollarSign}
          color="text-accent-400"
        />
        <CapitalCard
          pct={capitalPct}
          capital={capital}
          onChangePct={setCapitalPct}
        />
        <KpiCard
          label="Utilidad neta"
          value={`$${fmtImporte(utilidadNeta)}`}
          sub={`Resultado − capital ${capitalPct}%`}
          icon={DollarSign}
          color={utilidadNeta >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      {/* Presupuestos */}
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">Presupuestos</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Emitidos"
          value={String(presupEmitidos)}
          sub="en revisión"
          icon={FileText}
          color="text-amber-400"
        />
        <KpiCard
          label="Aprobados"
          value={String(presupAprobados)}
          sub="en ejecución"
          icon={FileText}
          color="text-accent-400"
        />
        <KpiCard
          label="Finalizados"
          value={String(presupFinalizados)}
          sub="cerrados"
          icon={FileText}
          color="text-green-400"
        />
        <KpiCard
          label="Sin facturar"
          value={String(sinFactura)}
          sub="aprobados o finalizados"
          icon={FileText}
          color={sinFactura > 0 ? 'text-amber-400' : 'text-ink-600'}
        />
      </div>

      {/* Contratos pendientes de firma */}
      <ContratosPendientesFirma contratos={contratosResumen} presupuestos={presupuestos} />

      {/* Presupuestos por vencer */}
      <PresupuestosPorVencer presupuestos={presupuestos} />

      {/* Rentabilidad */}
      <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-500">Rentabilidad (presupuestos cobrados)</p>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
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

      {/* Cobros por método de pago */}
      {totalCobrosBruto > 0 && (() => {
        const porMetodo = METODOS_COBRO.map((m) => ({
          label: m.label,
          total: cobros.filter((c) => c.metodo_cobro === m.value).reduce((s, c) => s + c.monto, 0),
        })).filter((m) => m.total > 0)
        const sinMetodo = cobros.filter((c) => !c.metodo_cobro).reduce((s, c) => s + c.monto, 0)
        if (porMetodo.length === 0 && sinMetodo === 0) return null
        return (
          <>
            <p className="mb-3 mt-0 text-xs font-medium uppercase tracking-wider text-ink-500">Cobros por método de pago</p>
            <div className="mb-6 rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
              <div className="divide-y divide-ink-800">
                {porMetodo.map((m) => {
                  const pct = totalCobrosBruto > 0 ? (m.total / totalCobrosBruto) * 100 : 0
                  return (
                    <div key={m.label} className="flex items-center gap-4 px-5 py-3">
                      <CreditCard className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                      <span className="flex-1 text-sm text-ink-300">{m.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-32 h-1.5 overflow-hidden rounded-full bg-ink-800">
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

      {/* Mano de obra por tipo */}
      {moStats && moStats.byTipo.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-500">
            Mano de obra — distribución por tipo
          </p>
          <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
            {/* KPIs de cabecera */}
            <div className="flex flex-wrap gap-6 border-b border-ink-800 px-5 py-4">
              <div>
                <p className="text-xs text-ink-500">Costo total MO</p>
                <p className="mt-0.5 font-mono text-lg font-semibold text-ink-100">
                  ${fmtImporte(moStats.totalMO)}
                </p>
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
                <p className="mt-0.5 font-mono text-lg font-semibold text-ink-300">
                  {moStats.cantPresupuestos}
                </p>
              </div>
            </div>

            {/* Barras por tipo */}
            <div className="divide-y divide-ink-800">
              {moStats.byTipo.map((t) => {
                const pct = moStats.totalMO > 0 ? (t.totalCosto / moStats.totalMO) * 100 : 0
                return (
                  <div key={t.tipo} className="px-5 py-3">
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-200">{t.tipo}</span>
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-xs text-ink-500">
                          {t.cantPresupuestos} presup.
                        </span>
                        <span className="font-mono text-sm font-semibold text-ink-100">
                          ${fmtImporte(t.totalCosto)}
                        </span>
                        <span className="w-10 text-right font-mono text-xs text-ink-500">
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
                      <div
                        className="h-full rounded-full bg-amber-500/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Rentabilidad por socio */}
      {sociosActivos.length > 0 && (
        <>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">Distribución por socio</p>
            <span className="text-xs text-ink-500">
              Pool neto:&nbsp;
              <span className="font-mono font-semibold text-ink-300">${fmtImporte(poolNeto)}</span>
            </span>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
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
                    <tr key={socio.id} className="text-ink-300">
                      <td className="px-4 py-3 flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-ink-500" />
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
                {/* Fila de totales */}
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
    </>
  )
}
