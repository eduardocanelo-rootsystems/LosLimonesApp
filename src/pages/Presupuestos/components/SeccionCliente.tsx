interface SeccionClienteProps {
  razonSocial: string
  cuit: string
  telefono: string
  direccion: string
  administrador: string
  administradorCuit: string
  email: string
  onChange: (field: string, value: string) => void
}

export function SeccionCliente({
  razonSocial, cuit, telefono, direccion, administrador, administradorCuit, email, onChange,
}: SeccionClienteProps) {
  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Datos del cliente
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Razón Social
          </label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => onChange('cliente_razon_social', e.target.value)}
            className="input-base"
            placeholder="Consorcio / Empresa / Nombre"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            CUIT razón social
          </label>
          <input
            type="text"
            value={cuit}
            onChange={(e) => onChange('cliente_cuit', e.target.value)}
            className="input-base font-mono"
            placeholder="XX-XXXXXXXX-X"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Teléfono
          </label>
          <input
            type="text"
            value={telefono}
            onChange={(e) => onChange('cliente_telefono', e.target.value)}
            className="input-base"
            placeholder="+54 11 XXXX-XXXX"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange('cliente_email', e.target.value)}
            className="input-base"
            placeholder="contacto@ejemplo.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Dirección
          </label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => onChange('cliente_direccion', e.target.value)}
            className="input-base"
            placeholder="Calle 123, CABA"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Nombre Administrador
          </label>
          <input
            type="text"
            value={administrador}
            onChange={(e) => onChange('cliente_administrador', e.target.value)}
            className="input-base"
            placeholder="Nombre y apellido"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            CUIT administrador
          </label>
          <input
            type="text"
            value={administradorCuit}
            onChange={(e) => onChange('cliente_administrador_cuit', e.target.value)}
            className="input-base font-mono"
            placeholder="XX-XXXXXXXX-X"
          />
        </div>
      </div>
    </section>
  )
}
