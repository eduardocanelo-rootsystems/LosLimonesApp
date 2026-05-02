import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RangoFechas } from '@/components/shared/PeriodoSelector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK = ['rendimientos_mano_obra'] as const

export interface RendimientoManoObra {
  tipo_id:            string | null  // null si el tipo fue eliminado del catálogo
  tipo:               string
  n_obras:            number          // presupuestos donde apareció este tipo
  empleados_promedio: number          // promedio de cantidad_empleados
  costo_diario_prom:  number          // promedio ponderado de costo_diario_snapshot (por días)
  costo_diario_base:  number | null   // costo vigente en catálogo (fecha_hasta IS NULL)
  costo_m2_promedio:  number | null   // costo total / m² total (null si no hay m²)
  costo_m2_min:       number | null
  costo_m2_max:       number | null
  total_costo:        number          // suma(costo_diario × empleados × dias)
  total_m2:           number          // m² totales de presupuestos incluidos con m² válido
}

export interface RendimientosManoObraResult {
  tipos:          RendimientoManoObra[]
  n_presupuestos: number
}

export function useRendimientosManoObraData(rango?: RangoFechas) {
  return useQuery({
    queryKey: rango ? [...QK, rango.desde, rango.hasta] : QK,
    queryFn: async (): Promise<RendimientosManoObraResult> => {

      // 1. Presupuestos aprobados/finalizados en el período
      let q = supabase
        .from('presupuestos')
        .select('id, edif_m2, dias_estimados_obra')
        .in('estado', ['aprobado', 'finalizado'])
        .not('dias_estimados_obra', 'is', null)
        .gt('dias_estimados_obra', 0)
      if (rango) {
        q = q.gte('fecha_creacion', rango.desde).lte('fecha_creacion', rango.hasta + 'T23:59:59')
      }
      const { data: presData, error: e1 } = await q
      if (e1) throw e1
      if (!presData?.length) return { tipos: [], n_presupuestos: 0 }

      const ids    = presData.map((p: { id: string }) => p.id)
      const diasMap = new Map<string, number>(
        presData.map((p: { id: string; dias_estimados_obra: number }) => [p.id, p.dias_estimados_obra])
      )
      const m2Map = new Map<string, number | null>(
        presData.map((p: { id: string; edif_m2: number | null }) => [p.id, p.edif_m2])
      )

      // 2. Ítems de mano de obra de esos presupuestos
      const { data: items, error: e2 } = await supabase
        .from('presupuesto_mano_obra')
        .select('tipo_id, tipo_snapshot, costo_diario_snapshot, cantidad_empleados, presupuesto_id')
        .in('presupuesto_id', ids)
      if (e2) throw e2

      // 3. Costos vigentes del catálogo (fecha_hasta IS NULL)
      const { data: catalogoRaw, error: e3 } = await db
        .from('mano_obra_costos')
        .select('tipo_id, costo_diario')
        .is('fecha_hasta', null)
      if (e3) throw e3

      const baseMap = new Map<string, number>(
        (catalogoRaw ?? []).map((c: { tipo_id: string; costo_diario: number }) => [
          c.tipo_id,
          c.costo_diario,
        ])
      )

      // 4. Agrupar por tipo
      type Grupo = {
        tipo_id:    string | null
        tipo:       string
        empleados:  number[]          // cantidad_empleados por aparición
        costos:     number[]          // costo_diario_snapshot × dias (por aparición)
        costosM2:   (number | null)[] // costo total / m² por aparición (null si sin m²)
        totalCosto: number
        totalM2:    number
        presupuestosIds: Set<string>
      }

      const grouped = new Map<string, Grupo>()

      for (const item of items ?? []) {
        const dias = diasMap.get(item.presupuesto_id) ?? 0
        const m2   = m2Map.get(item.presupuesto_id) ?? null
        const costoAplic = (item.costo_diario_snapshot as number) * (item.cantidad_empleados as number) * dias
        const costoM2    = m2 && m2 > 0 ? costoAplic / m2 : null

        const key = item.tipo_id ?? `__${item.tipo_snapshot}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            tipo_id:         item.tipo_id,
            tipo:            item.tipo_snapshot,
            empleados:       [],
            costos:          [],
            costosM2:        [],
            totalCosto:      0,
            totalM2:         0,
            presupuestosIds: new Set(),
          })
        }
        const g = grouped.get(key)!
        g.empleados.push(item.cantidad_empleados as number)
        g.costos.push((item.costo_diario_snapshot as number) * dias)
        g.costosM2.push(costoM2)
        g.totalCosto += costoAplic
        if (m2 && m2 > 0) g.totalM2 += m2
        g.presupuestosIds.add(item.presupuesto_id)
      }

      // 5. Calcular estadísticas por grupo
      const tipos: RendimientoManoObra[] = Array.from(grouped.values()).map((g) => {
        const n = g.empleados.length
        const empleados_promedio = g.empleados.reduce((a, b) => a + b, 0) / n
        // Promedio ponderado del costo_diario por días laborados
        const totalDias  = g.costos.reduce((a, b) => a + b, 0)
        const totalEmps  = g.empleados.reduce((a, b) => a + b, 0)
        const costo_diario_prom = totalEmps > 0 ? totalDias / totalEmps : 0

        const m2Vals = g.costosM2.filter((v): v is number => v !== null)
        const costo_m2_promedio = g.totalM2 > 0 ? g.totalCosto / g.totalM2 : null
        const costo_m2_min = m2Vals.length ? Math.min(...m2Vals) : null
        const costo_m2_max = m2Vals.length ? Math.max(...m2Vals) : null

        return {
          tipo_id:            g.tipo_id,
          tipo:               g.tipo,
          n_obras:            g.presupuestosIds.size,
          empleados_promedio,
          costo_diario_prom,
          costo_diario_base:  g.tipo_id ? (baseMap.get(g.tipo_id) ?? null) : null,
          costo_m2_promedio,
          costo_m2_min,
          costo_m2_max,
          total_costo:        g.totalCosto,
          total_m2:           g.totalM2,
        }
      }).sort((a, b) => b.n_obras - a.n_obras || a.tipo.localeCompare(b.tipo, 'es'))

      return { tipos, n_presupuestos: presData.length }
    },
  })
}

export function useActualizarCostoDiario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ tipoId, costo }: { tipoId: string; costo: number }) => {
      const ahora = new Date().toISOString()
      const { error: e1 } = await supabase
        .from('mano_obra_costos')
        .update({ fecha_hasta: ahora })
        .eq('tipo_id', tipoId)
        .is('fecha_hasta', null)
      if (e1) throw e1
      const { error: e2 } = await supabase.from('mano_obra_costos').insert({
        tipo_id:    tipoId,
        costo_diario: costo,
        fecha_desde:  ahora,
        fecha_hasta:  null,
      })
      if (e2) throw e2
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK })
      qc.invalidateQueries({ queryKey: ['mano-de-obra'] })
    },
  })
}
