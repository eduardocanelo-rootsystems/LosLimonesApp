import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK = ['configuracion'] as const

async function getConfig(clave: string): Promise<string | null> {
  const { data } = await db
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle()
  return (data as { valor: string } | null)?.valor ?? null
}

async function setConfig(clave: string, valor: string): Promise<void> {
  const { error } = await db
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'clave' })
  if (error) throw error
}

export function useFirmaContratista() {
  return useQuery({
    queryKey: [...QK, 'firma_contratista'],
    queryFn: () => getConfig('firma_contratista'),
  })
}

export function useGuardarFirmaContratista() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (base64: string) => setConfig('firma_contratista', base64),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QK, 'firma_contratista'] }),
  })
}

export function useMontoMinimoObraMenor() {
  return useQuery({
    queryKey: [...QK, 'monto_minimo_obra_menor'],
    queryFn: async () => {
      const val = await getConfig('monto_minimo_obra_menor')
      return val ? parseFloat(val) : null
    },
  })
}

export function useGuardarMontoMinimoObraMenor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (monto: number | null) =>
      setConfig('monto_minimo_obra_menor', monto !== null ? String(monto) : ''),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...QK, 'monto_minimo_obra_menor'] }),
  })
}
