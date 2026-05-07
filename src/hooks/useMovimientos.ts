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
  subtipo:       'compra_sf' | 'venta_sf' | null
  monto:         number
  socio_id:      string | null
  categoria:     string | null
  contraparte:   string | null
  observaciones: string | null
  metodo_cobro:  string | null
  created_at:    string
}

export interface MovimientoInput {
  fecha:         string
  descripcion:   string
  tipo:          'ingreso' | 'egreso' | 'retiro'
  subtipo:       'compra_sf' | 'venta_sf' | null
  monto:         number
  socio_id:      string | null
  categoria:     string | null
  contraparte:   string | null
  observaciones: string | null
  metodo_cobro?: string | null
}

export function useMovimientos(rango: RangoFechas) {
  return useQuery({
    queryKey: [...QK, rango],
    queryFn: async () => {
      const { data, error } = await db
        .from('movimientos')
        .select('id,fecha,descripcion,tipo,subtipo,monto,socio_id,categoria,contraparte,observaciones,metodo_cobro,created_at')
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
  importe_servicios:     number | null
  importe_total:         number | null
}

// ─── Mano de obra por período ─────────────────────────────────────────────────

export interface ManoObraTipoStat {
  tipo:             string
  totalCosto:       number
  cantPresupuestos: number
}

export interface ManoObraStats {
  byTipo:           ManoObraTipoStat[]
  totalMO:          number
  totalImporte:     number
  cantPresupuestos: number
}

export function useManoObraStats(rango: RangoFechas) {
  return useQuery({
    queryKey: ['mano_obra_stats', rango],
    queryFn: async () => {
      const { data, error } = await db
        .from('presupuesto_mano_obra')
        .select(`
          presupuesto_id,
          tipo_snapshot,
          costo_diario_snapshot,
          cantidad_empleados,
          presupuesto:presupuestos!presupuesto_mano_obra_presupuesto_id_fkey(
            estado, dias_estimados_obra, importe_total, fecha_creacion
          )
        `)
      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = (data ?? []).filter((item: any) => {
        const p = item.presupuesto
        if (!p) return false
        if (!['aprobado', 'finalizado'].includes(p.estado)) return false
        const fecha = (p.fecha_creacion as string).slice(0, 10)
        return fecha >= rango.desde && fecha <= rango.hasta
      })

      // Aggregate per tipo
      const byTipo = new Map<string, { totalCosto: number; presupuestos: Set<string> }>()
      const presupuestosVistos = new Set<string>()

      for (const item of items) {
        const dias  = (item.presupuesto.dias_estimados_obra as number | null) ?? 0
        const costo = (item.costo_diario_snapshot as number) * (item.cantidad_empleados as number) * dias

        if (!byTipo.has(item.tipo_snapshot)) {
          byTipo.set(item.tipo_snapshot, { totalCosto: 0, presupuestos: new Set() })
        }
        const entry = byTipo.get(item.tipo_snapshot)!
        entry.totalCosto += costo
        entry.presupuestos.add(item.presupuesto_id)
        presupuestosVistos.add(item.presupuesto_id)
      }

      // Total importe from unique presupuestos
      const importeByPres = new Map<string, number>()
      for (const item of items) {
        if (!importeByPres.has(item.presupuesto_id)) {
          importeByPres.set(item.presupuesto_id, (item.presupuesto.importe_total as number | null) ?? 0)
        }
      }
      const totalImporte = Array.from(importeByPres.values()).reduce((s, v) => s + v, 0)

      const sorted = Array.from(byTipo.entries())
        .map(([tipo, { totalCosto, presupuestos }]) => ({
          tipo,
          totalCosto,
          cantPresupuestos: presupuestos.size,
        }))
        .sort((a, b) => b.totalCosto - a.totalCosto)

      return {
        byTipo:           sorted,
        totalMO:          sorted.reduce((s, t) => s + t.totalCosto, 0),
        totalImporte,
        cantPresupuestos: presupuestosVistos.size,
      } satisfies ManoObraStats
    },
  })
}

export function usePresupuestosRentabilidad(rango: RangoFechas) {
  return useQuery({
    queryKey: [...QK_RENT, rango],
    queryFn: async () => {
      const { data, error } = await db
        .from('presupuestos')
        .select('id, numero, cliente_razon_social, estado, fecha_creacion, importe_servicios, importe_total')
        .in('estado', ['aprobado', 'finalizado'])
        .gte('fecha_creacion', rango.desde)
        .lte('fecha_creacion', rango.hasta + 'T23:59:59')

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id:                   p.id,
        numero:               p.numero,
        cliente_razon_social: p.cliente_razon_social,
        estado:               p.estado,
        fecha_creacion:       p.fecha_creacion,
        importe_servicios:    p.importe_servicios ? Number(p.importe_servicios) : null,
        importe_total:        p.importe_total     ? Number(p.importe_total)     : null,
      })) as PresupuestoRent[]
    },
  })
}
