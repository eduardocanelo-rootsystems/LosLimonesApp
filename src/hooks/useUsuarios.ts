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
      const { data, error } = await db.from('user_roles').select('user_id,email,nombre,rol,activo,invitado_por,created_at').order('created_at')
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
        .select('id,email,rol,token,usado,creado_por,expires_at,created_at')
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
    .select('id,email,rol,token,usado,creado_por,expires_at,created_at')
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
      const inv = data as Invitacion

      // Enviar email automáticamente vía Edge Function
      const { error: fnError } = await supabase.functions.invoke('enviar-invitacion', {
        body: { email: inv.email, token: inv.token, rolInvitado: inv.rol },
      })
      if (fnError) {
        console.error('[enviar-invitacion]', fnError)
        // No bloqueamos: la invitación ya fue creada aunque falle el email
      }

      return inv
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
      // Impedir escalada a superadmin desde el cliente
      if (rol === 'superadmin') throw new Error('No se puede asignar el rol superadmin')
      // Impedir que el usuario modifique su propio rol
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user.id === userId) throw new Error('No podés modificar tu propio rol')
      const { error } = await db
        .from('user_roles')
        .update({ rol, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('rol', 'superadmin') // nunca tocar filas de superadmin
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QK_ROLES }),
  })
}

export function useToggleActivo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, activo }: { userId: string; activo: boolean }) => {
      // Impedir desactivar superadmin
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user.id === userId) throw new Error('No podés desactivarte a vos mismo')
      const { error } = await db
        .from('user_roles')
        .update({ activo, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .neq('rol', 'superadmin') // nunca tocar filas de superadmin
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
