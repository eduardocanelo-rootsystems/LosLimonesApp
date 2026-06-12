import { useEffect, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import {
  useActualizarServicio,
  useCrearServicio,
} from './useServicios'
import { toNombrePropio } from '@/lib/utils'
import type { ServicioConPrecio } from '@/types/database'

interface ServicioFormModalProps {
  open: boolean
  onClose: () => void
  servicio?: ServicioConPrecio | null
}

export function ServicioFormModal({
  open,
  onClose,
  servicio,
}: ServicioFormModalProps) {
  const editando = !!servicio
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [error, setError] = useState<string | null>(null)

  const crear = useCrearServicio()
  const actualizar = useActualizarServicio()
  const submitting = crear.isPending || actualizar.isPending

  // Reset al abrir/cambiar de servicio
  useEffect(() => {
    if (open) {
      setNombre(servicio?.nombre ?? '')
      setPrecio(servicio?.precio_m2_actual?.toString() ?? '')
      setError(null)
    }
  }, [open, servicio])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const nombreFormateado = toNombrePropio(nombre)
    const precioNum = parseFloat(precio)

    if (!nombreFormateado) {
      setError('El nombre es obligatorio.')
      return
    }
    if (isNaN(precioNum) || precioNum < 0) {
      setError('El precio debe ser un número mayor o igual a 0.')
      return
    }

    try {
      if (editando) {
        const cambioPrecio = precioNum !== servicio.precio_m2_actual
        await actualizar.mutateAsync({
          id: servicio.id,
          nombre:
            nombreFormateado !== servicio.nombre ? nombreFormateado : undefined,
          nuevoPrecio: cambioPrecio ? precioNum : undefined,
        })
        toast.success('Servicio actualizado.')
      } else {
        await crear.mutateAsync({ nombre: nombreFormateado, precio_m2: precioNum })
        toast.success('Servicio creado.')
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
      title={editando ? 'Editar servicio' : 'Nuevo servicio'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nombre"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
            className="input-base"
            placeholder="Ej: Limpieza de fachada"
          />
          <p className="mt-1 text-xs text-ink-500">
            Se formateará automáticamente como nombre propio al guardar.
          </p>
        </div>

        <div>
          <label
            htmlFor="precio"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Precio por m² ($)
          </label>
          <input
            id="precio"
            type="number"
            step="0.01"
            min="0"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
            className="input-base font-mono"
            placeholder="0.00"
          />
          {editando &&
            servicio?.precio_m2_actual !== null &&
            parseFloat(precio) !== servicio?.precio_m2_actual && (
              <p className="mt-1.5 text-xs text-warning">
                ⚠ Al guardar, este cambio quedará registrado en el historial.
                Los presupuestos existentes mantendrán el precio anterior.
              </p>
            )}
        </div>

        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : editando ? (
              'Guardar cambios'
            ) : (
              'Crear servicio'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
