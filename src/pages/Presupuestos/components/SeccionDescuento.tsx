import { formatCurrency } from '@/lib/utils'

interface SeccionDescuentoProps {
  tieneDescuento: boolean
  valor: string
  onChange: (field: string, value: unknown) => void
  // Impacto en margen (solo nueva fórmula)
  precioSinDescuento?: number
  costoNeto?: number
}

export function SeccionDescuento({
  tieneDescuento,
  valor,
  onChange,
  precioSinDescuento,
  costoNeto,
}: SeccionDescuentoProps) {
  const descMonto  = parseFloat(valor) || 0
  const puedeImpacto = tieneDescuento && descMonto > 0 && precioSinDescuento && costoNeto !== undefined

  const margenSin = precioSinDescuento && precioSinDescuento > 0
    ? ((precioSinDescuento - (costoNeto ?? 0)) / precioSinDescuento) * 100
    : null
  const precioConDesc = (precioSinDescuento ?? 0) - descMonto
  const margenCon = precioConDesc > 0
    ? ((precioConDesc - (costoNeto ?? 0)) / precioConDesc) * 100
    : null
  const diff = margenSin !== null && margenCon !== null ? margenCon - margenSin : null

  const colorDiff = diff === null ? '' : diff < -10 ? 'text-red-400' : diff < -3 ? 'text-amber-400' : 'text-ink-400'

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Descuento</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={tieneDescuento}
            onChange={(e) => {
              onChange('tiene_descuento', e.target.checked)
              if (!e.target.checked) onChange('descuento_valor', '')
            }}
            className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent-500"
          />
          Aplicar descuento
        </label>
      </div>

      {tieneDescuento && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-400">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={valor}
              onChange={(e) => onChange('descuento_valor', e.target.value)}
              className="input-base w-40 font-mono"
              placeholder="0"
            />
            {descMonto > 0 && (
              <span className="text-sm text-ink-500">{formatCurrency(descMonto)} menos al cliente</span>
            )}
          </div>

          {puedeImpacto && margenSin !== null && margenCon !== null && diff !== null && (
            <div className="rounded-md border border-ink-700 bg-ink-800/50 px-4 py-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-500">
                Impacto en margen
              </p>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-400">Sin descuento:</span>
                <span className="font-mono font-semibold text-ink-200">{margenSin.toFixed(1)}%</span>
                <span className="text-ink-600">→</span>
                <span className="text-ink-400">Con descuento:</span>
                <span className={`font-mono font-semibold ${margenCon >= 30 ? 'text-green-400' : margenCon >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                  {margenCon.toFixed(1)}%
                </span>
                <span className={`ml-1 font-mono text-xs font-semibold ${colorDiff}`}>
                  ({diff > 0 ? '+' : ''}{diff.toFixed(1)} pp)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
