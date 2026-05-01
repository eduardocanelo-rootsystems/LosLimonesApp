import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RangoFechas } from '@/components/shared/PeriodoSelector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK     = ['movimientos']            as const
const QK_RENT = ['presupuestos_rentabilidad'] as const

// ─── Movimientos ──────────────────────────────────────────────────────────────

export interface Movimiento {
  id:            string
  fecha:         string
  descripcion:   string
  tipo:          'ingreso' | 'egreso' | 'retiro'
  monto:         number
  socio_id:      string | null
  categoria:     string | null
  observaciones: string | null
  created_at:    string
}

export interface MovimientoInput {
  fecha:         string
  descripcion:   string
  tipo:          'ingreso' | 'egreso' | 'retiro'
  monto:         number
  socio_id:      string | null
  categoria:     string | null
  observaciones: string | null
}

export function useMovimientos(rango: RangoFechas) {
  return useQuery({
    queryKey: [...QK, rango],
    queryFn: async () => {
      const { data, error } = await db
        .from('movimientos')
        .select('*')
        .gte('fecha', rango.desde)
        .lte('fecha', rango.hasta)
        .order('fecha', { ascending: false })
      if (error) throw error
      return (data ?? []) as Movimiento[]
    },
  })
}

export function useCrearMovimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MovimientoInput) => {
      const { error } = await db.from('movimientos').insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useEliminarMovimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('movimientos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

// ─── Presupuestos para rentabilidad ──────────────────────────────────────────

export interface PresupuestoRent {
  id:                    string
  numero:                string | null
  cliente_razon_social:  string | null
  estado:                string
  fecha_creacion:        string
  total_servicios:       number
}

export function usePresupuestosRentabilidad(rango: RangoFechas) {
  return useQuery({
    queryKey: [...QK_RENT, rango],
    queryFn: async () => {
      const { data, error } = await db
        .from('presupuestos')
        .select('id, numero, cliente_razon_social, estado, fecha_creacion, presupuesto_servicios(subtotal)')
        .in('estado', ['aprobado', 'finalizado'])

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).filter((p: any) => {
        const fecha = p.fecha_creacion.slice(0, 10)
        return fecha >= rango.desde && fecha <= rango.hasta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }).map((p: any) => ({
        id:                   p.id,
        numero:               p.numero,
        cliente_razon_social: p.cliente_razon_social,
        estado:               p.estado,
        fecha_creacion:       p.fecha_creacion,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        total_servicios: (p.presupuesto_servicios ?? []).reduce((s: number, ps: any) => s + (ps.subtotal ?? 0), 0),
      })) as PresupuestoRent[]
    },
  })
}
