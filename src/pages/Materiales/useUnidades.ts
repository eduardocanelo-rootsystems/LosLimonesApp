import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const QUERY_KEY = ['unidades_medida'] as const

export interface UnidadMedida {
  id: string
  nombre: string
  activo: boolean
  orden: number
}

export function useUnidades() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UnidadMedida[]> => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('id, nombre, activo, orden')
        .eq('activo', true)
        .order('orden')
        .order('nombre')

      if (error) throw error
      return data ?? []
    },
  })
}

export function useCrearUnidad() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .insert({ nombre: nombre.trim() })
        .select()
        .single()

      if (error) throw error
      return data as UnidadMedida
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
