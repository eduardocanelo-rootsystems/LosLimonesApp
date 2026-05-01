import { useState } from 'react'
import { DollarSign, TrendingDown, Clock, CheckCircle, FileText, ShoppingCart, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodoSelector, getRangoFechas, type Periodo } from '@/components/shared/PeriodoSelector'
import { useFacturasEmitidas } from '@/hooks/useVentas'
import { useComprasRecibidas } from '@/hooks/useCompras'
import { usePresupuestos } from '@/pages/Presupuestos/usePresupuestos'
import { useMovimientos, usePresupuestosRentabilidad } from '@/hooks/useMovimientos'
import { useSocios } from '@/hooks/useSocios'
import { esNotaCredito } from '@/lib/arcaParser'

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
      <p className="mt-2 text-2xl font-semibold text-ink-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-500">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>('mes_actual')
  const rango                 = getRangoFechas(periodo)

  const { data: facturas       = [] } = useFacturasEmitidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: compras        = [] } = useComprasRecibidas({ desde: rango.desde, hasta: rango.hasta })
  const { data: presupuestos   = [] } = usePresupuestos()
  const { data: movimientos    = [] } = useMovimientos(rango)
  const { data: presupRent     = [] } = usePresupuestosRentabilidad(rango)
  const { data: socios         = [] } = useSocios()

  // Ventas
  const facturasSolo   = facturas.filter((f) => !esNotaCredito(f.tipo_comprobante) && !f.anulada)
  const ncsEmitidas    = facturas.filter((f) =>  esNotaCredito(f.tipo_comprobante))
  const totalFacturado = facturasSolo.reduce((s, f) => s + f.imp_total, 0)
  const totalNcEmitido = ncsEmitidas.reduce((s, f) => s + f.imp_total, 0)
  const totalCobrado   = facturasSolo.filter((f) => f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)
  const pendienteCobro = facturasSolo.filter((f) => !f.fecha_cobro).reduce((s, f) => s + f.imp_total, 0)

  // Compras
  const comprasSolo   = compras.filter((c) => !esNotaCredito(c.tipo_comprobante) && !c.anulada && c.es_negocio)
  const totalCompras  = comprasSolo.reduce((s, c) => s + c.imp_total, 0)

  // Resultado bruto: facturado neto (- NC) - compras del negocio
  const facturadoNeto = totalFacturado - totalNcEmitido
  const resultado     = facturadoNeto - totalCompras

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
  const totalServicios   = presupRent.reduce((s, p) => s + p.total_servicios, 0)
  const ingresosExtra    = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosGenerales = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const poolNeto         = totalServicios + ingresosExtra - egresosGenerales
  const sociosActivos    = socios.filter((s) => s.activo)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Pulso financiero del período" />

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
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
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
        <KpiCard
          label="Resultado bruto"
          value={`$${fmtImporte(resultado)}`}
          sub="Neto − compras negocio"
          icon={DollarSign}
          color={resultado >= 0 ? 'text-green-400' : 'text-red-400'}
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

      {/* Rentabilidad por socio */}
      {sociosActivos.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wider text-ink-500">Rentabilidad por socio</p>
          <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Socio</th>
                  <th className="px-4 py-3 text-right">%</th>
                  <th className="px-4 py-3 text-right">Pool neto</th>
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
                      <td className="px-4 py-3 text-right font-mono text-ink-400">${fmtImporte(poolNeto)}</td>
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
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
