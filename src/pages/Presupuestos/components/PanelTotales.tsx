import { formatCurrency } from '@/lib/utils'

interface PanelTotalesProps {
  subtotalServicios: number
  subtotalMateriales: number
  extrasMonto: number
  tieneDescuento: boolean
  descuentoTipo: 'fijo' | 'porcentaje'
  descuentoValor: number
  ivaPct: number
  costoManoObra: number
  onIvaChange: (val: string) => void
}

export function PanelTotales({
  subtotalServicios,
  subtotalMateriales,
  extrasMonto,
  tieneDescuento,
  descuentoTipo,
  descuentoValor,
  ivaPct,
  costoManoObra,
  onIvaChange,
}: PanelTotalesProps) {
  const tieneExtras = extrasMonto > 0
  const subtotalBruto = subtotalServicios + subtotalMateriales

  const descuentoMonto = tieneDescuento
    ? descuentoTipo === 'fijo'
      ? descuentoValor
      : (subtotalBruto * descuentoValor) / 100
    : 0

  const neto = subtotalBruto - descuentoMonto
  const ivaMonto = (neto * ivaPct) / 100
  const totalCliente = neto + ivaMonto

  const margenBruto = totalCliente - costoManoObra
  const margenPct = totalCliente > 0 ? (margenBruto / totalCliente) * 100 : 0

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Resumen y totales
      </h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Vista cliente */}
        <div className="space-y-3 rounded-lg border border-ink-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Vista cliente · aparece en el PDF
          </p>
          <Row label="Subtotal servicios" value={subtotalServicios} />
          <Row label="Subtotal materiales" value={subtotalMateriales} />
          {tieneExtras && (
            <Row
              label="↳ Adicionales incluidos"
              value={extrasMonto}
              className="text-warning text-xs"
            />
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
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={ivaPct}
                onChange={(e) => onIvaChange(e.target.value)}
                className="mx-1 w-14 rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 text-center font-mono text-xs text-ink-100 focus:border-accent-500 focus:outline-none"
              />
              %
            </span>
            <span className="font-mono text-sm text-ink-300">{formatCurrency(ivaMonto)}</span>
          </div>
          <div className="border-t border-ink-700 pt-2">
            <Row label="Total al cliente" value={totalCliente} bold accent />
          </div>
        </div>

        {/* Análisis interno */}
        <div className="space-y-3 rounded-lg border border-ink-700/50 bg-ink-900/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Análisis interno
          </p>
          <Row label="Total al cliente" value={totalCliente} />
          <Row label="Costo estimado MO" value={-costoManoObra} className="text-ink-400" />
          <div className="border-t border-ink-800 pt-2">
            <Row
              label="Margen bruto"
              value={margenBruto}
              bold
              className={margenPct >= 30 ? 'text-success' : margenPct >= 10 ? 'text-warning' : 'text-danger'}
            />
          </div>
          {totalCliente > 0 && (
            <p className={`text-right font-mono text-lg font-bold ${
              margenPct >= 30 ? 'text-success' : margenPct >= 10 ? 'text-warning' : 'text-danger'
            }`}>
              {margenPct.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Row({
  label,
  value,
  bold,
  accent,
  className,
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
      <span
        className={`font-mono text-sm ${bold ? 'font-semibold' : ''} ${
          accent ? 'text-accent-400 text-base' : 'text-ink-100'
        } ${className ?? ''}`}
      >
        {value < 0 ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </span>
    </div>
  )
}
