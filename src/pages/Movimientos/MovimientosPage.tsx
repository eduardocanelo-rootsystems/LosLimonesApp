import { useState } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, ArrowDownLeft, Users, ShoppingCart, Banknote } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { PeriodoSelector, getRangoFechas, type Periodo, type RangoFechas } from '@/components/shared/PeriodoSelector'
import {
  useMovimientos,
  useCrearMovimiento,
  useEliminarMovimiento,
  usePresupuestosRentabilidad,
  type Movimiento,
  type MovimientoInput,
} from '@/hooks/useMovimientos'
import { METODOS_COBRO, type MetodoCobro } from '@/hooks/useCobros'
import { useSocios, type Socio } from '@/hooks/useSocios'

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtFecha(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

// ─── Rentabilidad ─────────────────────────────────────────────────────────────

function PanelRentabilidad({ rango, socios, movimientos }: {
  rango:       RangoFechas
  socios:      Socio[]
  movimientos: Movimiento[]
}) {
  const { data: presupuestos = [] } = usePresupuestosRentabilidad(rango)

  const totalServicios   = presupuestos.reduce((s, p) => s + (p.importe_servicios ?? 0), 0)
  const ingresosExtra    = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0)
  const egresosGenerales = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0)
  const poolNeto         = totalServicios + ingresosExtra - egresosGenerales

  const sociosActivos = socios.filter((s) => s.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  if (sociosActivos.length === 0) {
    return (
      <div className="mb-6 rounded-xl border border-ink-700 bg-ink-900 px-6 py-8 text-center text-sm text-ink-400">
        Configurá los socios en <strong>Configuración → Socios</strong> para ver la distribución de rentabilidad.
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
      <div className="border-b border-ink-700 bg-ink-800/50 px-4 py-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-accent-400" />
        <span className="text-sm font-medium text-ink-100">Rentabilidad del período</span>
      </div>

      {/* Resumen pool */}
      <div className="grid grid-cols-2 gap-px bg-ink-700 border-b border-ink-700 sm:grid-cols-4">
        {[
          { label: 'Servicios facturados', value: totalServicios,   color: 'text-accent-400' },
          { label: 'Ingresos extra',        value: ingresosExtra,    color: 'text-green-400'  },
          { label: 'Egresos generales',     value: egresosGenerales, color: 'text-red-400'    },
          { label: 'Pool neto',             value: poolNeto,         color: poolNeto >= 0 ? 'text-accent-400' : 'text-red-400' },
        ].map((item) => (
          <div key={item.label} className="bg-ink-900 px-4 py-3">
            <p className="text-xs text-ink-500">{item.label}</p>
            <p className={`mt-1 text-lg font-semibold font-mono ${item.color}`}>${fmtImporte(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Tabla por socio */}
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2 text-left">Socio</th>
            <th className="px-4 py-2 text-right">%</th>
            <th className="px-4 py-2 text-right">Bruto</th>
            <th className="px-4 py-2 text-right">Retiros</th>
            <th className="px-4 py-2 text-right">Neto</th>
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
              <tr key={socio.id} className="text-ink-300 hover:bg-ink-800/30">
                <td className="px-4 py-3 font-medium text-ink-100">{socio.nombre}</td>
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
        </tbody>
      </table>
      </div>

      {/* Presupuestos que componen el pool */}
      {presupuestos.length > 0 && (
        <details className="border-t border-ink-700">
          <summary className="cursor-pointer px-4 py-2 text-xs text-ink-500 hover:text-ink-300">
            {presupuestos.length} presupuesto{presupuestos.length !== 1 ? 's' : ''} incluido{presupuestos.length !== 1 ? 's' : ''} · ${fmtImporte(totalServicios)} en servicios
          </summary>
          <table className="w-full text-xs border-t border-ink-800">
            <tbody className="divide-y divide-ink-800">
              {presupuestos.map((p) => (
                <tr key={p.id} className="text-ink-400">
                  <td className="px-4 py-2 font-mono text-accent-400/70">{p.numero}</td>
                  <td className="px-4 py-2 truncate max-w-[200px]">{p.cliente_razon_social}</td>
                  <td className="px-4 py-2 capitalize">{p.estado}</td>
                  <td className="px-4 py-2 text-right font-mono">${fmtImporte(p.importe_servicios ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  )
}

// ─── Formulario nuevo movimiento ──────────────────────────────────────────────

const TIPO_ICON = {
  ingreso:  TrendingUp,
  egreso:   TrendingDown,
  retiro:   ArrowDownLeft,
  venta_sf: Banknote,
  compra_sf: ShoppingCart,
}
const TIPO_LABEL = { ingreso: 'Ingreso', egreso: 'Egreso', retiro: 'Retiro', venta_sf: 'Venta s/f', compra_sf: 'Compra s/f' }
const TIPO_COLOR = { ingreso: 'text-green-400', egreso: 'text-red-400', retiro: 'text-amber-400', venta_sf: 'text-emerald-400', compra_sf: 'text-orange-400' }

type ModoTipo = 'egreso' | 'retiro' | 'ingreso' | 'compra_sf' | 'venta_sf'

function NuevoMovimientoModal({ socios, onClose }: { socios: Socio[]; onClose: () => void }) {
  const crear = useCrearMovimiento()
  const hoy   = new Date().toISOString().split('T')[0]

  const [fecha,        setFecha]        = useState(hoy)
  const [modo,         setModo]         = useState<ModoTipo>('egreso')
  const [descripcion,  setDescripcion]  = useState('')
  const [monto,        setMonto]        = useState('')
  const [socioId,      setSocioId]      = useState('')
  const [categoria,    setCategoria]    = useState('')
  const [contraparte,  setContraparte]  = useState('')
  const [metodoCobro,  setMetodoCobro]  = useState<MetodoCobro>('transferencia')
  const [error,        setError]        = useState('')

  const GRUPOS = [
    {
      label: 'Ingresos',
      modos: [
        { key: 'ingreso'  as ModoTipo, label: 'Ingreso',     icon: TrendingUp,    color: 'text-green-400'   },
        { key: 'venta_sf' as ModoTipo, label: 'Venta s/f',   icon: Banknote,      color: 'text-emerald-400' },
      ],
    },
    {
      label: 'Egresos',
      modos: [
        { key: 'egreso'    as ModoTipo, label: 'Egreso',     icon: TrendingDown,  color: 'text-red-400'     },
        { key: 'compra_sf' as ModoTipo, label: 'Compra s/f', icon: ShoppingCart,  color: 'text-orange-400'  },
      ],
    },
    {
      label: 'Retiro',
      modos: [
        { key: 'retiro' as ModoTipo, label: 'Retiro de socio', icon: ArrowDownLeft, color: 'text-amber-400' },
      ],
    },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto.replace(',', '.'))
    if (!montoNum || montoNum <= 0) { setError('El monto debe ser mayor a cero.'); return }
    if (modo === 'retiro' && !socioId) { setError('Seleccioná el socio para el retiro.'); return }
    setError('')

    const tipo: MovimientoInput['tipo'] =
      modo === 'compra_sf' ? 'egreso' :
      modo === 'venta_sf'  ? 'ingreso' : modo

    const subtipo: MovimientoInput['subtipo'] =
      modo === 'compra_sf' ? 'compra_sf' :
      modo === 'venta_sf'  ? 'venta_sf'  : null

    await crear.mutateAsync({
      fecha,
      descripcion:   descripcion.trim(),
      tipo,
      subtipo,
      monto:         montoNum,
      socio_id:      modo === 'retiro' ? socioId : null,
      categoria:     categoria.trim() || null,
      contraparte:   contraparte.trim() || null,
      observaciones: null,
      metodo_cobro:  modo === 'venta_sf' ? metodoCobro : null,
    })
    onClose()
  }

  const esCompraVenta = modo === 'compra_sf' || modo === 'venta_sf'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <h2 className="text-base font-semibold text-ink-100">Nuevo movimiento</h2>
          <button onClick={onClose} className="btn-ghost p-1"><Plus className="h-4 w-4 rotate-45" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">

          {/* Tipo */}
          <div className="space-y-2">
            {GRUPOS.map((grupo) => (
              <div key={grupo.label} className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-right text-xs text-ink-600">{grupo.label}</span>
                <div className={`grid flex-1 gap-1.5 ${grupo.modos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {grupo.modos.map(({ key, label, icon: Icon, color }) => (
                    <button
                      key={key} type="button"
                      onClick={() => setModo(key)}
                      className={`flex items-center justify-center gap-2 rounded-lg border py-2 px-3 text-xs font-medium transition-colors ${
                        modo === key
                          ? `border-current ${color} bg-ink-800`
                          : 'border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {esCompraVenta && (
            <div className="rounded-lg border border-ink-700 bg-ink-800/40 px-3 py-2 text-xs text-ink-400">
              {modo === 'compra_sf'
                ? 'Compra sin factura: se registra como egreso. Indicá el proveedor abajo.'
                : 'Venta sin factura: se registra como ingreso. Indicá el cliente abajo.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Fecha</label>
              <input type="date" className="input w-full" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Monto</label>
              <input type="text" className="input w-full font-mono" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0,00" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-ink-400">Descripción</label>
            <input type="text" className="input w-full" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder={esCompraVenta ? 'Ej: pintura exterior, materiales limpieza…' : 'Herramientas, combustible…'} required />
          </div>

          {esCompraVenta && (
            <div className="space-y-1">
              <label className="text-xs text-ink-400">{modo === 'compra_sf' ? 'Proveedor' : 'Cliente'} (opcional)</label>
              <input type="text" className="input w-full" value={contraparte} onChange={(e) => setContraparte(e.target.value)} placeholder={modo === 'compra_sf' ? 'Nombre del proveedor…' : 'Nombre del cliente…'} />
            </div>
          )}

          {modo === 'venta_sf' && (
            <div className="space-y-1.5">
              <label className="text-xs text-ink-400">Método de cobro</label>
              <div className="flex flex-wrap gap-2">
                {METODOS_COBRO.map((m) => (
                  <button
                    key={m.value} type="button"
                    onClick={() => setMetodoCobro(m.value)}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      metodoCobro === m.value
                        ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                        : 'border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {modo === 'retiro' && (
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Socio</label>
              <select className="input w-full" value={socioId} onChange={(e) => setSocioId(e.target.value)} required>
                <option value="">— elegir socio —</option>
                {socios.filter((s) => s.activo).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(modo === 'egreso') && (
            <div className="space-y-1">
              <label className="text-xs text-ink-400">Categoría (opcional)</label>
              <input type="text" className="input w-full" value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Combustible, herramientas…" />
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" disabled={crear.isPending} className="btn-primary flex-1">
              {crear.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Lista de movimientos ─────────────────────────────────────────────────────

function FilaMovimiento({ mov, socios }: { mov: Movimiento; socios: Socio[] }) {
  const eliminar  = useEliminarMovimiento()
  const labelKey  = mov.subtipo ?? mov.tipo
  const Icon      = TIPO_ICON[labelKey as keyof typeof TIPO_ICON] ?? TIPO_ICON[mov.tipo]
  const color     = TIPO_COLOR[labelKey as keyof typeof TIPO_COLOR] ?? TIPO_COLOR[mov.tipo]
  const label     = TIPO_LABEL[labelKey as keyof typeof TIPO_LABEL] ?? TIPO_LABEL[mov.tipo]
  const socio     = socios.find((s) => s.id === mov.socio_id)
  const esIngreso = mov.tipo === 'ingreso'

  return (
    <tr className="text-ink-300 hover:bg-ink-800/30">
      <td className="px-4 py-3 font-mono text-xs text-ink-400">{fmtFecha(mov.fecha)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
          <Icon className="h-3 w-3" />
          {label}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>{mov.descripcion}</div>
        {mov.contraparte && <div className="text-xs text-ink-400 mt-0.5">{mov.contraparte}</div>}
        {mov.categoria   && <div className="text-xs text-ink-500">{mov.categoria}</div>}
        {socio           && <div className="text-xs text-amber-400/70">{socio.nombre}</div>}
      </td>
      <td className={`px-4 py-3 text-right font-mono font-medium ${esIngreso ? 'text-green-400' : 'text-red-400'}`}>
        {esIngreso ? '+' : '−'}${fmtImporte(mov.monto)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => { if (confirm('¿Eliminar este movimiento?')) eliminar.mutate(mov.id) }}
          className="text-ink-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MovimientosPage() {
  const [periodo, setPeriodo]   = useState<Periodo>('mes_actual')
  const [rango, setRango]       = useState<RangoFechas>(() => getRangoFechas('mes_actual'))
  const [modalOpen, setModalOpen] = useState(false)

  const { data: socios      = [] } = useSocios()
  const { data: movimientos = [] } = useMovimientos(rango)

  return (
    <>
      <PageHeader
        title="Movimientos"
        subtitle="Caja, retiros y rentabilidad por período"
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo movimiento
          </button>
        }
      />

      <div className="mb-6">
        <PeriodoSelector
          value={periodo}
          onChange={(p, r) => { setPeriodo(p); setRango(r) }}
        />
      </div>

      <PanelRentabilidad rango={rango} socios={socios} movimientos={movimientos} />

      {/* Movimientos del período */}
      <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
        <div className="border-b border-ink-700 bg-ink-800/50 px-4 py-3">
          <span className="text-sm font-medium text-ink-100">Movimientos del período</span>
          <span className="ml-2 text-xs text-ink-500">({movimientos.length})</span>
        </div>
        {movimientos.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-500">
            No hay movimientos en este período. Registrá un egreso, retiro o ingreso.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {movimientos.map((m) => (
                  <FilaMovimiento key={m.id} mov={m} socios={socios} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <NuevoMovimientoModal socios={socios} onClose={() => setModalOpen(false)} />
      )}
    </>
  )
}
