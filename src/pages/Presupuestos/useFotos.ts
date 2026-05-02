import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { PresupuestoFoto } from '@/types/database'

const FOTOS_KEY = (id: string) => ['presupuestos', id, 'fotos']

export async function compressImage(file: File, maxPx = 1400, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let { width, height } = img
        if (width > maxPx || height > maxPx) {
          if (width > height) {
            height = Math.round((height * maxPx) / width)
            width = maxPx
          } else {
            width = Math.round((width * maxPx) / height)
            height = maxPx
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function useAgregarFoto(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (foto: Omit<PresupuestoFoto, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('presupuesto_fotos')
        .insert(foto)
        .select()
        .single()
      if (error) throw error
      return data as PresupuestoFoto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos', presupuestoId] })
    },
  })
}

export function useEliminarFoto(presupuestoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (fotoId: string) => {
      const { error } = await supabase
        .from('presupuesto_fotos')
        .delete()
        .eq('id', fotoId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos', presupuestoId] })
    },
  })
}

export { FOTOS_KEY }
