import { formatCurrency } from '@/lib/utils'

export interface ServicioEspecialTotales {
  precioEspecial: number
  totalMatRef: number
  clienteProvee: boolean
}

interface PanelTotalesProps {
  usaNuevaFormula: boolean
  // Nueva fórmula
  subtotalMateriales: number
  costoManoObra: number
  margenMaterialesPct: number
  clientePagaMateriales: boolean
  rentabilidadPct: number
  onRentabilidadChange: (val: string) => void
  totalCliente: number
  servicioEspecial?: ServicioEspecialTotales
  descuentoMonto?: number
  precioSinDescuento?: number
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
  margenMaterialesPct,
  clientePagaMateriales,
  rentabilidadPct,
  onRentabilidadChange,
  totalCliente,
  servicioEspecial,
  descuentoMonto,
  precioSinDescuento,
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
      margenMaterialesPct={margenMaterialesPct}
      clientePagaMateriales={clientePagaMateriales}
      rentabilidadPct={rentabilidadPct}
      onRentabilidadChange={onRentabilidadChange}
      totalCliente={totalCliente}
      servicioEspecial={servicioEspecial}
      descuentoMonto={descuentoMonto ?? 0}
      precioSinDescuento={precioSinDescuento ?? totalCliente}
    />
  }

  // Fórmula vieja para presupuestos existentes
  const subtotalBruto = subtotalServicios + subtotalMateriales
  const tieneExtras = extrasMonto > 0

  const descuentoMontoViejo = tieneDescuento
    ? descuentoTipo === 'fijo'
      ? descuentoValor
      : (subtotalBruto * descuentoValor) / 100
    : 0

  const neto = subtotalBruto - descuentoMontoViejo
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
          {tieneDescuento && descuentoMontoViejo > 0 && (
            <Row label="Descuento" value={-descuentoMontoViejo} className="text-warning" />
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
  margenMaterialesPct,
  clientePagaMateriales,
  rentabilidadPct,
  onRentabilidadChange,
  totalCliente,
  servicioEspecial,
  descuentoMonto,
  precioSinDescuento,
}: {
  subtotalMateriales: number
  costoManoObra: number
  margenMaterialesPct: number
  clientePagaMateriales: boolean
  rentabilidadPct: number
  onRentabilidadChange: (val: string) => void
  totalCliente: number
  servicioEspecial?: ServicioEspecialTotales
  descuentoMonto: number
  precioSinDescuento: number
}) {
  const rent = Math.min(rentabilidadPct / 100, 0.9999)
  const matConMargen = subtotalMateriales * (1 + margenMaterialesPct / 100)

  // Con servicio especial, el costo de referencia usa totalMatRef
  const costoNeto = servicioEspecial
    ? servicioEspecial.totalMatRef + costoManoObra
    : subtotalMateriales + costoManoObra

  // Precio base (sin descuento): base / (1 − rent)
  // Para el caso normal, la base incluye el margen de materiales (matConMargen + MO)
  const costoBase = servicioEspecial
    ? servicioEspecial.totalMatRef + costoManoObra
    : (clientePagaMateriales ? costoManoObra : matConMargen + costoManoObra)
  const precioBase = rent > 0 ? costoBase / (1 - rent) : costoBase

  // Línea de margen que se muestra en el desglose
  // = precioBase − lo que ya se muestra como ítems antes del margen
  const margenGenMonto = servicioEspecial
    ? 0
    : clientePagaMateriales
      ? precioBase - costoManoObra
      : precioBase - matConMargen - costoManoObra
  const margenGenEspecial = servicioEspecial
    ? precioBase - servicioEspecial.precioEspecial - costoManoObra
    : 0

  const margenBruto = totalCliente - costoNeto
  const margenBrutoPct = totalCliente > 0 ? (margenBruto / totalCliente) * 100 : 0
  const colorMargen = margenBrutoPct >= 30 ? 'text-success' : margenBrutoPct >= 10 ? 'text-warning' : 'text-danger'

  // Margen sin descuento (para mostrar impacto)
  const margenSinDescPct = descuentoMonto > 0 && precioSinDescuento > 0
    ? ((precioSinDescuento - costoNeto) / precioSinDescuento) * 100
    : null
  const diffPp = margenSinDescPct !== null ? margenBrutoPct - margenSinDescPct : null

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Rentabilidad y totales
      </h2>

      {/* Control de rentabilidad */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-sm text-ink-400">Rentabilidad</span>
        <input
          type="number" min="0" max="99" step="0.5"
          value={rentabilidadPct}
          onChange={(e) => onRentabilidadChange(e.target.value)}
          className="w-20 rounded border border-ink-700 bg-ink-900 px-2 py-1.5 text-center font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
        />
        <span className="text-sm text-ink-400">% sobre precio final</span>
        {!servicioEspecial && margenMaterialesPct > 0 && (
          <span className="ml-4 text-xs text-ink-500">
            Margen materiales: <span className="font-mono text-ink-300">{margenMaterialesPct}%</span>
            <span className="ml-1 text-ink-600">(configurado en /materiales)</span>
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">

        {/* Costos */}
        <div className="space-y-2 rounded-lg border border-ink-800 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">Costos</p>
          <Row label="Mano de Obra" value={costoManoObra} />
          {servicioEspecial ? (
            <div>
              <Row label="Mat. ref. ℹ" value={servicioEspecial.totalMatRef} className="text-ink-500" />
              <p className="mt-0.5 text-right text-[10px] text-ink-600">solo referencia</p>
            </div>
          ) : (
            <Row label="Materiales (neto)" value={subtotalMateriales} />
          )}
          <div className="border-t border-ink-800 pt-2">
            <Row label="Total ref." value={costoNeto} bold />
          </div>
        </div>

        {/* Precio Final */}
        <div className="space-y-2 rounded-lg border border-ink-800 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Precio Final · PDF
          </p>
          {servicioEspecial ? (
            <>
              <Row label="Serv. especial" value={servicioEspecial.precioEspecial} />
              <Row label="Mano de Obra" value={costoManoObra} />
              {rentabilidadPct > 0 && (
                <Row label={`Margen (${rentabilidadPct}%)`} value={margenGenEspecial} />
              )}
              {servicioEspecial.clienteProvee && servicioEspecial.totalMatRef > 0 && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-1.5 mt-1">
                  <span className="text-xs text-sky-400">Cliente provee materiales</span>
                  <span className="font-mono text-xs text-sky-400">− {formatCurrency(servicioEspecial.totalMatRef)}</span>
                </div>
              )}
            </>
          ) : (
            <>
              {margenMaterialesPct > 0 && (
                <Row label={`Materiales (+${margenMaterialesPct}%)`} value={matConMargen} />
              )}
              {margenMaterialesPct === 0 && (
                <Row label="Materiales" value={subtotalMateriales} />
              )}
              <Row label="Mano de Obra" value={costoManoObra} />
              {rentabilidadPct > 0 && (
                <Row label={`Margen (${rentabilidadPct}%)`} value={margenGenMonto} />
              )}
              {clientePagaMateriales && (
                <div className="flex items-center justify-between gap-2 rounded-md bg-sky-500/10 border border-sky-500/20 px-2 py-1.5 mt-1">
                  <span className="text-xs text-sky-400">Cliente provee materiales</span>
                  <span className="font-mono text-xs text-sky-400">− {formatCurrency(matConMargen)}</span>
                </div>
              )}
            </>
          )}
          {descuentoMonto > 0 && (
            <Row label="Descuento aplicado" value={-descuentoMonto} className="text-amber-400" />
          )}
          <div className="border-t border-ink-700 pt-2">
            <Row label="TOTAL" value={totalCliente} bold accent />
          </div>
        </div>

        {/* Margen Bruto */}
        <div className="space-y-2 rounded-lg border border-ink-700/50 bg-ink-900/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-500">
            Margen Bruto
          </p>
          <Row label="Precio Final" value={totalCliente} />
          <Row label="Costos (ref.)" value={-costoNeto} className="text-ink-400" />
          <div className="border-t border-ink-800 pt-2">
            <Row label="Margen" value={margenBruto} bold className={colorMargen} />
          </div>
          {totalCliente > 0 && (
            <p className={`text-right font-mono text-2xl font-bold ${colorMargen}`}>
              {margenBrutoPct.toFixed(1)}%
            </p>
          )}
          {/* Composición del margen: solo cuando hay margen de materiales separado */}
          {margenMaterialesPct > 0 && !servicioEspecial && totalCliente > 0 && (() => {
            const matProfit = subtotalMateriales * (margenMaterialesPct / 100)
            const matPp     = (matProfit / totalCliente) * 100
            const rentPp    = margenBrutoPct - matPp
            return (
              <div className="mt-1 rounded border border-ink-700/50 bg-ink-950/60 px-3 py-2 text-xs">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Composición del margen</p>
                <div className="flex items-center justify-between text-ink-500">
                  <span>Rentabilidad ({rentabilidadPct}%)</span>
                  <span className="font-mono">{rentPp.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-ink-400">
                  <span>Mk. materiales (+{margenMaterialesPct}%)</span>
                  <span className="font-mono text-accent-400">+{matPp.toFixed(1)} pp</span>
                </div>
              </div>
            )
          })()}
          {margenSinDescPct !== null && diffPp !== null && (
            <div className="mt-1 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-xs">
              <div className="flex items-center justify-between text-ink-500">
                <span>Sin descuento</span>
                <span className="font-mono">{margenSinDescPct.toFixed(1)}%</span>
              </div>
              <div className={`flex items-center justify-between font-semibold ${diffPp < -10 ? 'text-red-400' : diffPp < -3 ? 'text-amber-400' : 'text-ink-400'}`}>
                <span>Impacto descuento</span>
                <span className="font-mono">{diffPp > 0 ? '+' : ''}{diffPp.toFixed(1)} pp</span>
              </div>
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
