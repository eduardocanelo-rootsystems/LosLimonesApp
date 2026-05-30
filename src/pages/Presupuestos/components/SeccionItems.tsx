import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { FormPresupuestoItem, ServicioConPrecio } from '@/types/database'

interface SeccionItemsProps {
  items: FormPresupuestoItem[]
  catalogo: ServicioConPrecio[]
  esAprobado?: boolean
  onChange: (items: FormPresupuestoItem[]) => void
}

export function SeccionItems({ items, catalogo, esAprobado, onChange }: SeccionItemsProps) {
  const [seleccionado, setSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')

  const disponibles = catalogo.filter((s) => s.estado === 'activo')

  const handleSeleccion = (servicioId: string) => {
    setSeleccionado(servicioId)
    const srv = catalogo.find((s) => s.id === servicioId)
    if (srv?.precio_m2_actual != null) {
      setPrecio(String(srv.precio_m2_actual))
    } else {
      setPrecio('')
    }
  }

  const agregar = () => {
    const srv = catalogo.find((s) => s.id === seleccionado)
    if (!srv) return
    const cant = parseFloat(cantidad) || 1
    const precioNum = parseFloat(precio) || 0

    const item: FormPresupuestoItem = {
      _key: crypto.randomUUID(),
      servicio_id: srv.id,
      nombre: srv.nombre,
      precio_unitario: precioNum,
      cantidad: cant,
      es_adicional: esAprobado ?? false,
    }
    onChange([...items, item])
    setSeleccionado('')
    setCantidad('1')
    setPrecio('')
  }

  const quitar = (key: string) => onChange(items.filter((i) => i._key !== key))

  const actualizar = (key: string, field: 'precio_unitario' | 'cantidad', val: string) => {
    const num = parseFloat(val) || 0
    onChange(items.map((i) => i._key === key ? { ...i, [field]: num } : i))
  }

  const subtotal = items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0)

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Servicios
      </h2>

      {items.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg border border-ink-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Servicio</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Precio unit.</th>
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
                        {item.es_adicional && (
                          <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                            extra
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        min="0"
                        value={item.precio_unitario || ''}
                        onChange={(e) => actualizar(item._key, 'precio_unitario', e.target.value)}
                        className="w-28 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.cantidad || ''}
                        onChange={(e) => actualizar(item._key, 'cantidad', e.target.value)}
                        className="w-20 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-center font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-ink-100">
                      {formatCurrency(item.precio_unitario * item.cantidad)}
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
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-4 flex justify-end">
          <div className="rounded-md bg-ink-900 px-4 py-2 text-sm">
            <span className="text-ink-400">Subtotal servicios: </span>
            <span className="font-mono font-semibold text-ink-100">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}

      {disponibles.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Seleccionar servicio"
            value={seleccionado}
            onChange={(e) => handleSeleccion(e.target.value)}
            className="input-base flex-1 min-w-[200px]"
          >
            <option value="">Seleccionar servicio del catálogo…</option>
            {disponibles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
                {s.precio_m2_actual != null ? ` — ${formatCurrency(s.precio_m2_actual)}` : ''}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Precio"
            className="w-32 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-right font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Cant."
            className="w-20 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-center font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={!seleccionado || !precio}
            className="btn-secondary disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            {esAprobado ? 'Agregar extra' : 'Agregar'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink-500">No hay servicios activos en el catálogo.</p>
      )}
    </section>
  )
}
