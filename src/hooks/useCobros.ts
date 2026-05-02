import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RangoFechas } from '@/components/shared/PeriodoSelector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK = ['presupuesto_cobros'] as const

export interface Cobro {
  id:             string
  presupuesto_id: string
  numero_cuota:   number
  monto:          number
  fecha_cobro:    string
  observacion:    string | null
  created_at:     string
}

export interface CobrosConPresupuesto extends Cobro {
  presupuesto: {
    numero:               string | null
    cliente_razon_social: string | null
    importe_servicios:    number | null
    importe_total:        number | null
  }
}

// ─── Por presupuesto ──────────────────────────────────────────────────────────

export function useCobrosPresupuesto(presupuestoId: string | undefined) {
  return useQuery({
    queryKey: [...QK, presupuestoId],
    enabled:  !!presupuestoId,
    queryFn:  async () => {
      const { data, error } = await db
        .from('presupuesto_cobros')
        .select('*')
        .eq('presupuesto_id', presupuestoId)
        .order('numero_cuota')
      if (error) throw error
      return (data ?? []) as Cobro[]
    },
  })
}

// ─── Por período (para dashboard) ─────────────────────────────────────────────

export function useCobrosPeriodo(rango: RangoFechas) {
  return useQuery({
    queryKey: [...QK, 'periodo', rango],
    queryFn:  async () => {
      const { data, error } = await db
        .from('presupuesto_cobros')
        .select(`
          *,
          presupuesto:presupuestos!presupuesto_cobros_presupuesto_id_fkey(
            numero, cliente_razon_social, importe_servicios, importe_total
          )
        `)
        .gte('fecha_cobro', rango.desde)
        .lte('fecha_cobro', rango.hasta)
        .order('fecha_cobro', { ascending: false })
      if (error) throw error
      return (data ?? []) as CobrosConPresupuesto[]
    },
  })
}

// ─── Registrar cobro ──────────────────────────────────────────────────────────

export interface RegistrarCobroInput {
  presupuesto_id: string
  numero_cuota:   number
  monto:          number
  fecha_cobro:    string
  observacion?:   string
}

export function useRegistrarCobro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegistrarCobroInput) => {
      const { error } = await db
        .from('presupuesto_cobros')
        .upsert(
          {
            presupuesto_id: input.presupuesto_id,
            numero_cuota:   input.numero_cuota,
            monto:          input.monto,
            fecha_cobro:    input.fecha_cobro,
            observacion:    input.observacion ?? null,
          },
          { onConflict: 'presupuesto_id,numero_cuota' }
        )
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: [...QK, v.presupuesto_id] })
      qc.invalidateQueries({ queryKey: [...QK, 'periodo'] })
    },
  })
}

// ─── Eliminar cobro ───────────────────────────────────────────────────────────

export function useEliminarCobro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, presupuestoId }: { id: string; presupuestoId: string }) => {
      const { error } = await db.from('presupuesto_cobros').delete().eq('id', id)
      if (error) throw error
      return presupuestoId
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: [...QK, v.presupuestoId] })
      qc.invalidateQueries({ queryKey: [...QK, 'periodo'] })
    },
  })
}
