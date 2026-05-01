import { History, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useHistorialPreciosMaterial } from './useMateriales'
import type { MaterialConPrecio } from '@/types/database'

interface HistorialPreciosMaterialModalProps {
  open: boolean
  onClose: () => void
  material: MaterialConPrecio | null
}

export function HistorialPreciosMaterialModal({
  open,
  onClose,
  material,
}: HistorialPreciosMaterialModalProps) {
  const { data: historial = [], isLoading } = useHistorialPreciosMaterial(material?.id ?? null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Historial de precios — ${material?.nombre ?? ''}`}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-accent-500" />
        </div>
      ) : historial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <History className="mb-3 h-8 w-8 text-ink-500" />
          <p className="text-sm text-ink-400">Sin registros de precio aún.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800 bg-ink-900/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Precio
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Desde
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Hasta
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-800">
              {historial.map((p) => {
                const vigente = p.fecha_hasta === null
                return (
                  <tr key={p.id} className="hover:bg-ink-900/30">
                    <td className="px-4 py-2.5 font-mono tabular text-ink-100">
                      {formatCurrency(p.precio)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-300">
                      {formatDateTime(p.fecha_desde)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ink-300">
                      {p.fecha_hasta ? formatDateTime(p.fecha_hasta) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {vigente ? (
                        <span className="badge badge-success">Vigente</span>
                      ) : (
                        <span className="badge badge-muted">Histórico</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button onClick={onClose} className="btn-secondary">
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
