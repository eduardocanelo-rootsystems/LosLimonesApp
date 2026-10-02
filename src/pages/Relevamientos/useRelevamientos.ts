import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { FormServicioItem, Presupuesto } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QUERY_KEY = ['relevamientos'] as const

export interface GuardarRelevamientoInput {
  id?: string
  // Cliente
  cliente_razon_social: string
  cliente_cuit: string
  cliente_telefono: string
  cliente_direccion: string
  cliente_administrador: string
  cliente_administrador_cuit: string
  cliente_email: string
  // Edificación
  tipo: 'obra_mayor' | 'obra_menor'
  zona_trabajo: string
  trabajo_en_alturas: boolean | null
  edif_anios: number | null
  edif_altura: number | null
  edif_color: string
  edif_acabado: string[]
  edif_m2: number | null
  edif_tipologia: string
  edif_condicion_estructural: string
  edif_valor_patrimonial: boolean
  edif_proteccion: string
  edif_clase_incendio: string
  coef_k: number | null
  // Textos
  observaciones: string
  diagnostico_tecnico: string
  alcance_obra: string
  // Servicios pre-seleccionados en campo
  servicios: FormServicioItem[]
}

export function useRelevamientos() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Presupuesto[]> => {
      const { data, error } = await db
        .from('presupuestos')
        .select('*')
        .eq('estado', 'relevamiento')
        .order('fecha_creacion', { ascending: false })
      if (error) throw error
      return (data ?? []) as Presupuesto[]
    },
  })
}

export function useRelevamiento(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async (): Promise<Presupuesto> => {
      const { data, error } = await db
        .from('presupuestos')
        .select('*, presupuesto_fotos(*), presupuesto_servicios(*)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return {
        ...data,
        fotos: (data.presupuesto_fotos ?? []).sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
        servicios: data.presupuesto_servicios ?? [],
      } as Presupuesto
    },
  })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ])
}

export function useGuardarRelevamiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GuardarRelevamientoInput) => {
      const now = new Date().toISOString()
      const payload = {
        estado:                    'relevamiento',
        tipo:                      input.tipo ?? 'obra_mayor',
        zona_trabajo:              input.zona_trabajo || null,
        trabajo_en_alturas:        input.trabajo_en_alturas ?? null,
        cliente_razon_social:      input.cliente_razon_social || null,
        cliente_cuit:              input.cliente_cuit || null,
        cliente_telefono:          input.cliente_telefono || null,
        cliente_direccion:         input.cliente_direccion || null,
        cliente_administrador:     input.cliente_administrador || null,
        cliente_administrador_cuit: input.cliente_administrador_cuit || null,
        cliente_email:             input.cliente_email || null,
        edif_anios:                input.edif_anios,
        edif_altura:               input.edif_altura,
        edif_color:                input.edif_color || null,
        edif_acabado:              input.edif_acabado,
        edif_m2:                   input.edif_m2,
        edif_tipologia:            input.edif_tipologia || null,
        edif_condicion_estructural: input.edif_condicion_estructural || null,
        edif_valor_patrimonial:    input.edif_valor_patrimonial,
        edif_proteccion:           input.edif_proteccion || null,
        edif_clase_incendio:       input.edif_clase_incendio || null,
        coef_k:                    input.coef_k,
        observaciones:             input.observaciones || null,
        diagnostico_tecnico:       input.diagnostico_tecnico || null,
        alcance_obra:              input.alcance_obra || null,
        fecha_actualizacion:       now,
      }

      type SupabaseResult = { data: Presupuesto | null; error: unknown }
      let presupuestoId: string

      if (input.id) {
        const res = await withTimeout<SupabaseResult>(
          db.from('presupuestos').update(payload).eq('id', input.id).select().single(),
          30_000
        )
        if (res.error) throw res.error
        presupuestoId = input.id
        // Reemplazar servicios
        await db.from('presupuesto_servicios').delete().eq('presupuesto_id', presupuestoId)
      } else {
        const res = await withTimeout<SupabaseResult>(
          db.from('presupuestos').insert({ ...payload, fecha_creacion: now }).select().single(),
          30_000
        )
        if (res.error) throw res.error
        presupuestoId = (res.data as Presupuesto).id
      }

      if (input.servicios.length > 0) {
        await db.from('presupuesto_servicios').insert(
          input.servicios.map((s: FormServicioItem) => ({
            presupuesto_id:          presupuestoId,
            servicio_id:             s.servicio_id,
            nombre_snapshot:         s.nombre,
            precio_m2_snapshot:      s.precio_m2,
            m2_snapshot:             input.edif_m2 ?? 0,
            k_snapshot:              input.coef_k ?? 1,
            subtotal:                0,
            es_adicional:            s.es_adicional ?? false,
            es_especial:             s.es_especial ?? false,
            descripcion_especifica:  s.descripcion_especifica ?? null,
            precio_especial:         s.precio_especial ?? null,
            materiales_ref:          s.materiales_ref ? JSON.parse(JSON.stringify(s.materiales_ref)) : null,
            cliente_provee_materiales: s.cliente_provee_materiales ?? false,
          }))
        )
      }

      // Retornar el registro actualizado/creado
      const { data: finalData } = await db
        .from('presupuestos')
        .select('*')
        .eq('id', presupuestoId)
        .single()
      return finalData as Presupuesto
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      if (variables.id) {
        qc.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] })
      }
    },
  })
}

export function useExportarRelevamiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await db
        .from('presupuestos')
        .update({ estado: 'emitido', fecha_actualizacion: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Presupuesto
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
    },
  })
}
