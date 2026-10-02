import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { formatCurrency, toNombrePropio } from '@/lib/utils'
import type { FormServicioItem, MatRefItem, MaterialConPrecio, ServicioConPrecio } from '@/types/database'

interface SeccionServiciosProps {
  items: FormServicioItem[]
  catalogo: ServicioConPrecio[]
  catalogoMateriales: MaterialConPrecio[]
  m2: number
  coefK: number
  esAprobado?: boolean
  soloDescriptivo?: boolean
  onChange: (items: FormServicioItem[]) => void
}

export function SeccionServicios({
  items,
  catalogo,
  catalogoMateriales,
  m2,
  coefK,
  esAprobado,
  soloDescriptivo,
  onChange,
}: SeccionServiciosProps) {
  const [seleccionado, setSeleccionado] = useState('')

  const disponibles = catalogo.filter(
    (s) => s.estado === 'activo' && !items.some((i) => i.servicio_id === s.id)
  )

  const toggleExtra = (key: string) =>
    onChange(items.map((i) => i._key === key ? { ...i, es_adicional: !i.es_adicional } : i))

  const updateItem = (key: string, updates: Partial<FormServicioItem>) =>
    onChange(items.map((i) => i._key === key ? { ...i, ...updates } : i))

  const agregar = () => {
    const servicio = catalogo.find((s) => s.id === seleccionado)
    if (!servicio) return

    const item: FormServicioItem = {
      _key: crypto.randomUUID(),
      servicio_id: servicio.id,
      nombre: toNombrePropio(servicio.nombre),
      precio_m2: servicio.precio_m2_actual ?? 0,
      es_adicional: esAprobado ?? false,
      es_especial: servicio.es_especial ?? false,
      descripcion_especifica: '',
      precio_especial: null,
      materiales_ref: [],
      cliente_provee_materiales: false,
    }
    onChange([...items, item])
    setSeleccionado('')
  }

  const agregarTodos = () => {
    const nuevos: FormServicioItem[] = disponibles.map((s) => ({
      _key: crypto.randomUUID(),
      servicio_id: s.id,
      nombre: toNombrePropio(s.nombre),
      precio_m2: s.precio_m2_actual ?? 0,
      es_adicional: false,
      es_especial: s.es_especial ?? false,
      descripcion_especifica: '',
      precio_especial: null,
      materiales_ref: [],
      cliente_provee_materiales: false,
    }))
    onChange([...items, ...nuevos])
  }

  const quitar = (key: string) => onChange(items.filter((i) => i._key !== key))

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Servicios a realizar
      </h2>

      {items.length > 0 && (
        <div className="mb-4 space-y-2">
          {items.map((item) => {
            const subtotal = item.precio_m2 * m2 * coefK
            if (item.es_especial) {
              return (
                <PanelServicioEspecial
                  key={item._key}
                  item={item}
                  catalogo={catalogoMateriales}
                  onUpdate={(updates) => updateItem(item._key, updates)}
                  onQuitar={() => quitar(item._key)}
                />
              )
            }
            return (
              <div key={item._key} className="flex items-center gap-2 rounded-lg border border-ink-800 px-4 py-2.5 hover:bg-ink-900/30">
                <div className="flex flex-1 items-center gap-2">
                  <span className="font-medium text-ink-100">{item.nombre}</span>
                  {item.es_adicional ? (
                    <button type="button" onClick={() => toggleExtra(item._key)}
                      className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning hover:bg-warning/30 transition-colors">
                      extra ×
                    </button>
                  ) : (
                    <button type="button" onClick={() => toggleExtra(item._key)}
                      className="rounded border border-dashed border-ink-700 px-1.5 py-0.5 text-[10px] text-ink-600 hover:border-warning hover:text-warning transition-colors">
                      + extra
                    </button>
                  )}
                </div>
                {!soloDescriptivo && (
                  <span className="font-mono text-sm text-ink-300">
                    {m2 && coefK ? formatCurrency(subtotal) : '—'}
                  </span>
                )}
                <button type="button" onClick={() => quitar(item._key)}
                  className="rounded p-1 text-ink-500 hover:text-danger transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {disponibles.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            aria-label="Seleccionar servicio"
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            className="input-base flex-1"
          >
            <option value="">Seleccionar servicio…</option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {toNombrePropio(s.nombre)}{s.es_especial ? ' ★' : ''}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={agregar} disabled={!seleccionado}
              className="btn-primary disabled:opacity-40">
              <Plus className="h-4 w-4" />
              {esAprobado ? 'Agregar extra' : 'Agregar'}
            </button>
            {!esAprobado && disponibles.length > 1 && (
              <button type="button" onClick={agregarTodos} className="btn-secondary"
                title="Agregar todos los servicios activos del catálogo">
                Agregar todos ({disponibles.length})
              </button>
            )}
          </div>
        </div>
      ) : items.length > 0 ? (
        <p className="text-xs text-ink-500">Todos los servicios activos están agregados.</p>
      ) : (
        <p className="text-xs text-ink-500">No hay servicios activos. Cargá servicios en el catálogo primero.</p>
      )}
    </section>
  )
}

// ─── Panel de Servicio Especial ───────────────────────────────────────────────

function PanelServicioEspecial({
  item,
  catalogo,
  onUpdate,
  onQuitar,
}: {
  item: FormServicioItem
  catalogo: MaterialConPrecio[]
  onUpdate: (updates: Partial<FormServicioItem>) => void
  onQuitar: () => void
}) {
  const [abierto, setAbierto] = useState(true)
  const [matSel, setMatSel] = useState('')
  const [matCant, setMatCant] = useState('1')

  const refs = item.materiales_ref ?? []
  const disponibles = catalogo.filter((m) => m.estado === 'activo' && !refs.some((r) => r.material_id === m.id))
  const totalMatRef = refs.reduce((acc, r) => acc + r.precio * r.cantidad, 0)

  const agregarMat = () => {
    const mat = catalogo.find((m) => m.id === matSel)
    if (!mat) return
    const cant = parseInt(matCant)
    if (isNaN(cant) || cant <= 0) return
    const nuevo: MatRefItem = {
      _key: crypto.randomUUID(),
      material_id: mat.id,
      nombre: mat.nombre,
      unidad: mat.unidad,
      precio: mat.precio_actual ?? 0,
      cantidad: cant,
    }
    onUpdate({ materiales_ref: [...refs, nuevo] })
    setMatSel('')
    setMatCant('1')
  }

  const quitarMat = (key: string) =>
    onUpdate({ materiales_ref: refs.filter((r) => r._key !== key) })

  const actualizarCant = (key: string, val: string) => {
    const n = parseInt(val)
    onUpdate({
      materiales_ref: refs.map((r) =>
        r._key === key ? { ...r, cantidad: isNaN(n) || n < 1 ? r.cantidad : n } : r
      ),
    })
  }

  return (
    <div className="rounded-lg border border-accent-500/30 bg-accent-500/5">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={() => setAbierto((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left">
          <span className="text-sm font-semibold text-accent-400">★</span>
          <span className="flex-1 font-medium text-ink-100">{item.nombre}</span>
          {abierto ? <ChevronUp className="h-4 w-4 text-ink-400" /> : <ChevronDown className="h-4 w-4 text-ink-400" />}
        </button>
        <button type="button" onClick={onQuitar}
          className="rounded p-1 text-ink-500 hover:text-danger transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {abierto && (
        <div className="space-y-5 border-t border-accent-500/20 px-4 pb-5 pt-4">

          {/* Descripción */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
              Descripción del trabajo
            </label>
            <textarea
              rows={3}
              value={item.descripcion_especifica ?? ''}
              onChange={(e) => onUpdate({ descripcion_especifica: e.target.value })}
              placeholder="Detallá qué trabajo específico se realizará…"
              className="input-base resize-y text-sm"
            />
          </div>

          {/* Materiales */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-ink-400">
                Materiales a utilizar
              </label>
              <span className="text-xs text-ink-600">Solo referencia interna de costo</span>
            </div>

            {refs.length > 0 && (
              <div className="mb-3 overflow-hidden rounded-lg border border-ink-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-800 bg-ink-900/50">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Material</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Precio</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Cant.</th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Subtotal</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800">
                    {refs.map((r) => (
                      <tr key={r._key} className="hover:bg-ink-900/30">
                        <td className="px-3 py-2 text-ink-100">{r.nombre} <span className="text-ink-500">({r.unidad})</span></td>
                        <td className="px-3 py-2 text-right font-mono text-ink-300">{formatCurrency(r.precio)}</td>
                        <td className="px-3 py-2 text-right">
                          <input type="number" min="1" step="1" value={r.cantidad}
                            onChange={(e) => actualizarCant(r._key, e.target.value)}
                            className="w-20 rounded border border-ink-700 bg-ink-900 px-2 py-0.5 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-medium text-ink-100">{formatCurrency(r.precio * r.cantidad)}</td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => quitarMat(r._key)}
                            className="rounded p-0.5 text-ink-500 hover:text-danger transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-end gap-2 border-t border-ink-800 bg-ink-900/40 px-3 py-2 text-sm">
                  <span className="text-ink-500">Costo ref. total:</span>
                  <span className="font-mono font-semibold text-ink-200">{formatCurrency(totalMatRef)}</span>
                </div>
              </div>
            )}

            {disponibles.length > 0 && (
              <div className="flex gap-2">
                <select aria-label="Seleccionar material" value={matSel}
                  onChange={(e) => setMatSel(e.target.value)} className="input-base flex-1 text-sm">
                  <option value="">Agregar material…</option>
                  {disponibles.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.unidad}) — {m.precio_actual !== null ? formatCurrency(m.precio_actual) : 'sin precio'}
                    </option>
                  ))}
                </select>
                <input type="number" min="1" step="1" value={matCant}
                  onChange={(e) => setMatCant(e.target.value)} placeholder="Cant."
                  className="w-20 rounded border border-ink-700 bg-ink-900 px-2 py-2 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                />
                <button type="button" onClick={agregarMat} disabled={!matSel}
                  className="btn-secondary disabled:opacity-40 text-sm">
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
            )}
          </div>

          {/* Cliente provee + Precio especial */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
                Precio del servicio (cobrado al cliente)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precio_especial ?? ''}
                  onChange={(e) => onUpdate({ precio_especial: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0.00"
                  className="input-base flex-1 font-mono"
                />
              </div>
              {totalMatRef > 0 && item.precio_especial != null && item.precio_especial > 0 && (
                <p className="mt-1 text-xs text-ink-500">
                  Ref. materiales: {formatCurrency(totalMatRef)} ·
                  Margen sobre materiales: {formatCurrency(item.precio_especial - totalMatRef)}
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300 sm:pb-2">
              <input
                type="checkbox"
                checked={item.cliente_provee_materiales ?? false}
                onChange={(e) => onUpdate({ cliente_provee_materiales: e.target.checked })}
                className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent-500"
              />
              El cliente provee los materiales
              {item.cliente_provee_materiales && totalMatRef > 0 && (
                <span className="ml-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-xs text-sky-400">
                  − {formatCurrency(totalMatRef)}
                </span>
              )}
            </label>
          </div>

        </div>
      )}
    </div>
  )
}
