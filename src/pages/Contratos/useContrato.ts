import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

const QUERY_KEY = ['contratos'] as const

export type Contrato = Database['public']['Tables']['contratos']['Row']

// Extiende Contrato con los campos de firma (migration 0011)
export type ContratoConFirma = Contrato & {
  token_firma: string
  firma_contratista_base64: string | null
  firma_cliente_base64: string | null
  fecha_firma_cliente: string | null
  firmado_cliente: boolean
}

export type ContratoInput = Omit<
  Database['public']['Tables']['contratos']['Insert'],
  'id' | 'created_at' | 'updated_at'
> & {
  firma_contratista_base64?: string | null
  tasa_interes?: number | null
}

export function useContrato(presupuestoId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, presupuestoId],
    enabled: !!presupuestoId,
    queryFn: async (): Promise<ContratoConFirma | null> => {
      const { data, error } = await supabase
        .from('contratos')
        .select('*')
        .eq('presupuesto_id', presupuestoId!)
        .maybeSingle()
      if (error) throw error
      return data as ContratoConFirma | null
    },
  })
}

export type ContratoResumen = {
  presupuesto_id: string
  firmado_cliente: boolean
  fecha_firma_cliente: string | null
  nombre_comitente: string | null
  token_firma: string | null
}

export function useContratosResumen() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'resumen'],
    queryFn: async (): Promise<ContratoResumen[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('contratos')
        .select('presupuesto_id, firmado_cliente, fecha_firma_cliente, nombre_comitente, token_firma')
      if (error) throw error
      return (data ?? []) as ContratoResumen[]
    },
  })
}

export function useAnularFirmaCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (presupuestoId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('contratos')
        .update({
          firma_cliente_base64:  null,
          firmado_cliente:       false,
          fecha_firma_cliente:   null,
          updated_at:            new Date().toISOString(),
        })
        .eq('presupuesto_id', presupuestoId)
      if (error) throw error
    },
    onSuccess: (_data: unknown, presupuestoId: string) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, presupuestoId] })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'resumen'] })
    },
  })
}

export function useGuardarContrato() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ContratoInput) => {
      const { data, error } = await supabase
        .from('contratos')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ ...input, updated_at: new Date().toISOString() } as any, {
          onConflict: 'presupuesto_id',
        })
        .select()
        .single()
      if (error) throw error
      return data as ContratoConFirma
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, variables.presupuesto_id] })
    },
  })
}
