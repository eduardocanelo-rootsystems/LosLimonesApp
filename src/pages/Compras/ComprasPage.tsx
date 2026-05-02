import { useState } from 'react'
import { Upload, DollarSign, TrendingDown, Building2, Briefcase, X, Link, Unlink, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ImportarExcelModal } from '@/components/shared/ImportarExcelModal'
import { SortTh } from '@/components/shared/SortTh'
import { useSort } from '@/hooks/useSort'
import { PeriodoSelector, getRangoFechas, type Periodo } from '@/components/shared/PeriodoSelector'
import {
  useComprasRecibidas,
  useImportarRecibidas,
  useToggleNegocio,
  useAsociarNcCompra,
  type CompraRecibida,
  type FiltrosCompras,
} from '@/hooks/useCompras'
import { useCuentasArca, type CuentaArca } from '@/hooks/useVentas'
import { useSocios } from '@/hooks/useSocios'
import { labelTipo, esNotaCredito, type FilaRecibida } from '@/lib/arcaParser'
import type { FilaAny, ResultadoImport } from '@/components/shared/ImportarExcelModal'

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(s: string | null) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

// ─── Asociador de NC (compras) ────────────────────────────────────────────────

function NcAsociador({ nc, todas, onAsociar }: {
  nc:       CompraRecibida
  todas:    CompraRecibida[]
  onAsociar: (ncId: string, facturaId: string | null, anteriorId?: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  if (nc.factura_asociada_id) {
    const fc = todas.find((f) => f.id === nc.factura_asociada_id)
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <Link className="h-3 w-3" />
          {fc ? `${fc.punto_venta}-${fc.numero}` : '—'}
        </span>
        <button onClick={() => onAsociar(nc.id, null, nc.factura_asociada_id)} className="text-ink-600 hover:text-red-400 transition-colors" title="Desasociar">
          <Unlink className="h-3 w-3" />
        </button>
      </div>
    )
  }

  const candidatas = todas.filter((f) =>
    !esNotaCredito(f.tipo_comprobante) &&
    Math.abs(f.imp_total - nc.imp_total) < 0.01 &&
    f.fecha_emision <= nc.fecha_emision &&
    !f.anulada
  )

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-amber-500 hover:text-amber-300 transition-colors">
        Sin asociar{candidatas.length > 0 ? ` (${candidatas.length})` : ' — sin candidatas'}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[260px]">
      {candidatas.length === 0 ? (
        <p className="text-xs text-ink-500">Sin facturas candidatas con igual importe y fecha ≤ NC</p>
      ) : (
        <select className="input py-1 text-xs" defaultValue=""
          onChange={(e) => { if (e.target.value) { onAsociar(nc.id, e.target.value, null); setOpen(false) } }}>
          <option value="">— seleccionar factura —</option>
          {candidatas.map((f) => (
            <option key={f.id} value={f.id}>
              {labelTipo(f.tipo_comprobante)} {f.punto_venta}-{f.numero} · {f.fecha_emision} · ${f.imp_total.toFixed(2)}
            </option>
          ))}
        </select>
      )}
      <button onClick={() => setOpen(false)} className="text-xs text-ink-500 hover:text-ink-300">Cancelar</button>
    </div>
  )
}

// ─── Toggle negocio: default=true, el usuario marca las que NO aplican ────────

function NegocioToggle({ compra }: { compra: CompraRecibida }) {
  const toggle = useToggleNegocio()
  if (esNotaCredito(compra.tipo_comprobante)) return <span className="text-xs text-ink-600">—</span>

  if (compra.es_negocio) {
    // Aplica al negocio (default) — click para excluir
    return (
      <button
        onClick={() => toggle.mutate({ id: compra.id, es_negocio: false })}
        disabled={toggle.isPending}
        title="Click para excluir del negocio"
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-accent-900/40 text-accent-400 hover:bg-red-950/40 hover:text-red-400 transition-colors group"
      >
        <Briefcase className="h-3 w-3" />
        <span className="group-hover:hidden">Negocio</span>
        <span className="hidden group-hover:inline">Excluir</span>
      </button>
    )
  }

  // No aplica al negocio — click para reincluir
  return (
    <button
      onClick={() => toggle.mutate({ id: compra.id, es_negocio: true })}
      disabled={toggle.isPending}
      title="Click para incluir en el negocio"
      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-ink-800 text-ink-500 hover:bg-accent-900/40 hover:text-accent-400 transition-colors"
    >
      <X className="h-3 w-3" />
      Personal
    </button>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComprasPage() {
  const [modalOpen, setModalOpen]     = useState(false)
  const [periodo, setPeriodo]         = useState<Periodo>('mes_actual')
  const [filtros, setFiltros]         = useState<FiltrosCompras>(() => getRangoFechas('mes_actual'))
  const [soloNegocio, setSoloNegocio] = useState(false)

  const { data: cuentas = [] }            = useCuentasArca()
  const { data: compras = [], isLoading, isError, error } = useComprasRecibidas(filtros)
  const { data: socios  = [] }            = useSocios()
  const importar                          = useImportarRecibidas()
  const asociarNc                         = useAsociarNcCompra()

  const comprasFiltradas = soloNegocio ? compras.filter((c) => c.es_negocio || esNotaCredito(c.tipo_comprobante)) : compras

  const { sorted, col, dir, toggle } = useSort(comprasFiltradas as unknown as Record<string, unknown>[])
  const filasMostradas = sorted as unknown as CompraRecibida[]

  const facturasSolo  = compras.filter((c) => !esNotaCredito(c.tipo_comprobante))
  const ncs           = compras.filter((c) =>  esNotaCredito(c.tipo_comprobante))
  const totalComprado = facturasSolo.reduce((s, c) => s + c.imp_total, 0)
  const totalNC       = ncs.reduce((s, c) => s + c.imp_total, 0)
  const totalNegocio  = facturasSolo.filter((c) => c.es_negocio).reduce((s, c) => s + c.imp_total, 0)
  const proveedores   = new Set(compras.map((c) => c.cuit_emisor).filter(Boolean)).size

  async function handleImportar(filas: FilaAny[], cuenta: CuentaArca, cuitDelExcel: string): Promise<ResultadoImport> {
    const result = await importar.mutateAsync({ filas: filas as FilaRecibida[], cuitReceptor: cuitDelExcel, cuentaArcaId: cuenta.id })
    return { autoMatch: result.autoMatch }
  }

  function handleAsociarNc(ncId: string, facturaId: string | null, anteriorId?: string | null) {
    asociarNc.mutate({ ncId, facturaId, facturaAnteriorId: anteriorId })
  }

  const sortProps = { activeCol: col as string | null, dir, onToggle: toggle }

  return (
    <>
      <PageHeader
        title="Compras"
        subtitle="Comprobantes recibidos · ARCA"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Excel
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total compras"  value={`$${fmtImporte(totalComprado)}`} sub={`${facturasSolo.length} comprobantes`}                           icon={DollarSign}  color="text-accent-400" />
        <KpiCard label="Notas crédito"  value={`$${fmtImporte(totalNC)}`}       sub={`${ncs.length} NC · ${ncs.filter((n) => !n.factura_asociada_id).length} sin asociar`} icon={TrendingDown} color="text-amber-400" />
        <KpiCard label="Del negocio"    value={`$${fmtImporte(totalNegocio)}`}  sub={`${facturasSolo.filter((c) => c.es_negocio).length} marcadas`}   icon={Briefcase}   color="text-accent-400" />
        <KpiCard label="Proveedores"    value={String(proveedores)}             sub="distintos"                                                        icon={Building2}   color="text-blue-400" />
      </div>

      {/* Compras por socio */}
      {socios.some((s) => s.activo) && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-500">Compras por socio</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {socios.filter((s) => s.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((s) => {
              const total   = s.cuit ? facturasSolo.filter((c) => c.cuit_receptor === s.cuit && c.es_negocio).reduce((acc, c) => acc + c.imp_total, 0) : 0
              const ncsocio = s.cuit ? ncs.filter((c) => c.cuit_receptor === s.cuit).reduce((acc, c) => acc + c.imp_total, 0) : 0
              return (
                <div key={s.id} className="rounded-xl border border-ink-700 bg-ink-900 p-4">
                  <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-2">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.nombre}</span>
                  </div>
                  {s.cuit
                    ? <>
                        <p className="text-lg font-semibold text-red-400">−${fmtImporte(total - ncsocio)}</p>
                        {ncsocio > 0 && <p className="text-xs text-ink-500 mt-0.5">NC: +${fmtImporte(ncsocio)}</p>}
                      </>
                    : <p className="text-xs text-ink-600 italic">Sin CUIT configurado</p>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PeriodoSelector
          value={periodo}
          onChange={(p, rango) => { setPeriodo(p); setFiltros((f) => ({ ...f, desde: rango.desde, hasta: rango.hasta })) }}
        />
        {cuentas.length > 1 && (
          <select className="input w-auto" value={filtros.cuenta_arca_id ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, cuenta_arca_id: e.target.value || undefined }))}>
            <option value="">Todas las cuentas</option>
            {cuentas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-ink-400 cursor-pointer">
          <input type="checkbox" className="rounded" checked={soloNegocio} onChange={(e) => setSoloNegocio(e.target.checked)} />
          Solo negocio
        </label>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
        {isLoading ? (
          <p className="px-6 py-10 text-center text-sm text-ink-500">Cargando…</p>
        ) : isError ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-red-400">Error al cargar compras:</p>
            <p className="mt-1 font-mono text-xs text-red-300">{String(error)}</p>
          </div>
        ) : comprasFiltradas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-ink-400">No hay comprobantes. Importá un Excel de ARCA para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-800">
                <tr>
                  <SortTh label="Fecha"         field="fecha_emision"    {...sortProps} />
                  <SortTh label="Tipo"          field="tipo_comprobante" {...sortProps} />
                  <SortTh label="Número"        field="numero"           {...sortProps} />
                  <SortTh label="CUIT Receptor" field="cuit_receptor"    {...sortProps} />
                  <SortTh label="Proveedor"     field="denominacion"     {...sortProps} />
                  <SortTh label="Importe"       field="imp_total"        {...sortProps} align="right" />
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-ink-400">Aplica a</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filasMostradas.map((c: CompraRecibida) => {
                  const isNC = esNotaCredito(c.tipo_comprobante)
                  return (
                    <tr key={c.id} className={
                      isNC      ? 'bg-amber-950/10 text-amber-300/80' :
                      c.anulada ? 'bg-red-950/10 opacity-60 text-ink-500' :
                                  'text-ink-300 hover:bg-ink-800/40'
                    }>
                      <td className="px-4 py-3 font-mono text-xs">{fmtFecha(c.fecha_emision)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${isNC ? 'bg-amber-900/40 text-amber-300' : c.anulada ? 'bg-red-900/30 text-red-400' : 'bg-ink-800 text-ink-300'}`}>
                          {labelTipo(c.tipo_comprobante)}
                          {c.anulada && !isNC && <span className="ml-1">✕</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{c.punto_venta}-{c.numero}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-400">{c.cuit_receptor}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="truncate">{c.denominacion ?? '—'}</div>
                        {c.cuit_emisor && <div className="text-xs text-ink-500 font-mono">{c.cuit_emisor}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{isNC ? '−' : ''}${fmtImporte(c.imp_total)}</td>
                      <td className="px-4 py-3">
                        {isNC ? (
                          <NcAsociador nc={c} todas={compras} onAsociar={handleAsociarNc} />
                        ) : c.anulada ? (
                          <span className="text-xs text-red-400/60">Anulada por NC</span>
                        ) : (
                          <NegocioToggle compra={c} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ImportarExcelModal tipo="recibidos" cuentas={cuentas} onImportar={handleImportar} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
