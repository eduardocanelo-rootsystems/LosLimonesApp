import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { compressImage, useAgregarFoto, useEliminarFoto } from '../useFotos'
import type { PresupuestoFoto } from '@/types/database'

const MAX_FOTOS = 6

interface SeccionFotosProps {
  presupuestoId: string | undefined
  fotos: PresupuestoFoto[]
}

export function SeccionFotos({ presupuestoId, fotos }: SeccionFotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [procesando, setProcesando] = useState(false)

  const agregar = useAgregarFoto(presupuestoId ?? '')
  const eliminar = useEliminarFoto(presupuestoId ?? '')

  const handleFiles = async (files: FileList) => {
    if (!presupuestoId) return
    const disponibles = MAX_FOTOS - fotos.length
    if (disponibles <= 0) return

    const lista = Array.from(files).slice(0, disponibles)
    setProcesando(true)
    try {
      for (let i = 0; i < lista.length; i++) {
        const base64 = await compressImage(lista[i])
        await agregar.mutateAsync({
          presupuesto_id: presupuestoId,
          orden: fotos.length + i,
          imagen_base64: base64,
          nombre: lista[i].name,
        })
      }
    } catch {
      toast.error('Error al procesar alguna imagen.')
    } finally {
      setProcesando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleEliminar = async (id: string) => {
    try {
      await eliminar.mutateAsync(id)
    } catch {
      toast.error('Error al eliminar la foto.')
    }
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
          Memoria fotográfica
        </h2>
        <span className="text-xs text-ink-500">{fotos.length}/{MAX_FOTOS} fotos</span>
      </div>

      {!presupuestoId ? (
        <p className="text-sm text-ink-500">Guardá el presupuesto primero para agregar fotos.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((foto) => (
              <div key={foto.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-ink-800">
                <img
                  src={foto.imagen_base64}
                  alt={foto.nombre ?? 'Foto de obra'}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleEliminar(foto.id)}
                  disabled={eliminar.isPending}
                  className="absolute right-1.5 top-1.5 rounded-full bg-ink-950/80 p-1 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {fotos.length < MAX_FOTOS && (
              <label className={cn(
                'flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink-700 text-ink-500 transition-colors hover:border-accent-500 hover:text-accent-400',
                procesando && 'pointer-events-none opacity-50'
              )}>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                {procesando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-xs">
                  {procesando ? 'Procesando…' : 'Agregar foto'}
                </span>
              </label>
            )}
          </div>

          {fotos.length > 0 && (
            <p className="mt-2.5 text-xs text-ink-500">
              Las fotos aparecen en una página adicional del PDF. Máximo {MAX_FOTOS}.
            </p>
          )}
        </>
      )}
    </section>
  )
}
