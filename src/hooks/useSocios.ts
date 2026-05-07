import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK = ['socios'] as const

export interface Socio {
  id:         string
  nombre:     string
  porcentaje: number
  cuit:       string | null
  activo:     boolean
  created_at: string
  updated_at: string
}

export function useSocios() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await db.from('socios').select('id,nombre,porcentaje,cuit,activo,created_at,updated_at').order('nombre')
      if (error) throw error
      return (data ?? []) as Socio[]
    },
  })
}

export function useGuardarSocio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id?: string; nombre: string; porcentaje: number; cuit?: string | null; activo: boolean }) => {
      const ts = new Date().toISOString()
      if (input.id) {
        const { error } = await db
          .from('socios')
          .update({ nombre: input.nombre, porcentaje: input.porcentaje, cuit: input.cuit ?? null, activo: input.activo, updated_at: ts })
          .eq('id', input.id)
        if (error) throw error
      } else {
        const { error } = await db
          .from('socios')
          .insert({ nombre: input.nombre, porcentaje: input.porcentaje, cuit: input.cuit ?? null })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}
