import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ServicioConPrecio, ServicioPrecio } from '@/types/database'

const QUERY_KEY = ['servicios'] as const

export function useServicios() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ServicioConPrecio[]> => {
      // Trae servicios con su precio vigente (vista o join manual)
      const { data, error } = await supabase
        .from('servicios')
        .select(
          `
          id,
          nombre,
          nombre_propio,
          estado,
          fecha_creacion,
          fecha_actualizacion,
          servicios_precios (
            precio_m2,
            fecha_desde,
            fecha_hasta
          )
        `
        )
        .order('nombre')

      if (error) throw error

      // Mapear: tomar el precio donde fecha_hasta es null (vigente)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((s: any) => {
        const precios = (s.servicios_precios ?? []) as Array<{
          precio_m2: number
          fecha_desde: string
          fecha_hasta: string | null
        }>
        const vigente = precios.find((p) => p.fecha_hasta === null)
        return {
          id: s.id,
          nombre: s.nombre,
          nombre_propio: s.nombre_propio ?? null,
          estado: s.estado,
          precio_m2_actual: vigente?.precio_m2 ?? null,
          fecha_creacion: s.fecha_creacion,
          fecha_actualizacion: s.fecha_actualizacion,
        }
      })
    },
  })
}

export function useHistorialPrecios(servicioId: string | null) {
  return useQuery({
    queryKey: ['servicios', 'historial', servicioId],
    enabled: !!servicioId,
    queryFn: async (): Promise<ServicioPrecio[]> => {
      const { data, error } = await supabase
        .from('servicios_precios')
        .select('*')
        .eq('servicio_id', servicioId!)
        .order('fecha_desde', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}

interface CrearServicioInput {
  nombre: string
  nombre_propio?: string | null
  precio_m2: number
}

export function useCrearServicio() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nombre, nombre_propio, precio_m2 }: CrearServicioInput) => {
      // 1. Crear el servicio
      const { data: servicio, error: e1 } = await supabase
        .from('servicios')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ nombre, nombre_propio: nombre_propio || null, estado: 'activo' } as any)
        .select()
        .single()

      if (e1) throw e1

      // 2. Crear el precio inicial (fecha_hasta=null = vigente)
      const { error: e2 } = await supabase.from('servicios_precios').insert({
        servicio_id: servicio.id,
        precio_m2,
        fecha_hasta: null,
      })

      if (e2) throw e2
      return servicio
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

interface ActualizarServicioInput {
  id: string
  nombre?: string
  nombre_propio?: string | null
  nuevoPrecio?: number
}

export function useActualizarServicio() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, nombre, nombre_propio, nuevoPrecio }: ActualizarServicioInput) => {
      // 1. Actualizar nombre/nombre_propio si cambiaron
      if (nombre !== undefined || nombre_propio !== undefined) {
        const updates: Record<string, unknown> = { fecha_actualizacion: new Date().toISOString() }
        if (nombre !== undefined) updates.nombre = nombre
        if (nombre_propio !== undefined) updates.nombre_propio = nombre_propio || null
        const { error } = await supabase
          .from('servicios')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update(updates as any)
          .eq('id', id)
        if (error) throw error
      }

      // 2. Si hay nuevo precio: cerrar el precio vigente y crear uno nuevo
      if (nuevoPrecio !== undefined) {
        const ahora = new Date().toISOString()

        // Cerrar precio vigente
        const { error: e1 } = await supabase
          .from('servicios_precios')
          .update({ fecha_hasta: ahora })
          .eq('servicio_id', id)
          .is('fecha_hasta', null)

        if (e1) throw e1

        // Insertar nuevo precio
        const { error: e2 } = await supabase.from('servicios_precios').insert({
          servicio_id: id,
          precio_m2: nuevoPrecio,
          fecha_desde: ahora,
          fecha_hasta: null,
        })

        if (e2) throw e2
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['servicios', 'historial'] })
    },
  })
}

export function useToggleEstadoServicio() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      estado,
    }: {
      id: string
      estado: 'activo' | 'inactivo'
    }) => {
      const { error } = await supabase
        .from('servicios')
        .update({ estado, fecha_actualizacion: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
