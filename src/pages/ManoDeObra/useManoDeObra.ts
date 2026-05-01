import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ManoDeObraCosto, ManoDeObraTipoConCosto } from '@/types/database'

const QUERY_KEY = ['mano-de-obra'] as const

export function useManoDeObra() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ManoDeObraTipoConCosto[]> => {
      const { data, error } = await supabase
        .from('mano_obra_tipos')
        .select(
          `
          id,
          tipo,
          estado,
          fecha_creacion,
          fecha_actualizacion,
          mano_obra_costos (
            costo_diario,
            fecha_desde,
            fecha_hasta
          )
        `
        )
        .order('tipo')

      if (error) throw error

      return (data ?? []).map((t) => {
        const costos = (t.mano_obra_costos ?? []) as Array<{
          costo_diario: number
          fecha_desde: string
          fecha_hasta: string | null
        }>
        const vigente = costos.find((c) => c.fecha_hasta === null)
        return {
          id: t.id,
          tipo: t.tipo,
          estado: t.estado,
          costo_diario_actual: vigente?.costo_diario ?? null,
          fecha_creacion: t.fecha_creacion,
          fecha_actualizacion: t.fecha_actualizacion,
        }
      })
    },
  })
}

export function useHistorialCostos(tipoId: string | null) {
  return useQuery({
    queryKey: ['mano-de-obra', 'historial', tipoId],
    enabled: !!tipoId,
    queryFn: async (): Promise<ManoDeObraCosto[]> => {
      const { data, error } = await supabase
        .from('mano_obra_costos')
        .select('*')
        .eq('tipo_id', tipoId!)
        .order('fecha_desde', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

interface CrearTipoInput {
  tipo: string
  costo_diario: number
}

export function useCrearTipo() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ tipo, costo_diario }: CrearTipoInput) => {
      const { data: tipoCreado, error: e1 } = await supabase
        .from('mano_obra_tipos')
        .insert({ tipo, estado: 'activo' })
        .select()
        .single()

      if (e1) throw e1

      const { error: e2 } = await supabase.from('mano_obra_costos').insert({
        tipo_id: tipoCreado.id,
        costo_diario,
        fecha_hasta: null,
      })

      if (e2) throw e2
      return tipoCreado
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

interface ActualizarTipoInput {
  id: string
  tipo?: string
  nuevoCosto?: number
}

export function useActualizarTipo() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, tipo, nuevoCosto }: ActualizarTipoInput) => {
      if (tipo !== undefined) {
        const { error } = await supabase
          .from('mano_obra_tipos')
          .update({ tipo, fecha_actualizacion: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }

      if (nuevoCosto !== undefined) {
        const ahora = new Date().toISOString()

        const { error: e1 } = await supabase
          .from('mano_obra_costos')
          .update({ fecha_hasta: ahora })
          .eq('tipo_id', id)
          .is('fecha_hasta', null)

        if (e1) throw e1

        const { error: e2 } = await supabase.from('mano_obra_costos').insert({
          tipo_id: id,
          costo_diario: nuevoCosto,
          fecha_desde: ahora,
          fecha_hasta: null,
        })

        if (e2) throw e2
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['mano-de-obra', 'historial'] })
    },
  })
}

export function useToggleEstadoTipo() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'activo' | 'inactivo' }) => {
      const { error } = await supabase
        .from('mano_obra_tipos')
        .update({ estado, fecha_actualizacion: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
