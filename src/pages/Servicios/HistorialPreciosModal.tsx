import { Loader2, History } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { useHistorialPrecios } from './useServicios'
import type { ServicioConPrecio } from '@/types/database'

interface HistorialPreciosModalProps {
  open: boolean
  onClose: () => void
  servicio: ServicioConPrecio | null
}

export function HistorialPreciosModal({
  open,
  onClose,
  servicio,
}: HistorialPreciosModalProps) {
  const { data: historial = [], isLoading } = useHistorialPrecios(
    servicio?.id ?? null
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Historial de precios — ${servicio?.nombre ?? ''}`}
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
                      {formatCurrency(p.precio_m2)}
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
