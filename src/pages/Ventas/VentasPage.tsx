import { useState } from 'react'
import { Upload, DollarSign, Clock, CheckCircle, TrendingDown, Link, Unlink, Wand2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ImportarExcelModal } from '@/components/shared/ImportarExcelModal'
import { SortTh } from '@/components/shared/SortTh'
import { useSort } from '@/hooks/useSort'
import { PeriodoSelector, getRangoFechas, type Periodo } from '@/components/shared/PeriodoSelector'
import {
  useFacturasEmitidas,
  useCuentasArca,
  useImportarEmitidas,
  useActualizarCobranza,
  useAsociarNcEmitida,
  type FacturaEmitida,
  type FiltrosVentas,
  type CuentaArca,
} from '@/hooks/useVentas'
import { labelTipo, esNotaCredito, type FilaEmitida } from '@/lib/arcaParser'
import type { FilaAny, ResultadoImport } from '@/components/shared/ImportarExcelModal'

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(s: string | null) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

// ─── Asociador de NC ──────────────────────────────────────────────────────────

function NcAsociador({ nc, todas, onAsociar }: {
  nc:       FacturaEmitida
  todas:    FacturaEmitida[]
  onAsociar: (ncId: string, facturaId: string | null, anteriorId?: string | null) => void
}) {
  const [open, setOpen] = useState(false)

  // NC ya asociada
  if (nc.factura_asociada_id) {
    const fc = todas.find((f) => f.id === nc.factura_asociada_id)
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <Link className="h-3 w-3" />
          {fc ? `${fc.punto_venta}-${fc.numero}` : '—'}
        </span>
        <button
          onClick={() => onAsociar(nc.id, null, nc.factura_asociada_id)}
          className="text-ink-600 hover:text-red-400 transition-colors"
          title="Desasociar"
        >
          <Unlink className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // Candidatas: mismo importe, fecha ≤ NC, no anulada, no NC
  const candidatas = todas.filter((f) =>
    !esNotaCredito(f.tipo_comprobante) &&
    Math.abs(f.imp_total - nc.imp_total) < 0.01 &&
    f.fecha_emision <= nc.fecha_emision &&
    !f.anulada
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-amber-500 hover:text-amber-300 transition-colors"
      >
        Sin asociar{candidatas.length > 0 ? ` (${candidatas.length})` : ' — sin candidatas'}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[260px]">
      {candidatas.length === 0 ? (
        <p className="text-xs text-ink-500">Sin facturas candidatas con igual importe y fecha ≤ NC</p>
      ) : (
        <select
          className="input py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) { onAsociar(nc.id, e.target.value, null); setOpen(false) }
          }}
        >
          <option value="">— seleccionar factura —</option>
          {candidatas.map((f) => (
            <option key={f.id} value={f.id}>
              {labelTipo(f.tipo_comprobante)} {f.punto_venta}-{f.numero} · {fmtFecha(f.fecha_emision)} · ${fmtImporte(f.imp_total)}
            </option>
          ))}
        </select>
      )}
      <button onClick={() => setOpen(false)} className="text-xs text-ink-500 hover:text-ink-300">Cancelar</button>
    </div>
  )
}

// ─── Cobranza editor ──────────────────────────────────────────────────────────

function CobranzaEditor({ factura, onGuardar, guardando }: {
  factura:   FacturaEmitida
  onGuardar: (f: { fecha_cobro: string | null; forma_pago: string | null; nro_comprobante: string | null }) => void
  guardando: boolean
}) {
  const [fecha, setFecha] = useState(factura.fecha_cobro ?? '')
  const [forma, setForma] = useState(factura.forma_pago ?? '')
  const [nro,   setNro]   = useState(factura.nro_comprobante ?? '')
  const [open,  setOpen]  = useState(false)

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-ink-500 hover:text-accent-400 transition-colors">
        {factura.fecha_cobro ? fmtFecha(factura.fecha_cobro) : 'Registrar cobro'}
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 min-w-[220px]">
      <input type="date" className="input py-1 text-xs" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      <input type="text" className="input py-1 text-xs" value={forma} onChange={(e) => setForma(e.target.value)} placeholder="Forma de pago" />
      <input type="text" className="input py-1 text-xs" value={nro}   onChange={(e) => setNro(e.target.value)}   placeholder="Nro. comprobante" />
      <div className="flex gap-2">
        <button disabled={guardando} onClick={() => { onGuardar({ fecha_cobro: fecha || null, forma_pago: forma || null, nro_comprobante: nro || null }); setOpen(false) }} className="btn-primary py-1 text-xs flex-1">
          {guardando ? '…' : 'Guardar'}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost py-1 text-xs">✕</button>
      </div>
    </div>
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

export default function VentasPage() {
  const [modalOpen, setModalOpen]     = useState(false)
  const [periodo, setPeriodo]         = useState<Periodo>('mes_actual')
  const [filtros, setFiltros]         = useState<FiltrosVentas>(() => getRangoFechas('mes_actual'))
  const [guardandoId, setGuardandoId] = useState<string | null>(null)
  const [autoAsociando, setAutoAsociando] = useState(false)
  const [ultimoMatch, setUltimoMatch]     = useState<number | null>(null)

  const { data: cuentas = [] }             = useCuentasArca()
  const { data: facturas = [], isLoading } = useFacturasEmitidas(filtros)
  const importar           = useImportarEmitidas()
  const actualizarCobranza = useActualizarCobranza()
  const asociarNc          = useAsociarNcEmitida()

  const { sorted, col, dir, toggle } = useSort(facturas as unknown as Record<string, unknown>[])
  const filasMostradas = sorted as unknown as FacturaEmitida[]

  const facturasSolo   = facturas.filter((f) => !esNotaCredito(f.tipo_comprobante))
  const ncs            = facturas.filter((f) =>  esNotaCredito(f.tipo_comprobante))
  const totalFacturado = facturasSolo.reduce((s, f) => s + f.imp_total, 0)
  const totalNC        = ncs.reduce((s, f) => s + f.imp_total, 0)
  const totalCobrado   = facturasSolo.filter((f) => f.fecha_cobro && !f.anulada).reduce((s, f) => s + f.imp_total, 0)
  const totalPendiente = totalFacturado - totalNC - totalCobrado

  async function handleImportar(filas: FilaAny[], cuenta: CuentaArca, cuitDelExcel: string): Promise<ResultadoImport> {
    const result = await importar.mutateAsync({ filas: filas as FilaEmitida[], cuitEmisor: cuitDelExcel, cuentaArcaId: cuenta.id })
    return { autoMatch: result.autoMatch }
  }

  async function handleCobranza(id: string, fields: { fecha_cobro: string | null; forma_pago: string | null; nro_comprobante: string | null }) {
    setGuardandoId(id)
    try { await actualizarCobranza.mutateAsync({ id, ...fields }) }
    finally { setGuardandoId(null) }
  }

  function handleAsociarNc(ncId: string, facturaId: string | null, anteriorId?: string | null) {
    asociarNc.mutate({ ncId, facturaId, facturaAnteriorId: anteriorId })
  }

  // Corre el auto-match sobre los datos ya cargados (sirve para datos históricos)
  async function handleAutoAsociar() {
    const ncsLibres   = facturas.filter((f) => esNotaCredito(f.tipo_comprobante) && !f.factura_asociada_id)
    const candidatosPool = facturas.filter((f) => !esNotaCredito(f.tipo_comprobante) && !f.anulada)
    const usadas = new Set<string>()
    const pares: Array<{ ncId: string; facturaId: string }> = []

    for (const nc of ncsLibres) {
      const candidatas = candidatosPool.filter((f) =>
        !usadas.has(f.id) &&
        f.cuit_emisor === nc.cuit_emisor &&
        Math.abs(f.imp_total - nc.imp_total) < 0.01 &&
        f.fecha_emision <= nc.fecha_emision
      )
      if (candidatas.length === 1) {
        pares.push({ ncId: nc.id, facturaId: candidatas[0].id })
        usadas.add(candidatas[0].id)
      }
    }

    if (pares.length === 0) {
      setUltimoMatch(0)
      return
    }

    setAutoAsociando(true)
    try {
      for (const { ncId, facturaId } of pares) {
        await asociarNc.mutateAsync({ ncId, facturaId, facturaAnteriorId: null })
      }
      setUltimoMatch(pares.length)
    } finally {
      setAutoAsociando(false)
    }
  }

  const sortProps = { activeCol: col as string | null, dir, onToggle: toggle }

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle="Comprobantes emitidos · ARCA"
        actions={
          <div className="flex items-center gap-2">
            {facturas.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoAsociar}
                  disabled={autoAsociando}
                  className="btn-ghost flex items-center gap-2 text-amber-400 hover:text-amber-300"
                >
                  <Wand2 className="h-4 w-4" />
                  {autoAsociando ? 'Asociando…' : 'Auto-asociar NC'}
                </button>
                {ultimoMatch !== null && (
                  <span className="text-xs text-ink-500">
                    {ultimoMatch === 0 ? 'Sin matches' : `${ultimoMatch} asociada${ultimoMatch !== 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
            )}
            <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Excel
            </button>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Facturado"     value={`$${fmtImporte(totalFacturado)}`} sub={`${facturasSolo.length} comprobantes`}                         icon={DollarSign}  color="text-accent-400" />
        <KpiCard label="Cobrado"       value={`$${fmtImporte(totalCobrado)}`}   sub={`${facturasSolo.filter((f) => f.fecha_cobro && !f.anulada).length} cobradas`} icon={CheckCircle} color="text-green-400" />
        <KpiCard label="Pendiente"     value={`$${fmtImporte(totalPendiente)}`} sub={`${facturasSolo.filter((f) => !f.fecha_cobro && !f.anulada).length} sin cobrar`} icon={Clock}    color="text-amber-400" />
        <KpiCard label="Notas crédito" value={`$${fmtImporte(totalNC)}`}        sub={`${ncs.length} NC · ${ncs.filter((n) => !n.factura_asociada_id).length} sin asociar`} icon={TrendingDown} color="text-red-400" />
      </div>

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
          <input type="checkbox" className="rounded" checked={filtros.solo_pendientes ?? false} onChange={(e) => setFiltros((f) => ({ ...f, solo_pendientes: e.target.checked || undefined }))} />
          Solo pendientes
        </label>
      </div>

      <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
        {isLoading ? (
          <p className="px-6 py-10 text-center text-sm text-ink-500">Cargando…</p>
        ) : facturas.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-ink-400">No hay comprobantes. Importá un Excel de ARCA para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-800">
                <tr>
                  <SortTh label="Fecha"       field="fecha_emision"    {...sortProps} />
                  <SortTh label="Tipo"        field="tipo_comprobante" {...sortProps} />
                  <SortTh label="Número"      field="numero"           {...sortProps} />
                  <SortTh label="CUIT Emisor" field="cuit_emisor"      {...sortProps} />
                  <SortTh label="Cliente"     field="denominacion"     {...sortProps} />
                  <SortTh label="Importe"     field="imp_total"        {...sortProps} align="right" />
                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-ink-400">Cobranza / NC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filasMostradas.map((f) => {
                  const isNC = esNotaCredito(f.tipo_comprobante)
                  return (
                    <tr key={f.id} className={
                      isNC       ? 'bg-amber-950/10 text-amber-300/80' :
                      f.anulada  ? 'bg-red-950/10 opacity-60 text-ink-500' :
                                   'text-ink-300 hover:bg-ink-800/40'
                    }>
                      <td className="px-4 py-3 font-mono text-xs">{fmtFecha(f.fecha_emision)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${isNC ? 'bg-amber-900/40 text-amber-300' : f.anulada ? 'bg-red-900/30 text-red-400' : 'bg-ink-800 text-ink-300'}`}>
                          {labelTipo(f.tipo_comprobante)}
                          {f.anulada && !isNC && <span className="ml-1 text-red-400">✕</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{f.punto_venta}-{f.numero}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-400">{f.cuit_emisor}</td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <div className="truncate">{f.denominacion ?? '—'}</div>
                        {f.cuit_receptor && <div className="text-xs text-ink-500 font-mono">{f.cuit_receptor}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{isNC ? '−' : ''}${fmtImporte(f.imp_total)}</td>
                      <td className="px-4 py-3">
                        {isNC ? (
                          <NcAsociador nc={f} todas={facturas} onAsociar={handleAsociarNc} />
                        ) : f.anulada ? (
                          <span className="text-xs text-red-400/60">Anulada por NC</span>
                        ) : (
                          <CobranzaEditor factura={f} guardando={guardandoId === f.id} onGuardar={(fields) => handleCobranza(f.id, fields)} />
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
        <ImportarExcelModal tipo="emitidos" cuentas={cuentas} onImportar={handleImportar} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
