import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency, toNombrePropio } from '@/lib/utils'
import type { FormServicioItem, ServicioConPrecio } from '@/types/database'

interface SeccionServiciosProps {
  items: FormServicioItem[]
  catalogo: ServicioConPrecio[]
  m2: number
  coefK: number
  esAprobado?: boolean
  soloDescriptivo?: boolean
  onChange: (items: FormServicioItem[]) => void
}

export function SeccionServicios({ items, catalogo, m2, coefK, esAprobado, soloDescriptivo, onChange }: SeccionServiciosProps) {
  const [seleccionado, setSeleccionado] = useState('')

  const disponibles = catalogo.filter(
    (s) => s.estado === 'activo' && !items.some((i) => i.servicio_id === s.id)
  )

  const toggleExtra = (key: string) =>
    onChange(items.map((i) => i._key === key ? { ...i, es_adicional: !i.es_adicional } : i))

  const agregar = () => {
    const servicio = catalogo.find((s) => s.id === seleccionado)
    if (!servicio) return

    const item: FormServicioItem = {
      _key: crypto.randomUUID(),
      servicio_id: servicio.id,
      nombre: toNombrePropio(servicio.nombre),
      precio_m2: servicio.precio_m2_actual ?? 0,
      es_adicional: esAprobado ?? false,
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
        <div className="mb-4 overflow-hidden rounded-lg border border-ink-800">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Servicio</th>
                {!soloDescriptivo && (
                  <>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Precio/m²</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Subtotal</th>
                  </>
                )}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {items.map((item) => {
                const subtotal = item.precio_m2 * m2 * coefK
                return (
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
                    {!soloDescriptivo && (
                      <>
                        <td className="px-4 py-2.5 text-right font-mono text-ink-300">
                          {formatCurrency(item.precio_m2 * coefK)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-ink-100">
                          {m2 && coefK ? formatCurrency(subtotal) : '—'}
                        </td>
                      </>
                    )}
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
                )
              })}
            </tbody>
          </table>
          </div>
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
                {toNombrePropio(s.nombre)} — {s.precio_m2_actual !== null ? formatCurrency(s.precio_m2_actual) + '/m²' : 'sin precio'}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={agregar}
              disabled={!seleccionado}
              className="btn-primary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {esAprobado ? 'Agregar extra' : 'Agregar'}
            </button>
            {!esAprobado && disponibles.length > 1 && (
              <button
                type="button"
                onClick={agregarTodos}
                className="btn-secondary"
                title="Agregar todos los servicios activos del catálogo"
              >
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
