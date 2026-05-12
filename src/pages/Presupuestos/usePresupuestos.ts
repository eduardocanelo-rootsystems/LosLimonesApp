import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  EstadoPresupuesto,
  FormManoObraItem,
  FormMaterialItem,
  FormServicioItem,
  Presupuesto,
  PresupuestoCompleto,
} from '@/types/database'

const QUERY_KEY = ['presupuestos'] as const

// ─── Lista ────────────────────────────────────────────────────────────────────

export function usePresupuestos() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Presupuesto[]> => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select('*')
        .neq('estado', 'relevamiento')
        .order('fecha_creacion', { ascending: false })

      if (error) throw error
      return (data ?? []) as Presupuesto[]
    },
  })
}

// ─── Individual ───────────────────────────────────────────────────────────────

export function usePresupuesto(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    enabled: !!id,
    queryFn: async (): Promise<PresupuestoCompleto> => {
      const { data, error } = await supabase
        .from('presupuestos')
        .select(`
          *,
          presupuesto_servicios (*),
          presupuesto_materiales (*),
          presupuesto_mano_obra (*),
          presupuesto_fotos (*)
        `)
        .eq('id', id!)
        .single()

      if (error) throw error
      return {
        ...data,
        servicios: data.presupuesto_servicios ?? [],
        materiales: data.presupuesto_materiales ?? [],
        mano_obra: data.presupuesto_mano_obra ?? [],
        fotos: (data.presupuesto_fotos ?? []).sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden),
      } as PresupuestoCompleto
    },
  })
}

// ─── Guardar (crear o actualizar) ────────────────────────────────────────────

export interface GuardarPresupuestoInput {
  id?: string
  estado: EstadoPresupuesto
  // Cliente
  cliente_razon_social: string
  cliente_cuit: string
  cliente_telefono: string
  cliente_direccion: string
  cliente_administrador: string
  cliente_administrador_cuit: string
  cliente_email: string
  // Edificación
  edif_anios: number | null
  edif_altura: number | null
  edif_color: string
  edif_acabado: string[]
  edif_m2: number | null
  edif_condicion_estructural: string
  edif_tipologia: string
  edif_clase_incendio: string
  edif_valor_patrimonial: boolean
  edif_proteccion: string
  coef_k: number | null
  // Otros
  observaciones: string
  diagnostico_tecnico: string | null
  alcance_obra: string | null
  exenciones: string | null
  tiene_garantia: boolean | null
  garantia_vencimiento: string | null
  descuento_tipo: 'fijo' | 'porcentaje' | null
  descuento_valor: number | null
  iva_pct: number
  dias_estimados_obra: number | null
  fecha_aprobacion: string | null
  plan_pago: 'contado' | '60dias' | '90dias' | null
  importe_servicios: number | null  // servicios netos con IVA y recargo (snapshot al guardar)
  importe_total: number | null      // total al cliente con IVA y recargo (snapshot al guardar)
  // Ítems
  servicios: FormServicioItem[]
  materiales: FormMaterialItem[]
  mano_obra: FormManoObraItem[]
}

export function useGuardarPresupuesto() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: GuardarPresupuestoInput) => {
      const esNuevo = !input.id

      // 1. Obtener número si es nuevo
      let numero: string | undefined
      if (esNuevo) {
        const { data: numData, error: numError } = await supabase.rpc('next_presupuesto_numero')
        if (numError) throw numError
        numero = numData as string
      }

      const presupuestoData = {
        numero: numero,
        estado: input.estado,
        cliente_razon_social: input.cliente_razon_social || null,
        cliente_cuit: input.cliente_cuit || null,
        cliente_telefono: input.cliente_telefono || null,
        cliente_direccion: input.cliente_direccion || null,
        cliente_administrador: input.cliente_administrador || null,
        cliente_administrador_cuit: input.cliente_administrador_cuit || null,
        cliente_email: input.cliente_email || null,
        edif_anios: input.edif_anios,
        edif_altura: input.edif_altura,
        edif_color: input.edif_color || null,
        edif_acabado: input.edif_acabado,
        edif_m2: input.edif_m2,
        edif_condicion_estructural: input.edif_condicion_estructural || null,
        edif_tipologia: input.edif_tipologia || null,
        edif_clase_incendio: input.edif_clase_incendio || null,
        edif_valor_patrimonial: input.edif_valor_patrimonial,
        edif_proteccion: input.edif_proteccion || null,
        coef_k: input.coef_k,
        observaciones: input.observaciones || null,
        diagnostico_tecnico: input.diagnostico_tecnico || null,
        alcance_obra: input.alcance_obra || null,
        exenciones: input.exenciones || null,
        tiene_garantia: input.tiene_garantia,
        garantia_vencimiento: input.garantia_vencimiento || null,
        descuento_tipo: input.descuento_tipo,
        descuento_valor: input.descuento_valor,
        iva_pct: input.iva_pct,
        dias_estimados_obra: input.dias_estimados_obra,
        fecha_aprobacion: input.fecha_aprobacion,
        plan_pago: input.plan_pago,
        importe_servicios: input.importe_servicios,
        importe_total: input.importe_total,
        fecha_actualizacion: new Date().toISOString(),
      }

      let presupuestoId: string

      if (esNuevo) {
        const { data, error } = await supabase
          .from('presupuestos')
          .insert(presupuestoData)
          .select()
          .single()
        if (error) throw error
        presupuestoId = data.id
      } else {
        const { error } = await supabase
          .from('presupuestos')
          .update(presupuestoData)
          .eq('id', input.id!)
        if (error) throw error
        presupuestoId = input.id!

        // Eliminar ítems existentes para re-insertar
        await supabase.from('presupuesto_servicios').delete().eq('presupuesto_id', presupuestoId)
        await supabase.from('presupuesto_materiales').delete().eq('presupuesto_id', presupuestoId)
        await supabase.from('presupuesto_mano_obra').delete().eq('presupuesto_id', presupuestoId)
      }

      const m2 = input.edif_m2 ?? 0
      const k = input.coef_k ?? 1

      // Insertar servicios
      if (input.servicios.length > 0) {
        const { error } = await supabase.from('presupuesto_servicios').insert(
          input.servicios.map((s) => ({
            presupuesto_id: presupuestoId,
            servicio_id: s.servicio_id,
            nombre_snapshot: s.nombre,
            precio_m2_snapshot: s.precio_m2,
            m2_snapshot: m2,
            k_snapshot: k,
            subtotal: s.precio_m2 * m2 * k,
            es_adicional: s.es_adicional ?? false,
          }))
        )
        if (error) throw error
      }

      // Insertar materiales
      if (input.materiales.length > 0) {
        const { error } = await supabase.from('presupuesto_materiales').insert(
          input.materiales.map((m) => ({
            presupuesto_id: presupuestoId,
            material_id: m.material_id,
            nombre_snapshot: m.nombre,
            unidad_snapshot: m.unidad,
            precio_snapshot: m.precio,
            cantidad: m.cantidad,
            subtotal: m.precio * m.cantidad,
            es_adicional: m.es_adicional ?? false,
          }))
        )
        if (error) throw error
      }

      // Insertar mano de obra
      if (input.mano_obra.length > 0) {
        const { error } = await supabase.from('presupuesto_mano_obra').insert(
          input.mano_obra.map((mo) => ({
            presupuesto_id: presupuestoId,
            tipo_id: mo.tipo_id,
            tipo_snapshot: mo.tipo,
            costo_diario_snapshot: mo.costo_diario,
            cantidad_empleados: mo.cantidad_empleados,
            es_adicional: mo.es_adicional ?? false,
          }))
        )
        if (error) throw error
      }

      return { id: presupuestoId, numero }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

// ─── Asociar factura ──────────────────────────────────────────────────────────

export function useAsociarFacturaPresupuesto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ presupuestoId, facturaId }: { presupuestoId: string; facturaId: string | null }) => {
      const { error } = await supabase
        .from('presupuestos')
        .update({ factura_asociada_id: facturaId, fecha_actualizacion: new Date().toISOString() })
        .eq('id', presupuestoId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────

export function useCambiarEstado() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: EstadoPresupuesto }) => {
      const updates = {
        estado,
        fecha_actualizacion: new Date().toISOString(),
        ...(estado === 'aprobado' ? { fecha_aprobacion: new Date().toISOString() } : {}),
      }
      const { error } = await supabase.from('presupuestos').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, variables.id] })
    },
  })
}
