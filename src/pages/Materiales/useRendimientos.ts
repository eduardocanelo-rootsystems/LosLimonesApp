import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RangoFechas } from '@/components/shared/PeriodoSelector'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK = ['rendimientos'] as const

export interface RendimientoMaterial {
  material_id:           string | null
  nombre:                string
  unidad:                string
  n_obras:               number
  cantidad_total:        number
  m2_total:              number
  rendimiento_promedio:  number   // weighted: cantidad_total / m2_total
  rendimiento_min:       number   // min por obra individual
  rendimiento_max:       number   // max por obra individual
  rendimiento_base:      number | null  // guardado en materiales.rendimiento_m2
}

export interface RendimientosResult {
  materiales:      RendimientoMaterial[]
  n_presupuestos:  number
}

export function useRendimientosData(rango?: RangoFechas) {
  return useQuery({
    queryKey: rango ? [...QK, rango.desde, rango.hasta] : QK,
    queryFn: async (): Promise<RendimientosResult> => {

      // 1. Presupuestos aprobados/finalizados con m² válido
      let q = supabase
        .from('presupuestos')
        .select('id, edif_m2')
        .in('estado', ['aprobado', 'finalizado'])
        .not('edif_m2', 'is', null)
        .gt('edif_m2', 0)
      if (rango) {
        q = q.gte('fecha_creacion', rango.desde).lte('fecha_creacion', rango.hasta + 'T23:59:59')
      }
      const { data: presData, error: e1 } = await q
      if (e1) throw e1
      if (!presData?.length) return { materiales: [], n_presupuestos: 0 }

      const ids   = presData.map((p: { id: string }) => p.id)
      const m2Map = new Map<string, number>(
        presData.map((p: { id: string; edif_m2: number }) => [p.id, p.edif_m2])
      )

      // 2. Ítems de materiales de esos presupuestos
      const { data: items, error: e2 } = await supabase
        .from('presupuesto_materiales')
        .select('material_id, nombre_snapshot, unidad_snapshot, cantidad, presupuesto_id')
        .in('presupuesto_id', ids)
      if (e2) throw e2

      // 3. Rendimientos base del catálogo (usa `db` por columna fuera de los tipos generados)
      const { data: catalogo, error: e3 } = await db
        .from('materiales')
        .select('id, rendimiento_m2')
      if (e3) throw e3

      const baseMap = new Map<string, number | null>(
        (catalogo ?? []).map((m: { id: string; rendimiento_m2: number | null }) => [
          m.id,
          m.rendimiento_m2,
        ])
      )

      // 4. Agrupar por material y acumular cantidades / m²
      type Grupo = {
        material_id: string | null
        nombre:      string
        unidad:      string
        cantidades:  number[]
        m2s:         number[]
      }

      const grouped = new Map<string, Grupo>()

      for (const item of items ?? []) {
        const m2 = m2Map.get(item.presupuesto_id)
        if (!m2 || m2 <= 0) continue

        const key = item.material_id ?? `__${item.nombre_snapshot}`
        if (!grouped.has(key)) {
          grouped.set(key, {
            material_id: item.material_id,
            nombre:      item.nombre_snapshot,
            unidad:      item.unidad_snapshot,
            cantidades:  [],
            m2s:         [],
          })
        }
        const g = grouped.get(key)!
        g.cantidades.push(Number(item.cantidad))
        g.m2s.push(m2)
      }

      // 5. Calcular estadísticas por grupo
      const materiales: RendimientoMaterial[] = Array.from(grouped.values())
        .map((g) => {
          const cantidad_total = g.cantidades.reduce((a, b) => a + b, 0)
          const m2_total       = g.m2s.reduce((a, b) => a + b, 0)
          const porObra        = g.cantidades.map((c, i) => c / g.m2s[i])

          return {
            material_id:          g.material_id,
            nombre:               g.nombre,
            unidad:               g.unidad,
            n_obras:              g.cantidades.length,
            cantidad_total,
            m2_total,
            rendimiento_promedio: cantidad_total / m2_total,
            rendimiento_min:      Math.min(...porObra),
            rendimiento_max:      Math.max(...porObra),
            rendimiento_base:     g.material_id ? (baseMap.get(g.material_id) ?? null) : null,
          }
        })
        .sort((a, b) => b.n_obras - a.n_obras || a.nombre.localeCompare(b.nombre, 'es'))

      return { materiales, n_presupuestos: presData.length }
    },
  })
}

export function useActualizarRendimiento() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      materialId,
      rendimiento,
    }: {
      materialId: string
      rendimiento: number
    }) => {
      const { error } = await db
        .from('materiales')
        .update({ rendimiento_m2: rendimiento, fecha_actualizacion: new Date().toISOString() })
        .eq('id', materialId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}
