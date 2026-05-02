import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

export interface HistorialCliente {
  razon_social: string
  cuit: string
  telefono: string
  direccion: string
  administrador: string
  administrador_cuit: string
  email: string
}

function CuitInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  placeholder?: string
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2)  formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
    if (digits.length > 10) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
    onChange(formatted)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  )
}

interface SeccionClienteProps {
  razonSocial: string
  cuit: string
  telefono: string
  direccion: string
  administrador: string
  administradorCuit: string
  email: string
  historial?: HistorialCliente[]
  onChange: (field: string, value: string) => void
}

export function SeccionCliente({
  razonSocial, cuit, telefono, direccion, administrador, administradorCuit, email,
  historial = [],
  onChange,
}: SeccionClienteProps) {
  const [abierto, setAbierto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtrados = razonSocial.length >= 2
    ? historial
        .filter((c) =>
          c.razon_social.toLowerCase().includes(razonSocial.toLowerCase()) &&
          c.razon_social.toLowerCase() !== razonSocial.toLowerCase()
        )
        .slice(0, 6)
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const seleccionar = (c: HistorialCliente) => {
    onChange('cliente_razon_social',        c.razon_social)
    onChange('cliente_cuit',                c.cuit)
    onChange('cliente_telefono',            c.telefono)
    onChange('cliente_direccion',           c.direccion)
    onChange('cliente_administrador',       c.administrador)
    onChange('cliente_administrador_cuit',  c.administrador_cuit)
    onChange('cliente_email',               c.email)
    setAbierto(false)
  }

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Datos del cliente
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Razón social con autocomplete */}
        <div ref={containerRef} className="relative">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Razón Social
          </label>
          <input
            type="text"
            value={razonSocial}
            onChange={(e) => { onChange('cliente_razon_social', e.target.value); setAbierto(true) }}
            onFocus={() => setAbierto(true)}
            className="input-base"
            placeholder="Consorcio / Empresa / Nombre"
            autoComplete="off"
          />
          {abierto && filtrados.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-ink-700 bg-ink-900 shadow-xl">
              {filtrados.map((c) => (
                <li key={c.razon_social}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); seleccionar(c) }}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-ink-800 transition-colors"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-500" />
                    <div>
                      <div className="text-sm font-medium text-ink-100">{c.razon_social}</div>
                      {c.direccion && <div className="text-xs text-ink-500">{c.direccion}</div>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            CUIT razón social
          </label>
          <CuitInput
            value={cuit}
            onChange={(v) => onChange('cliente_cuit', v)}
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
          <CuitInput
            value={administradorCuit}
            onChange={(v) => onChange('cliente_administrador_cuit', v)}
            className="input-base font-mono"
            placeholder="XX-XXXXXXXX-X"
          />
        </div>

      </div>
    </section>
  )
}
