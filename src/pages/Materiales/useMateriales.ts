import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { MaterialConPrecio, MaterialPrecio, UnidadMedida } from '@/types/database'

const QUERY_KEY = ['materiales'] as const

export function useMateriales() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<MaterialConPrecio[]> => {
      const { data, error } = await supabase
        .from('materiales')
        .select(
          `
          id,
          nombre,
          unidad,
          estado,
          fecha_creacion,
          fecha_actualizacion,
          materiales_precios (
            precio,
            fecha_desde,
            fecha_hasta
          )
        `
        )
        .order('nombre')

      if (error) throw error

      return (data ?? []).map((m) => {
        const precios = (m.materiales_precios ?? []) as Array<{
          precio: number
          fecha_desde: string
          fecha_hasta: string | null
        }>
        const vigente = precios.find((p) => p.fecha_hasta === null)
        return {
          id: m.id,
          nombre: m.nombre,
          unidad: m.unidad,
          estado: m.estado,
          precio_actual: vigente?.precio ?? null,
          fecha_creacion: m.fecha_creacion,
          fecha_actualizacion: m.fecha_actualizacion,
        }
      })
    },
  })
}

export function useHistorialPreciosMaterial(materialId: string | null) {
  return useQuery({
    queryKey: ['materiales', 'historial', materialId],
    enabled: !!materialId,
    queryFn: async (): Promise<MaterialPrecio[]> => {
      const { data, error } = await supabase
        .from('materiales_precios')
        .select('*')
        .eq('material_id', materialId!)
        .order('fecha_desde', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

interface CrearMaterialInput {
  nombre: string
  unidad: UnidadMedida
  precio: number
}

export function useCrearMaterial() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre, unidad, precio }: CrearMaterialInput) => {
      const { data: material, error: e1 } = await supabase
        .from('materiales')
        .insert({ nombre, unidad, estado: 'activo' })
        .select()
        .single()

      if (e1) throw e1

      const { error: e2 } = await supabase.from('materiales_precios').insert({
        material_id: material.id,
        precio,
        fecha_hasta: null,
      })

      if (e2) throw e2
      return material
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

interface ActualizarMaterialInput {
  id: string
  nombre?: string
  unidad?: UnidadMedida
  nuevoPrecio?: number
}

export function useActualizarMaterial() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, nombre, unidad, nuevoPrecio }: ActualizarMaterialInput) => {
      if (nombre !== undefined || unidad !== undefined) {
        const { error } = await supabase
          .from('materiales')
          .update({ nombre, unidad, fecha_actualizacion: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
      }

      if (nuevoPrecio !== undefined) {
        const ahora = new Date().toISOString()

        const { error: e1 } = await supabase
          .from('materiales_precios')
          .update({ fecha_hasta: ahora })
          .eq('material_id', id)
          .is('fecha_hasta', null)

        if (e1) throw e1

        const { error: e2 } = await supabase.from('materiales_precios').insert({
          material_id: id,
          precio: nuevoPrecio,
          fecha_desde: ahora,
          fecha_hasta: null,
        })

        if (e2) throw e2
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['materiales', 'historial'] })
    },
  })
}

export function useToggleEstadoMaterial() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'activo' | 'inactivo' }) => {
      const { error } = await supabase
        .from('materiales')
        .update({ estado, fecha_actualizacion: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
