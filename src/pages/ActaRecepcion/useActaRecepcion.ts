import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QUERY_KEY = ['acta_recepciones'] as const

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ActaItem {
  id: string
  acta_id: string
  servicio_nombre: string
  completado: boolean
  observacion: string | null
  orden: number
}

export interface ActaRecepcion {
  id: string
  presupuesto_id: string
  fecha_recepcion_prov: string | null
  observaciones_generales: string | null
  firma_contratista_base64: string | null
  firma_cliente_base64: string | null
  firmado_cliente: boolean
  fecha_firma_cliente: string | null
  token_firma: string
  created_at: string
  updated_at: string
}

export interface ActaConItems extends ActaRecepcion {
  items: ActaItem[]
}

export interface GuardarActaInput {
  presupuesto_id: string
  fecha_recepcion_prov: string | null
  observaciones_generales: string | null
  firma_contratista_base64: string | null
  items: { servicio_nombre: string; completado: boolean; observacion: string; orden: number }[]
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useActaRecepcion(presupuestoId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, presupuestoId],
    enabled: !!presupuestoId,
    queryFn: async (): Promise<ActaConItems | null> => {
      const { data, error } = await db
        .from('acta_recepciones')
        .select('*, acta_items(*)')
        .eq('presupuesto_id', presupuestoId!)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        ...data,
        items: ((data.acta_items ?? []) as ActaItem[]).sort((a, b) => a.orden - b.orden),
      }
    },
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useGuardarActa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GuardarActaInput) => {
      // Upsert acta principal
      const { data: acta, error: actaError } = await db
        .from('acta_recepciones')
        .upsert(
          {
            presupuesto_id:          input.presupuesto_id,
            fecha_recepcion_prov:    input.fecha_recepcion_prov,
            observaciones_generales: input.observaciones_generales,
            firma_contratista_base64: input.firma_contratista_base64,
            updated_at:              new Date().toISOString(),
          },
          { onConflict: 'presupuesto_id' }
        )
        .select()
        .single()
      if (actaError) throw actaError

      // Reemplazar ítems
      await db.from('acta_items').delete().eq('acta_id', acta.id)

      if (input.items.length > 0) {
        const { error: itemsError } = await db.from('acta_items').insert(
          input.items.map((item) => ({
            acta_id:         acta.id,
            servicio_nombre: item.servicio_nombre,
            completado:      item.completado,
            observacion:     item.observacion || null,
            orden:           item.orden,
          }))
        )
        if (itemsError) throw itemsError
      }

      return acta as ActaRecepcion
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, variables.presupuesto_id] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
    },
  })
}

export function useAnularFirmaActa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presupuestoId: string) => {
      const { error } = await db
        .from('acta_recepciones')
        .update({
          firma_cliente_base64: null,
          firmado_cliente:      false,
          fecha_firma_cliente:  null,
          updated_at:           new Date().toISOString(),
        })
        .eq('presupuesto_id', presupuestoId)
      if (error) throw error
    },
    onSuccess: (_data, presupuestoId) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, presupuestoId] })
      qc.invalidateQueries({ queryKey: ['presupuestos'] })
    },
  })
}
