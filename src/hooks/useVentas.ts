import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TIPOS_NC, type FilaEmitida } from '@/lib/arcaParser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CuentaArca {
  id:         string
  nombre:     string
  cuit:       string
  activo:     boolean
  created_at: string
  updated_at: string
}

export interface FacturaEmitida {
  id:                  string
  cuenta_arca_id:      string | null
  cuit_emisor:         string
  fecha_emision:       string
  tipo_comprobante:    string
  punto_venta:         string
  numero:              string
  cae:                 string | null
  denominacion:        string | null
  cuit_receptor:       string | null
  imp_total:           number
  fecha_cobro:         string | null
  forma_pago:          string | null
  nro_comprobante:     string | null
  fecha_vencimiento:   string | null
  anulada:             boolean
  factura_asociada_id: string | null
  synced_at:           string
  updated_at:          string
}

export interface ActualizarCobranzaInput {
  id:              string
  fecha_cobro:     string | null
  forma_pago:      string | null
  nro_comprobante: string | null
}

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK_VENTAS  = ['facturas_emitidas'] as const
const QK_CUENTAS = ['cuentas_arca'] as const

// ─── Helpers internos ─────────────────────────────────────────────────────────

// Intenta auto-asociar NCs sin asociar con facturas del mismo CUIT.
// Retorna cantidad de NC asociadas automáticamente.
async function autoAsociarNCs(cuitEmisor: string): Promise<number> {
  const { data: todas } = await db
    .from('facturas_emitidas')
    .select('id, tipo_comprobante, imp_total, fecha_emision, anulada, factura_asociada_id')
    .eq('cuit_emisor', cuitEmisor)

  if (!todas) return 0

  const ncs     = todas.filter((f: FacturaEmitida) => TIPOS_NC.includes(f.tipo_comprobante) && !f.factura_asociada_id)
  const noAnuladas = todas.filter((f: FacturaEmitida) => !TIPOS_NC.includes(f.tipo_comprobante) && !f.anulada)

  let matched = 0
  for (const nc of ncs) {
    const candidatas = noAnuladas.filter((f: FacturaEmitida) =>
      Math.abs(f.imp_total - nc.imp_total) < 0.01 &&
      f.fecha_emision <= nc.fecha_emision
    )
    if (candidatas.length === 1) {
      const ts = new Date().toISOString()
      await db.from('facturas_emitidas').update({ factura_asociada_id: candidatas[0].id, updated_at: ts }).eq('id', nc.id)
      await db.from('facturas_emitidas').update({ anulada: true, updated_at: ts }).eq('id', candidatas[0].id)
      // Evitar que la misma factura sea candidata en la siguiente iteración
      noAnuladas.splice(noAnuladas.indexOf(candidatas[0]), 1)
      matched++
    }
  }
  return matched
}

// ─── Cuentas ARCA ─────────────────────────────────────────────────────────────

export function useCuentasArca() {
  return useQuery({
    queryKey: QK_CUENTAS,
    queryFn: async () => {
      const { data, error } = await db.from('cuentas_arca').select('*').eq('activo', true).order('nombre')
      if (error) throw error
      return data as CuentaArca[]
    },
  })
}

export function useCrearCuentaArca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<CuentaArca, 'nombre' | 'cuit'>) => {
      const { data, error } = await db.from('cuentas_arca').insert(input).select().single()
      if (error) throw error
      return data as CuentaArca
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_CUENTAS }),
  })
}

export function useEditarCuentaArca() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Pick<CuentaArca, 'id' | 'nombre' | 'cuit' | 'activo'>) => {
      const { error } = await db.from('cuentas_arca').update({ ...input, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_CUENTAS }),
  })
}

// ─── Facturas emitidas ────────────────────────────────────────────────────────

export interface FiltrosVentas {
  cuenta_arca_id?:  string
  desde?:           string
  hasta?:           string
  solo_pendientes?: boolean
}

export function useFacturasEmitidas(filtros: FiltrosVentas = {}) {
  return useQuery({
    queryKey: [...QK_VENTAS, filtros],
    queryFn: async () => {
      let q = db.from('facturas_emitidas').select('*').order('fecha_emision', { ascending: false })
      if (filtros.cuenta_arca_id)  q = q.eq('cuenta_arca_id', filtros.cuenta_arca_id)
      if (filtros.desde)           q = q.gte('fecha_emision', filtros.desde)
      if (filtros.hasta)           q = q.lte('fecha_emision', filtros.hasta)
      if (filtros.solo_pendientes) q = q.is('fecha_cobro', null).eq('anulada', false)
      const { data, error } = await q
      if (error) throw error
      return data as FacturaEmitida[]
    },
  })
}

export function useImportarEmitidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ filas, cuitEmisor, cuentaArcaId }: {
      filas:        FilaEmitida[]
      cuitEmisor:   string
      cuentaArcaId: string
    }) => {
      const rows = filas.map((f) => ({
        cuenta_arca_id:   cuentaArcaId,
        cuit_emisor:      cuitEmisor,
        fecha_emision:    f.fecha_emision,
        tipo_comprobante: f.tipo_comprobante,
        punto_venta:      f.punto_venta,
        numero:           f.numero,
        cae:              f.cae || null,
        denominacion:     f.denominacion || null,
        cuit_receptor:    f.cuit_receptor || null,
        imp_total:        f.imp_total,
        synced_at:        new Date().toISOString(),
      }))

      const { error } = await db.from('facturas_emitidas').upsert(rows, {
        onConflict: 'cuit_emisor,punto_venta,numero,tipo_comprobante',
        ignoreDuplicates: false,
      })
      if (error) throw error

      const autoMatch = await autoAsociarNCs(cuitEmisor)
      return { total: rows.length, autoMatch }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_VENTAS }),
  })
}

export function useActualizarCobranza() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: ActualizarCobranzaInput) => {
      const { error } = await db.from('facturas_emitidas').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_VENTAS }),
  })
}

// Asocia una NC con la factura que cancela y marca esa factura como anulada.
// Si facturaId es null, deshace la asociación y restaura la factura.
export function useAsociarNcEmitida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ncId, facturaId, facturaAnteriorId }: {
      ncId:             string
      facturaId:        string | null
      facturaAnteriorId?: string | null  // para deshacer la asociación previa
    }) => {
      const ts = new Date().toISOString()
      // Actualizar la NC
      await db.from('facturas_emitidas')
        .update({ factura_asociada_id: facturaId, updated_at: ts })
        .eq('id', ncId)
      // Marcar la nueva factura como anulada
      if (facturaId) {
        await db.from('facturas_emitidas').update({ anulada: true, updated_at: ts }).eq('id', facturaId)
      }
      // Restaurar la factura anterior si se está cambiando la asociación
      if (facturaAnteriorId && facturaAnteriorId !== facturaId) {
        await db.from('facturas_emitidas').update({ anulada: false, updated_at: ts }).eq('id', facturaAnteriorId)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_VENTAS }),
  })
}
