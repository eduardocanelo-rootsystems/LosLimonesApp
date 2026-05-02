import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { FormMaterialItem, MaterialConPrecio } from '@/types/database'

interface SeccionMaterialesProps {
  items: FormMaterialItem[]
  catalogo: MaterialConPrecio[]
  esAprobado?: boolean
  onChange: (items: FormMaterialItem[]) => void
}

export function SeccionMateriales({ items, catalogo, esAprobado, onChange }: SeccionMaterialesProps) {
  const [seleccionado, setSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState('1')

  const disponibles = catalogo.filter((m) => m.estado === 'activo')

  const toggleExtra = (key: string) =>
    onChange(items.map((i) => i._key === key ? { ...i, es_adicional: !i.es_adicional } : i))

  const agregar = () => {
    const material = catalogo.find((m) => m.id === seleccionado)
    if (!material) return
    const cant = parseInt(cantidad)
    if (isNaN(cant) || cant <= 0) return

    const item: FormMaterialItem = {
      _key: crypto.randomUUID(),
      material_id: material.id,
      nombre: material.nombre,
      unidad: material.unidad,
      precio: material.precio_actual ?? 0,
      cantidad: cant,
      es_adicional: esAprobado ?? false,
    }
    onChange([...items, item])
    setSeleccionado('')
    setCantidad('1')
  }

  const agregarTodos = () => {
    const yaAgregados = new Set(items.map((i) => i.material_id))
    const nuevos: FormMaterialItem[] = disponibles
      .filter((m) => !yaAgregados.has(m.id))
      .map((m) => ({
        _key: crypto.randomUUID(),
        material_id: m.id,
        nombre: m.nombre,
        unidad: m.unidad,
        precio: m.precio_actual ?? 0,
        cantidad: 1,
        es_adicional: false,
      }))
    onChange([...items, ...nuevos])
  }

  const quitar = (key: string) => onChange(items.filter((i) => i._key !== key))

  const actualizarCantidad = (key: string, val: string) => {
    const int = parseInt(val)
    onChange(items.map((i) => i._key === key ? { ...i, cantidad: isNaN(int) || int < 1 ? i.cantidad : int } : i))
  }

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Materiales
      </h2>

      {items.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Material</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Unidad</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Precio</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Cantidad</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Subtotal</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {items.map((item) => (
                <tr key={item._key} className="hover:bg-ink-900/30">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-100">{item.nombre}</span>
                      {item.es_adicional ? (
                        <button
                          type="button"
                          onClick={() => toggleExtra(item._key)}
                          title="Clic para quitar marca de extra"
                          className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning hover:bg-warning/30 transition-colors"
                        >
                          extra ×
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleExtra(item._key)}
                          title="Clic para marcar como extra"
                          className="rounded border border-dashed border-ink-700 px-1.5 py-0.5 text-[10px] text-ink-600 hover:border-warning hover:text-warning transition-colors"
                        >
                          + extra
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-400">{item.unidad}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-ink-300">
                    {formatCurrency(item.precio)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => actualizarCantidad(item._key, e.target.value)}
                      className="w-24 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-ink-100">
                    {formatCurrency(item.precio * item.cantidad)}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => quitar(item._key)}
                      className="rounded p-1 text-ink-500 hover:text-danger transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {disponibles.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            className="input-base flex-1"
          >
            <option value="">Seleccionar material…</option>
            {disponibles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.unidad}) — {m.precio_actual !== null ? formatCurrency(m.precio_actual) : 'sin precio'}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cant."
              className="w-24 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={agregar}
              disabled={!seleccionado || !cantidad}
              className="btn-primary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {esAprobado ? 'Agregar extra' : 'Agregar'}
            </button>
            {!esAprobado && disponibles.filter((m) => !items.some((i) => i.material_id === m.id)).length > 1 && (
              <button
                type="button"
                onClick={agregarTodos}
                className="btn-secondary"
                title="Agregar todos los materiales activos del catálogo con cantidad 1"
              >
                Agregar todos ({disponibles.filter((m) => !items.some((i) => i.material_id === m.id)).length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-500">No hay materiales activos. Cargá materiales en el catálogo primero.</p>
      )}
    </section>
  )
}
