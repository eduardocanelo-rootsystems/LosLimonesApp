import { formatCurrency } from '@/lib/utils'

interface PanelTotalesProps {
  usaNuevaFormula: boolean
  // Nueva fórmula
  subtotalMateriales: number
  costoManoObra: number
  clientePagaMateriales: boolean
  rentabilidadPct: number
  onRentabilidadChange: (val: string) => void
  totalCliente: number
  // Fórmula vieja
  subtotalServicios: number
  extrasMonto: number
  tieneDescuento: boolean
  descuentoTipo: 'fijo' | 'porcentaje'
  descuentoValor: number
  ivaPct: number
  onIvaChange: (val: string) => void
}

export function PanelTotales({
  usaNuevaFormula,
  subtotalMateriales,
  costoManoObra,
  clientePagaMateriales,
  rentabilidadPct,
  onRentabilidadChange,
  totalCliente,
  subtotalServicios,
  extrasMonto,
  tieneDescuento,
  descuentoTipo,
  descuentoValor,
  ivaPct,
  onIvaChange,
}: PanelTotalesProps) {
  if (usaNuevaFormula) {
    return <PanelNuevoFormula
      subtotalMateriales={subtotalMateriales}
      costoManoObra={costoManoObra}
      clientePagaMateriales={clientePagaMateriales}
      rentabilidadPct={rentabilidadPct}
      onRentabilidadChange={onRentabilidadChange}
      totalCliente={totalCliente}
    />
  }

  // Fórmula vieja para presupuestos existentes
  const subtotalBruto = subtotalServicios + subtotalMateriales
  const tieneExtras = extrasMonto > 0

  const descuentoMonto = tieneDescuento
    ? descuentoTipo === 'fijo'
      ? descuentoValor
      : (subtotalBruto * descuentoValor) / 100
    : 0

  const neto = subtotalBruto - descuentoMonto
  const ivaMonto = (neto * ivaPct) / 100
  const totalSinMO = neto + ivaMonto

  const factor = subtotalBruto > 0 ? totalSinMO / subtotalBruto : 1
  const costoManoObraAjustado = costoManoObra * factor
  const total = totalSinMO + costoManoObraAjustado

  const margenBruto = total - costoManoObra
  const margenPct = total > 0 ? (margenBruto / total) * 100 : 0

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Resumen y totales
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-ink-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Vista cliente · aparece en el PDF
          </p>
          <Row label="Subtotal servicios" value={subtotalServicios} />
          <Row label="Subtotal materiales" value={subtotalMateriales} />
          {tieneExtras && (
            <Row label="↳ Adicionales incluidos" value={extrasMonto} className="text-warning text-xs" />
          )}
          {tieneDescuento && descuentoMonto > 0 && (
            <Row label="Descuento" value={-descuentoMonto} className="text-warning" />
          )}
          <div className="border-t border-ink-800 pt-2">
            <Row label="Neto" value={neto} bold />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink-400">
              IVA
              <input
                type="number" min="0" max="100" step="0.5"
                value={ivaPct}
                onChange={(e) => onIvaChange(e.target.value)}
                className="mx-1 w-14 rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 text-center font-mono text-xs text-ink-100 focus:border-accent-500 focus:outline-none"
              />
              %
            </span>
            <span className="font-mono text-sm text-ink-300">{formatCurrency(ivaMonto)}</span>
          </div>
          {costoManoObra > 0 && (
            <Row label="Mano de obra (incluida)" value={costoManoObraAjustado} className="text-ink-400 text-xs" />
          )}
          <div className="border-t border-ink-700 pt-2">
            <Row label="Total al cliente" value={total} bold accent />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-ink-700/50 bg-ink-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Análisis interno</p>
          <Row label="Total al cliente" value={total} />
          <Row label="Costo estimado MO" value={-costoManoObra} className="text-ink-400" />
          <div className="border-t border-ink-800 pt-2">
            <Row
              label="Margen bruto"
              value={margenBruto}
              bold
              className={margenPct >= 30 ? 'text-success' : margenPct >= 10 ? 'text-warning' : 'text-danger'}
            />
          </div>
          {total > 0 && (
            <p className={`text-right font-mono text-lg font-bold ${margenPct >= 30 ? 'text-success' : margenPct >= 10 ? 'text-warning' : 'text-danger'}`}>
              {margenPct.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Panel nueva fórmula ─────────────────────────────────────────────────────

function PanelNuevoFormula({
  subtotalMateriales,
  costoManoObra,
  clientePagaMateriales,
  rentabilidadPct,
  onRentabilidadChange,
  totalCliente,
}: {
  subtotalMateriales: number
  costoManoObra: number
  clientePagaMateriales: boolean
  rentabilidadPct: number
  onRentabilidadChange: (val: string) => void
  totalCliente: number
}) {
  // Siempre aplicar margen sobre Mat+MO; si el cliente paga, se resta Mat del precio
  const costoBaseTotal = subtotalMateriales + costoManoObra
  const gananciaTarget = costoBaseTotal * (rentabilidadPct / 100)
  const costoRealEmpresa = clientePagaMateriales ? costoManoObra : costoBaseTotal
  const gananciaReal = totalCliente - costoRealEmpresa
  const rentabilidadEfectiva = costoRealEmpresa > 0 ? (gananciaReal / costoRealEmpresa) * 100 : 0
  const colorEfectiva = rentabilidadEfectiva >= 30 ? 'text-success' : rentabilidadEfectiva >= 10 ? 'text-warning' : 'text-danger'

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Rentabilidad y totales
      </h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Panel precio al cliente */}
        <div className="space-y-3 rounded-lg border border-ink-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Precio al cliente · aparece en el PDF
          </p>

          <Row label="Costo materiales" value={subtotalMateriales} />
          <Row label="Costo mano de obra" value={costoManoObra} />

          <div className="border-t border-ink-800 pt-2">
            <Row label="Costo base (Mat + MO)" value={costoBaseTotal} bold />
          </div>

          {/* Rentabilidad editable */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-ink-400">
              Rentabilidad
              <input
                type="number" min="0" max="999" step="1"
                value={rentabilidadPct}
                onChange={(e) => onRentabilidadChange(e.target.value)}
                className="mx-1 w-16 rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 text-center font-mono text-xs text-ink-100 focus:border-accent-500 focus:outline-none"
              />
              %
            </span>
            <span className="font-mono text-sm text-ink-300">+ {formatCurrency(gananciaTarget)}</span>
          </div>

          {clientePagaMateriales && (
            <div className="flex items-center justify-between gap-2 rounded-md bg-sky-500/10 border border-sky-500/20 px-3 py-2">
              <span className="text-xs text-sky-400">Materiales a cargo del cliente</span>
              <span className="font-mono text-xs text-sky-400">− {formatCurrency(subtotalMateriales)}</span>
            </div>
          )}

          <div className="border-t border-ink-700 pt-2">
            <Row label="Total al cliente" value={totalCliente} bold accent />
          </div>
        </div>

        {/* Panel análisis interno */}
        <div className="space-y-3 rounded-lg border border-ink-700/50 bg-ink-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Análisis interno
          </p>

          <Row label="Total cobrado al cliente" value={totalCliente} />
          <Row
            label={clientePagaMateriales ? 'Costo real empresa (solo MO)' : 'Costo total real'}
            value={-costoRealEmpresa}
            className="text-ink-400"
          />

          <div className="border-t border-ink-800 pt-2">
            <Row
              label="Ganancia bruta"
              value={gananciaReal}
              bold
              className={colorEfectiva}
            />
          </div>

          {totalCliente > 0 && (
            <div className="text-right">
              <p className={`font-mono text-lg font-bold ${colorEfectiva}`}>
                {rentabilidadEfectiva.toFixed(1)}%
              </p>
              {clientePagaMateriales && (
                <p className="mt-0.5 text-xs text-ink-500">
                  rentabilidad configurada: {rentabilidadPct.toFixed(1)}% sobre costo total
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─── Row helper ──────────────────────────────────────────────────────────────

function Row({
  label, value, bold, accent, className,
}: {
  label: string
  value: number
  bold?: boolean
  accent?: boolean
  className?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-ink-100' : 'text-ink-400'}`}>
        {label}
      </span>
      <span className={`font-mono text-sm ${bold ? 'font-semibold' : ''} ${accent ? 'text-accent-400 text-base' : 'text-ink-100'} ${className ?? ''}`}>
        {value < 0 ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </span>
    </div>
  )
}
