import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { TIPOS_NC, type FilaRecibida } from '@/lib/arcaParser'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompraRecibida {
  id:                  string
  cuenta_arca_id:      string | null
  cuit_receptor:       string
  fecha_emision:       string
  tipo_comprobante:    string
  punto_venta:         string
  numero:              string
  denominacion:        string | null
  cuit_emisor:         string | null
  imp_total:           number
  es_negocio:          boolean
  anulada:             boolean
  factura_asociada_id: string | null
  synced_at:           string
  updated_at:          string
}

// ─── Query keys ───────────────────────────────────────────────────────────────

const QK_COMPRAS = ['compras_recibidas'] as const

// ─── Helpers internos ─────────────────────────────────────────────────────────

async function autoAsociarNCsCompras(cuitReceptor: string): Promise<number> {
  const { data: todas } = await db
    .from('compras_recibidas')
    .select('id, tipo_comprobante, imp_total, fecha_emision, anulada, factura_asociada_id')
    .eq('cuit_receptor', cuitReceptor)

  if (!todas) return 0

  const ncs        = todas.filter((f: CompraRecibida) => TIPOS_NC.includes(f.tipo_comprobante) && !f.factura_asociada_id)
  const noAnuladas = todas.filter((f: CompraRecibida) => !TIPOS_NC.includes(f.tipo_comprobante) && !f.anulada)

  let matched = 0
  for (const nc of ncs) {
    const candidatas = noAnuladas.filter((f: CompraRecibida) =>
      Math.abs(f.imp_total - nc.imp_total) < 0.01 &&
      f.fecha_emision <= nc.fecha_emision
    )
    if (candidatas.length === 1) {
      const ts = new Date().toISOString()
      await db.from('compras_recibidas').update({ factura_asociada_id: candidatas[0].id, updated_at: ts }).eq('id', nc.id)
      await db.from('compras_recibidas').update({ anulada: true, updated_at: ts }).eq('id', candidatas[0].id)
      noAnuladas.splice(noAnuladas.indexOf(candidatas[0]), 1)
      matched++
    }
  }
  return matched
}

// ─── Queries y mutaciones ─────────────────────────────────────────────────────

export interface FiltrosCompras {
  cuenta_arca_id?: string
  desde?:          string
  hasta?:          string
}

export function useComprasRecibidas(filtros: FiltrosCompras = {}) {
  return useQuery({
    queryKey: [...QK_COMPRAS, filtros],
    queryFn: async () => {
      let q = db.from('compras_recibidas').select('id,cuenta_arca_id,cuit_receptor,fecha_emision,tipo_comprobante,punto_venta,numero,denominacion,cuit_emisor,imp_total,es_negocio,anulada,factura_asociada_id,synced_at,updated_at').order('fecha_emision', { ascending: false })
      if (filtros.cuenta_arca_id) q = q.eq('cuenta_arca_id', filtros.cuenta_arca_id)
      if (filtros.desde)          q = q.gte('fecha_emision', filtros.desde)
      if (filtros.hasta)          q = q.lte('fecha_emision', filtros.hasta)
      const { data, error } = await q
      if (error) throw error
      return data as CompraRecibida[]
    },
  })
}

export function useImportarRecibidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ filas, cuitReceptor, cuentaArcaId }: {
      filas:         FilaRecibida[]
      cuitReceptor:  string
      cuentaArcaId:  string
    }) => {
      const rows = filas.map((f) => ({
        cuenta_arca_id:   cuentaArcaId,
        cuit_receptor:    cuitReceptor,
        fecha_emision:    f.fecha_emision,
        tipo_comprobante: f.tipo_comprobante,
        punto_venta:      f.punto_venta,
        numero:           f.numero,
        denominacion:     f.denominacion || null,
        cuit_emisor:      f.cuit_emisor || null,
        imp_total:        f.imp_total,
        es_negocio:       true,
        synced_at:        new Date().toISOString(),
      }))

      const { error } = await db.from('compras_recibidas').upsert(rows, {
        onConflict: 'cuit_receptor,cuit_emisor,punto_venta,numero,tipo_comprobante',
        ignoreDuplicates: false,
      })
      if (error) throw error

      const autoMatch = await autoAsociarNCsCompras(cuitReceptor)
      return { total: rows.length, autoMatch }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_COMPRAS }),
  })
}

export function useToggleNegocio() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, es_negocio }: { id: string; es_negocio: boolean }) => {
      const { error } = await db.from('compras_recibidas').update({ es_negocio, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_COMPRAS }),
  })
}

export function useAsociarNcCompra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ncId, facturaId, facturaAnteriorId }: {
      ncId:              string
      facturaId:         string | null
      facturaAnteriorId?: string | null
    }) => {
      const ts = new Date().toISOString()
      await db.from('compras_recibidas').update({ factura_asociada_id: facturaId, updated_at: ts }).eq('id', ncId)
      if (facturaId) {
        await db.from('compras_recibidas').update({ anulada: true, updated_at: ts }).eq('id', facturaId)
      }
      if (facturaAnteriorId && facturaAnteriorId !== facturaId) {
        await db.from('compras_recibidas').update({ anulada: false, updated_at: ts }).eq('id', facturaAnteriorId)
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_COMPRAS }),
  })
}
