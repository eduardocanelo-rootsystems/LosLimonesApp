import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const QK_ROLES = ['user_roles']   as const
const QK_INV   = ['invitaciones'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export type Rol = 'superadmin' | 'admin' | 'socio' | 'empleado'

export interface UserRol {
  user_id:      string
  email:        string
  nombre:       string
  rol:          Rol
  activo:       boolean
  invitado_por: string | null
  created_at:   string
}

export interface Invitacion {
  id:          string
  email:       string
  rol:         Rol
  token:       string
  usado:       boolean
  creado_por:  string | null
  expires_at:  string
  created_at:  string
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useUsuarios() {
  return useQuery({
    queryKey: QK_ROLES,
    queryFn: async () => {
      const { data, error } = await db.from('user_roles').select('*').order('created_at')
      if (error) throw error
      return (data ?? []) as UserRol[]
    },
  })
}

export function useInvitacionesPendientes() {
  return useQuery({
    queryKey: QK_INV,
    queryFn: async () => {
      const { data, error } = await db
        .from('invitaciones')
        .select('*')
        .eq('usado', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Invitacion[]
    },
  })
}

// Busca una invitación por token (para la página de registro)
export async function buscarInvitacionPorToken(token: string): Promise<Invitacion | null> {
  const { data } = await db
    .from('invitaciones')
    .select('*')
    .eq('token', token)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data as Invitacion | null
}

// ─── Mutaciones ───────────────────────────────────────────────────────────────

export function useCrearInvitacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, rol }: { email: string; rol: Rol }) => {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error } = await db
        .from('invitaciones')
        .insert({ email: email.toLowerCase().trim(), rol, creado_por: session?.user.id })
        .select()
        .single()
      if (error) throw error
      return data as Invitacion
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_INV }),
  })
}

export function useRevocarInvitacion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('invitaciones').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_INV }),
  })
}

export function useCambiarRol() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, rol }: { userId: string; rol: Rol }) => {
      const { error } = await db
        .from('user_roles')
        .update({ rol, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  })
}

export function useToggleActivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, activo }: { userId: string; activo: boolean }) => {
      const { error } = await db
        .from('user_roles')
        .update({ activo, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  })
}

export async function enviarResetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  })
  if (error) throw error
}
