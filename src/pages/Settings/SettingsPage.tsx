import { useState } from 'react'
import { Plus, Pencil, Check, X, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  useCuentasArca,
  useCrearCuentaArca,
  useEditarCuentaArca,
  type CuentaArca,
} from '@/hooks/useVentas'
import { SignatureCanvas } from '@/components/SignatureCanvas'
import { useFirmaContratista, useGuardarFirmaContratista } from '@/hooks/useConfiguracion'
import { useSocios, useGuardarSocio, type Socio } from '@/hooks/useSocios'
import {
  useUsuarios, useInvitacionesPendientes, useCrearInvitacion,
  useRevocarInvitacion, useCambiarRol, useToggleActivo,
  enviarResetPassword, type UserRol, type Rol,
} from '@/hooks/useUsuarios'
import { useAuth } from '@/hooks/useAuth'

// ─── Fila editable de cuenta ──────────────────────────────────────────────────

function CuentaFila({ cuenta }: { cuenta: CuentaArca }) {
  const editar = useEditarCuentaArca()
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre]     = useState(cuenta.nombre)
  const [cuit, setCuit]         = useState(cuenta.cuit)
  const [activo, setActivo]     = useState(cuenta.activo)

  function cancelar() {
    setNombre(cuenta.nombre)
    setCuit(cuenta.cuit)
    setActivo(cuenta.activo)
    setEditando(false)
  }

  async function guardar() {
    await editar.mutateAsync({ id: cuenta.id, nombre, cuit, activo })
    setEditando(false)
  }

  if (!editando) {
    return (
      <tr className="text-ink-300 hover:bg-ink-800/40">
        <td className="px-4 py-3">{cuenta.nombre}</td>
        <td className="px-4 py-3 font-mono text-sm">{cuenta.cuit}</td>
        <td className="px-4 py-3">
          <span className={`rounded px-2 py-0.5 text-xs ${cuenta.activo ? 'bg-green-900/40 text-green-400' : 'bg-ink-800 text-ink-500'}`}>
            {cuenta.activo ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditando(true)} className="btn-ghost p-1.5">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-ink-800/40">
      <td className="px-4 py-2">
        <input className="input py-1 text-sm w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </td>
      <td className="px-4 py-2">
        <input className="input py-1 text-sm font-mono w-full" value={cuit} onChange={(e) => setCuit(e.target.value)} />
      </td>
      <td className="px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-ink-400 cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activa
        </label>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={guardar} disabled={editar.isPending} className="btn-ghost p-1.5 text-green-400">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={cancelar} className="btn-ghost p-1.5 text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Formulario nueva cuenta ──────────────────────────────────────────────────

function NuevaCuentaForm({ onCrear }: { onCrear: () => void }) {
  const crear = useCrearCuentaArca()
  const [nombre, setNombre] = useState('')
  const [cuit, setCuit]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !cuit.trim()) return
    await crear.mutateAsync({ nombre: nombre.trim(), cuit: cuit.trim() })
    setNombre('')
    setCuit('')
    onCrear()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-lg border border-ink-700 bg-ink-800/50 p-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-ink-400">Nombre</label>
        <input
          className="input w-full"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Luis Alfonzo"
          required
        />
      </div>
      <div className="flex-1 space-y-1">
        <label className="text-xs text-ink-400">CUIT</label>
        <input
          className="input w-full font-mono"
          value={cuit}
          onChange={(e) => setCuit(e.target.value)}
          placeholder="20-12345678-9"
          required
        />
      </div>
      <button type="submit" disabled={crear.isPending} className="btn-primary flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {crear.isPending ? 'Agregando…' : 'Agregar'}
      </button>
    </form>
  )
}

// ─── Socios ───────────────────────────────────────────────────────────────────

function SocioFila({ socio }: { socio: Socio }) {
  const guardar = useGuardarSocio()
  const [editando, setEditando]     = useState(false)
  const [nombre, setNombre]         = useState(socio.nombre)
  const [porcentaje, setPorcentaje] = useState(String(socio.porcentaje))
  const [activo, setActivo]         = useState(socio.activo)

  function cancelar() {
    setNombre(socio.nombre)
    setPorcentaje(String(socio.porcentaje))
    setActivo(socio.activo)
    setEditando(false)
  }

  async function guardarCambios() {
    const pct = parseFloat(porcentaje)
    if (isNaN(pct) || pct < 0 || pct > 100) return
    await guardar.mutateAsync({ id: socio.id, nombre, porcentaje: pct, activo })
    setEditando(false)
  }

  if (!editando) {
    return (
      <tr className="text-ink-300 hover:bg-ink-800/40">
        <td className="px-4 py-3">{socio.nombre}</td>
        <td className="px-4 py-3 font-mono text-sm">{socio.porcentaje}%</td>
        <td className="px-4 py-3">
          <span className={`rounded px-2 py-0.5 text-xs ${socio.activo ? 'bg-green-900/40 text-green-400' : 'bg-ink-800 text-ink-500'}`}>
            {socio.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button onClick={() => setEditando(true)} className="btn-ghost p-1.5">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="bg-ink-800/40">
      <td className="px-4 py-2">
        <input className="input py-1 text-sm w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </td>
      <td className="px-4 py-2 w-28">
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100" step="0.01"
            className="input py-1 text-sm font-mono w-full"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
          />
          <span className="text-ink-500 text-sm">%</span>
        </div>
      </td>
      <td className="px-4 py-2">
        <label className="flex items-center gap-2 text-sm text-ink-400 cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo
        </label>
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={guardarCambios} disabled={guardar.isPending} className="btn-ghost p-1.5 text-green-400">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={cancelar} className="btn-ghost p-1.5 text-ink-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function NuevoSocioForm({ onCrear }: { onCrear: () => void }) {
  const guardar                     = useGuardarSocio()
  const [nombre, setNombre]         = useState('')
  const [porcentaje, setPorcentaje] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pct = parseFloat(porcentaje)
    if (!nombre.trim() || isNaN(pct)) return
    await guardar.mutateAsync({ nombre: nombre.trim(), porcentaje: pct, activo: true })
    setNombre('')
    setPorcentaje('')
    onCrear()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 rounded-lg border border-ink-700 bg-ink-800/50 p-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs text-ink-400">Nombre</label>
        <input className="input w-full" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Luis Alfonzo" required />
      </div>
      <div className="w-32 space-y-1">
        <label className="text-xs text-ink-400">Porcentaje</label>
        <div className="flex items-center gap-1">
          <input
            type="number" min="0" max="100" step="0.01"
            className="input w-full font-mono"
            value={porcentaje}
            onChange={(e) => setPorcentaje(e.target.value)}
            placeholder="50"
            required
          />
          <span className="text-ink-500 text-sm">%</span>
        </div>
      </div>
      <button type="submit" disabled={guardar.isPending} className="btn-primary flex items-center gap-2">
        <Plus className="h-4 w-4" />
        {guardar.isPending ? 'Agregando…' : 'Agregar'}
      </button>
    </form>
  )
}

// ─── Gestión de usuarios ──────────────────────────────────────────────────────

const ROL_OPTS: { value: Rol; label: string }[] = [
  { value: 'admin',    label: 'Admin'    },
  { value: 'socio',    label: 'Socio'    },
  { value: 'empleado', label: 'Empleado' },
]
const ROL_COLOR: Record<Rol, string> = {
  superadmin: 'bg-purple-900/40 text-purple-300',
  admin:      'bg-blue-900/40 text-blue-300',
  socio:      'bg-accent-900/40 text-accent-300',
  empleado:   'bg-ink-800 text-ink-400',
}

function FilaUsuario({ usuario, esSuperadmin, miId }: { usuario: UserRol; esSuperadmin: boolean; miId: string }) {
  const cambiarRol   = useCambiarRol()
  const toggleActivo = useToggleActivo()
  const [resetting, setResetting] = useState(false)
  const [msg, setMsg]             = useState('')

  const esYo     = usuario.user_id === miId
  const esSuper  = usuario.rol === 'superadmin'

  async function handleReset() {
    setResetting(true)
    try {
      await enviarResetPassword(usuario.email)
      setMsg('Email de recuperación enviado.')
    } catch { setMsg('Error al enviar.') }
    finally { setResetting(false) }
  }

  return (
    <tr className={`text-ink-300 ${!usuario.activo ? 'opacity-50' : 'hover:bg-ink-800/30'}`}>
      <td className="px-4 py-3">
        <div className="font-medium text-ink-100">{usuario.nombre || '—'}</div>
        <div className="text-xs text-ink-500">{usuario.email}</div>
        {msg && <div className="text-xs text-accent-400">{msg}</div>}
      </td>
      <td className="px-4 py-3">
        {esSuper || esYo ? (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${ROL_COLOR[usuario.rol]}`}>{usuario.rol}</span>
        ) : (
          <select
            className="input py-0.5 text-xs"
            value={usuario.rol}
            disabled={cambiarRol.isPending}
            onChange={(e) => cambiarRol.mutate({ userId: usuario.user_id, rol: e.target.value as Rol })}
          >
            {ROL_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded px-2 py-0.5 text-xs ${usuario.activo ? 'bg-green-900/40 text-green-400' : 'bg-ink-800 text-ink-500'}`}>
          {usuario.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {!esYo && !esSuper && esSuperadmin && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="text-xs text-ink-500 hover:text-accent-400 transition-colors"
              title="Enviar email de recuperación de contraseña"
            >
              {resetting ? '…' : 'Reset pwd'}
            </button>
            <button
              onClick={() => toggleActivo.mutate({ userId: usuario.user_id, activo: !usuario.activo })}
              disabled={toggleActivo.isPending}
              className={`text-xs transition-colors ${usuario.activo ? 'text-ink-500 hover:text-red-400' : 'text-ink-500 hover:text-green-400'}`}
            >
              {usuario.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function SeccionInvitaciones({ esSuperadmin }: { esSuperadmin: boolean }) {
  const { data: invitaciones = [] } = useInvitacionesPendientes()
  const crear   = useCrearInvitacion()
  const revocar = useRevocarInvitacion()

  const [email, setEmail]     = useState('')
  const [rol, setRol]         = useState<Rol>('empleado')
  const [linkNuevo, setLinkNuevo] = useState('')
  const [error, setError]     = useState('')

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    try {
      const inv = await crear.mutateAsync({ email: email.trim(), rol })
      const link = `${window.location.origin}/registro?token=${inv.token}`
      setLinkNuevo(link)
      setEmail('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear invitación.')
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleInvitar} className="flex items-end gap-3 rounded-lg border border-ink-700 bg-ink-800/50 p-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-ink-400">Email a invitar</label>
          <input
            type="email" className="input w-full" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" required
          />
        </div>
        <div className="w-36 space-y-1">
          <label className="text-xs text-ink-400">Rol</label>
          <select className="input w-full" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROL_OPTS.filter((o) => esSuperadmin || o.value !== 'admin').map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={crear.isPending} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {crear.isPending ? 'Enviando…' : 'Invitar'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      {linkNuevo && (
        <div className="rounded-lg border border-accent-700 bg-accent-950/30 px-4 py-3 space-y-1">
          <p className="text-xs text-accent-300 font-medium">Enlace de invitación (compartilo con el usuario):</p>
          <p className="break-all font-mono text-xs text-accent-400 select-all">{linkNuevo}</p>
          <button onClick={() => setLinkNuevo('')} className="text-xs text-ink-500 hover:text-ink-300">Cerrar</button>
        </div>
      )}

      {invitaciones.length > 0 && (
        <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
          <p className="px-4 py-2 text-xs text-ink-500 border-b border-ink-700">Invitaciones pendientes</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-ink-800">
              {invitaciones.map((inv) => (
                <tr key={inv.id} className="text-ink-300">
                  <td className="px-4 py-2">{inv.email}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${ROL_COLOR[inv.rol]}`}>{inv.rol}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-ink-500">
                    Vence {new Date(inv.expires_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => revocar.mutate(inv.id)}
                      className="text-xs text-ink-500 hover:text-red-400 transition-colors"
                    >
                      Revocar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { rol, user }                     = useAuth()
  const esSuperadmin                      = rol === 'superadmin'
  const { data: cuentas = [], isLoading } = useCuentasArca()
  const { data: socios  = [] }            = useSocios()
  const { data: usuarios = [] }           = useUsuarios()
  const { data: firmaGuardada }           = useFirmaContratista()
  const guardarFirma                      = useGuardarFirmaContratista()
  const [mostrarForm, setMostrarForm]       = useState(false)
  const [mostrarFormSocio, setMostrarFormSocio] = useState(false)
  const [mostrarCanvas, setMostrarCanvas]   = useState(false)

  const sumaPct        = socios.filter((s) => s.activo).reduce((s, socio) => s + socio.porcentaje, 0)
  const pctDesequilibrado = Math.abs(sumaPct - 100) > 0.01 && socios.some((s) => s.activo)

  return (
    <>
      <PageHeader title="Configuración" subtitle="Parámetros globales del sistema" />

      {/* Cuentas ARCA */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-ink-100">Cuentas ARCA</h2>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="btn-ghost flex items-center gap-1.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </button>
        </div>

        {mostrarForm && (
          <div className="mb-3">
            <NuevaCuentaForm onCrear={() => setMostrarForm(false)} />
          </div>
        )}

        <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
          {isLoading ? (
            <p className="px-6 py-8 text-center text-sm text-ink-500">Cargando…</p>
          ) : cuentas.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-400">
              No hay cuentas configuradas. Agregá la primera para empezar a importar comprobantes.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">CUIT</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {cuentas.map((c) => <CuentaFila key={c.id} cuenta={c} />)}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Usuarios */}
      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-base font-medium text-ink-100">Usuarios</h2>
          <p className="text-xs text-ink-500 mt-0.5">Miembros del sistema e invitaciones pendientes.</p>
        </div>

        <div className="mb-4 rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
          {usuarios.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-400">No hay usuarios registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Rol</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {usuarios.map((u) => (
                  <FilaUsuario key={u.user_id} usuario={u} esSuperadmin={esSuperadmin} miId={user?.id ?? ''} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <SeccionInvitaciones esSuperadmin={esSuperadmin} />
      </section>

      {/* Socios — solo superadmin */}
      {esSuperadmin && <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-ink-100">Socios</h2>
            <p className="text-xs text-ink-500 mt-0.5">Porcentajes de distribución de rentabilidad.</p>
          </div>
          <button onClick={() => setMostrarFormSocio((v) => !v)} className="btn-ghost flex items-center gap-1.5 text-sm">
            <Plus className="h-4 w-4" />
            Nuevo socio
          </button>
        </div>

        {mostrarFormSocio && (
          <div className="mb-3">
            <NuevoSocioForm onCrear={() => setMostrarFormSocio(false)} />
          </div>
        )}

        {pctDesequilibrado && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-800 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            Los porcentajes activos suman {sumaPct.toFixed(2)}% — deben sumar exactamente 100%.
          </div>
        )}

        <div className="rounded-xl border border-ink-700 bg-ink-900 overflow-hidden">
          {socios.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-ink-400">No hay socios configurados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ink-800 text-xs text-ink-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Porcentaje</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {socios.map((s) => <SocioFila key={s.id} socio={s} />)}
                {socios.some((s) => s.activo) && (
                  <tr className="bg-ink-800/20">
                    <td colSpan={3} className="px-4 py-2 text-right text-xs text-ink-400">Total activos</td>
                    <td className="px-4 py-2 text-right font-mono text-xs font-medium text-ink-200">
                      {sumaPct.toFixed(2)}%
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>}

      {/* Firma del contratista */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-ink-100">Firma del contratista</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Se usa en todos los contratos generados por el sistema.
            </p>
          </div>
          <button
            onClick={() => setMostrarCanvas((v) => !v)}
            className="btn-ghost text-sm"
          >
            {firmaGuardada ? 'Actualizar firma' : 'Agregar firma'}
          </button>
        </div>

        {firmaGuardada && !mostrarCanvas && (
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
            <img
              src={firmaGuardada}
              alt="Firma del contratista"
              className="max-h-20 object-contain"
            />
          </div>
        )}

        {mostrarCanvas && (
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-4">
            <SignatureCanvas
              existingSignature={firmaGuardada ?? undefined}
              onSave={async (base64) => {
                await guardarFirma.mutateAsync(base64)
                setMostrarCanvas(false)
              }}
            />
          </div>
        )}
      </section>
    </>
  )
}
