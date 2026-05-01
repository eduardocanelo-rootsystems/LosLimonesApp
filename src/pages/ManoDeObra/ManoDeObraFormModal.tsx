import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import type { ManoDeObraTipoConCosto } from '@/types/database'
import { useActualizarTipo, useCrearTipo } from './useManoDeObra'

interface ManoDeObraFormModalProps {
  open: boolean
  onClose: () => void
  tipo?: ManoDeObraTipoConCosto | null
}

export function ManoDeObraFormModal({ open, onClose, tipo }: ManoDeObraFormModalProps) {
  const editando = !!tipo
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState('')
  const [error, setError] = useState<string | null>(null)

  const crear = useCrearTipo()
  const actualizar = useActualizarTipo()
  const submitting = crear.isPending || actualizar.isPending

  useEffect(() => {
    if (open) {
      setNombre(tipo?.tipo ?? '')
      setCosto(tipo?.costo_diario_actual?.toString() ?? '')
      setError(null)
    }
  }, [open, tipo])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const nombreLimpio = nombre.trim()
    const costoNum = parseFloat(costo)

    if (!nombreLimpio) {
      setError('El tipo de empleado es obligatorio.')
      return
    }
    if (isNaN(costoNum) || costoNum < 0) {
      setError('El costo diario debe ser un número mayor o igual a 0.')
      return
    }

    try {
      if (editando) {
        const cambioCosto = costoNum !== tipo.costo_diario_actual
        await actualizar.mutateAsync({
          id: tipo.id,
          tipo: nombreLimpio !== tipo.tipo ? nombreLimpio : undefined,
          nuevoCosto: cambioCosto ? costoNum : undefined,
        })
        toast.success('Tipo de empleado actualizado.')
      } else {
        await crear.mutateAsync({ tipo: nombreLimpio, costo_diario: costoNum })
        toast.success('Tipo de empleado creado.')
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado.'
      setError(msg)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar tipo de empleado' : 'Nuevo tipo de empleado'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="mo-tipo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Tipo de empleado
          </label>
          <input
            id="mo-tipo"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
            className="input-base"
            placeholder="Ej: Oficial, Ayudante, Capataz"
          />
        </div>

        <div>
          <label
            htmlFor="mo-costo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Costo diario ($)
          </label>
          <input
            id="mo-costo"
            type="number"
            step="0.01"
            min="0"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            required
            className="input-base font-mono"
            placeholder="0.00"
          />
          {editando &&
            tipo?.costo_diario_actual !== null &&
            parseFloat(costo) !== tipo?.costo_diario_actual && (
              <p className="mt-1.5 text-xs text-warning">
                ⚠ Al guardar, este cambio quedará registrado en el historial.
                Los presupuestos existentes mantendrán el costo anterior.
              </p>
            )}
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : editando ? (
              'Guardar cambios'
            ) : (
              'Crear tipo'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
