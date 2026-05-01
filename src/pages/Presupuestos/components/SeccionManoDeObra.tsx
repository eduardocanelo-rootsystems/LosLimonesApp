import { useState } from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { FormManoObraItem, ManoDeObraTipoConCosto } from '@/types/database'

interface SeccionManoDeObraProps {
  items: FormManoObraItem[]
  diasEstimados: string
  catalogo: ManoDeObraTipoConCosto[]
  esAprobado?: boolean
  onChange: (items: FormManoObraItem[]) => void
  onDiasChange: (dias: string) => void
}

export function SeccionManoDeObra({ items, diasEstimados, catalogo, esAprobado, onChange, onDiasChange }: SeccionManoDeObraProps) {
  const [seleccionado, setSeleccionado] = useState('')
  const [cantidad, setCantidad] = useState('1')

  const disponibles = catalogo.filter((t) => t.estado === 'activo')
  const dias = parseFloat(diasEstimados) || 0

  const agregar = () => {
    const tipo = catalogo.find((t) => t.id === seleccionado)
    if (!tipo) return
    const cant = parseInt(cantidad) || 1

    const item: FormManoObraItem = {
      _key: crypto.randomUUID(),
      tipo_id: tipo.id,
      tipo: tipo.tipo,
      costo_diario: tipo.costo_diario_actual ?? 0,
      cantidad_empleados: cant,
      es_adicional: esAprobado ?? false,
    }
    onChange([...items, item])
    setSeleccionado('')
    setCantidad('1')
  }

  const quitar = (key: string) => onChange(items.filter((i) => i._key !== key))

  const actualizarCantidad = (key: string, val: string) => {
    const num = parseInt(val) || 1
    onChange(items.map((i) => i._key === key ? { ...i, cantidad_empleados: num } : i))
  }

  const costoTotal = items.reduce((acc, i) => acc + i.costo_diario * i.cantidad_empleados * dias, 0)

  return (
    <section className="card overflow-hidden border-ink-700">
      <div className="flex items-center gap-2 border-b border-ink-800 bg-ink-900/70 px-6 py-4">
        <Lock className="h-4 w-4 text-ink-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          Análisis de costos · Uso interno — no se incluye en el PDF al cliente
        </span>
      </div>

      <div className="p-6">
        <div className="mb-5 flex items-center gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
              Días estimados de obra
            </label>
            <input
              type="number"
              min="1"
              value={diasEstimados}
              onChange={(e) => onDiasChange(e.target.value)}
              className="input-base w-32 font-mono"
              placeholder="Ej: 15"
            />
          </div>
        </div>

        {items.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg border border-ink-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Tipo</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Costo/día</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Empleados</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Subtotal</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {items.map((item) => {
                  const sub = item.costo_diario * item.cantidad_empleados * dias
                  return (
                    <tr key={item._key} className="hover:bg-ink-900/30">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-100">{item.tipo}</span>
                          {item.es_adicional && (
                            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                              extra
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-ink-300">
                        {formatCurrency(item.costo_diario)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad_empleados}
                          onChange={(e) => actualizarCantidad(item._key, e.target.value)}
                          className="w-16 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-center font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium text-ink-100">
                        {dias > 0 ? formatCurrency(sub) : '—'}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && dias > 0 && (
          <div className="mb-4 flex justify-end">
            <div className="rounded-md bg-ink-900 px-4 py-2 text-sm">
              <span className="text-ink-400">Costo total MO: </span>
              <span className="font-mono font-semibold text-ink-100">{formatCurrency(costoTotal)}</span>
            </div>
          </div>
        )}

        {disponibles.length > 0 ? (
          <div className="flex items-center gap-2">
            <select
              value={seleccionado}
              onChange={(e) => setSeleccionado(e.target.value)}
              className="input-base flex-1"
            >
              <option value="">Seleccionar tipo de empleado…</option>
              {disponibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tipo} — {t.costo_diario_actual !== null ? formatCurrency(t.costo_diario_actual) + '/día' : 'sin costo'}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cant."
              className="w-20 rounded border border-ink-700 bg-ink-900 px-3 py-2 text-center font-mono text-sm text-ink-100 focus:border-accent-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={agregar}
              disabled={!seleccionado}
              className="btn-secondary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              {esAprobado ? 'Agregar extra' : 'Agregar'}
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink-500">No hay tipos de empleado activos. Cargalos en Mano de Obra primero.</p>
        )}
      </div>
    </section>
  )
}
