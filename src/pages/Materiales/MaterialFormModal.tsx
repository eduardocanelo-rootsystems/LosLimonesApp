import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import type { MaterialConPrecio } from '@/types/database'
import { useActualizarMaterial, useCrearMaterial } from './useMateriales'
import { useCrearUnidad, useUnidades } from './useUnidades'

interface MaterialFormModalProps {
  open: boolean
  onClose: () => void
  material?: MaterialConPrecio | null
}

export function MaterialFormModal({ open, onClose, material }: MaterialFormModalProps) {
  const editando = !!material
  const [nombre, setNombre] = useState('')
  const [unidad, setUnidad] = useState('')
  const [precio, setPrecio] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [agregandoUnidad, setAgregandoUnidad] = useState(false)
  const [nuevaUnidad, setNuevaUnidad] = useState('')
  const nuevaUnidadRef = useRef<HTMLInputElement>(null)

  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades()
  const crear = useCrearMaterial()
  const actualizar = useActualizarMaterial()
  const crearUnidad = useCrearUnidad()
  const submitting = crear.isPending || actualizar.isPending

  useEffect(() => {
    if (open) {
      setNombre(material?.nombre ?? '')
      setUnidad(material?.unidad ?? '')
      setPrecio(material?.precio_actual?.toString() ?? '')
      setError(null)
      setAgregandoUnidad(false)
      setNuevaUnidad('')
    }
  }, [open, material])

  // Seleccionar la primera unidad disponible si no hay ninguna seleccionada
  useEffect(() => {
    if (open && !unidad && unidades.length > 0) {
      setUnidad(unidades[0].nombre)
    }
  }, [open, unidades, unidad])

  // Focus al input de nueva unidad cuando se abre
  useEffect(() => {
    if (agregandoUnidad) {
      setTimeout(() => nuevaUnidadRef.current?.focus(), 50)
    }
  }, [agregandoUnidad])

  const handleGuardarUnidad = async () => {
    const nombre = nuevaUnidad.trim()
    if (!nombre) return

    const yaExiste = unidades.some((u) => u.nombre.toLowerCase() === nombre.toLowerCase())
    if (yaExiste) {
      setUnidad(nombre)
      setAgregandoUnidad(false)
      setNuevaUnidad('')
      return
    }

    try {
      const creada = await crearUnidad.mutateAsync(nombre)
      setUnidad(creada.nombre)
      setAgregandoUnidad(false)
      setNuevaUnidad('')
      toast.success(`Unidad "${creada.nombre}" creada.`)
    } catch {
      toast.error('No se pudo crear la unidad.')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const nombreLimpio = nombre.trim()
    const precioNum = parseFloat(precio)

    if (!nombreLimpio) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!unidad) {
      setError('La unidad de medida es obligatoria.')
      return
    }
    if (isNaN(precioNum) || precioNum < 0) {
      setError('El precio debe ser un número mayor o igual a 0.')
      return
    }

    try {
      if (editando) {
        const cambioPrecio = precioNum !== material.precio_actual
        await actualizar.mutateAsync({
          id: material.id,
          nombre: nombreLimpio !== material.nombre ? nombreLimpio : undefined,
          unidad: unidad !== material.unidad ? unidad : undefined,
          nuevoPrecio: cambioPrecio ? precioNum : undefined,
        })
        toast.success('Material actualizado.')
      } else {
        await crear.mutateAsync({ nombre: nombreLimpio, unidad, precio: precioNum })
        toast.success('Material creado.')
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado.'
      setError(msg)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editando ? 'Editar material' : 'Nuevo material'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="mat-nombre"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Nombre
          </label>
          <input
            id="mat-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
            className="input-base"
            placeholder="Ej: Pintura látex exterior"
          />
        </div>

        <div>
          <label
            htmlFor="mat-unidad"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Unidad de medida
          </label>

          {!agregandoUnidad ? (
            <div className="flex items-center gap-2">
              <select
                id="mat-unidad"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="input-base flex-1"
                disabled={loadingUnidades}
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.nombre}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAgregandoUnidad(true)}
                className="rounded-md border border-ink-700 p-2 text-ink-400 transition-colors hover:border-accent-500 hover:text-accent-500"
                title="Agregar nueva unidad"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={nuevaUnidadRef}
                type="text"
                value={nuevaUnidad}
                onChange={(e) => setNuevaUnidad(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleGuardarUnidad() }
                  if (e.key === 'Escape') { setAgregandoUnidad(false); setNuevaUnidad('') }
                }}
                className="input-base flex-1"
                placeholder="Nueva unidad (ej: Saco, Tubo…)"
              />
              <button
                type="button"
                onClick={handleGuardarUnidad}
                disabled={!nuevaUnidad.trim() || crearUnidad.isPending}
                className="rounded-md border border-ink-700 p-2 text-ink-400 transition-colors hover:border-accent-500 hover:text-accent-500 disabled:opacity-40"
                title="Guardar unidad"
              >
                {crearUnidad.isPending
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Check className="h-4 w-4" />
                }
              </button>
              <button
                type="button"
                onClick={() => { setAgregandoUnidad(false); setNuevaUnidad('') }}
                className="rounded-md border border-ink-700 p-2 text-ink-400 transition-colors hover:border-danger hover:text-danger"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="mat-precio"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400"
          >
            Precio ($)
          </label>
          <input
            id="mat-precio"
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
            material?.precio_actual !== null &&
            parseFloat(precio) !== material?.precio_actual && (
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
              'Crear material'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
