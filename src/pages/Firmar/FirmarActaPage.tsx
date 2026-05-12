import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SignatureCanvas } from '@/components/SignatureCanvas'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface ActaItemPublico {
  id: string
  servicio_nombre: string
  completado: boolean
  observacion: string | null
  orden: number
}

interface ActaPublica {
  id: string
  token_firma: string
  firmado_cliente: boolean
  fecha_firma_cliente: string | null
  firma_contratista_base64: string | null
  observaciones_generales: string | null
  fecha_recepcion_prov: string | null
  nombre_comitente: string | null
  nombre_administrador: string | null
  administrador_dni: string | null
  direccion_obra: string | null
  presupuesto_numero: string | null
  presupuesto_fecha: string | null
  items: ActaItemPublico[] | null
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function fmtDateShort(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso.length === 10 ? iso + 'T12:00:00' : iso))
}

export default function FirmarActaPage() {
  const { token } = useParams<{ token: string }>()

  const [acta,      setActa]      = useState<ActaPublica | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [firmando,  setFirmando]  = useState(false)
  const [firmadoOk, setFirmadoOk] = useState(false)
  const [firma,     setFirma]     = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('Link inválido.'); setLoading(false); return }

    db.rpc('get_acta_por_token', { p_token: token })
      .then(({ data, error: rpcErr }: { data: unknown; error: unknown }) => {
        if (rpcErr || !data) {
          setError('No se encontró el acta o el link es inválido.')
        } else {
          const a = data as ActaPublica
          setActa(a)
          if (a.firmado_cliente) setFirmadoOk(true)
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleFirmar = async () => {
    if (!firma || !token) return
    setFirmando(true)
    try {
      const { data, error: rpcErr } = await db.rpc('firmar_acta_cliente', {
        p_token:        token,
        p_firma_base64: firma,
      })
      if (rpcErr) throw rpcErr
      if (!data) throw new Error('No se pudo registrar la conformidad. Es posible que ya haya sido firmada.')
      setFirmadoOk(true)
      setActa((prev) =>
        prev ? { ...prev, firmado_cliente: true, fecha_firma_cliente: new Date().toISOString() } : prev
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error al firmar.'
      setError(msg)
    } finally {
      setFirmando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    )
  }

  if (error && !acta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-center text-gray-600">{error}</p>
      </div>
    )
  }

  if (!acta) return null

  const items = (acta.items ?? []).sort((a, b) => a.orden - b.orden)
  const completados = items.filter((i) => i.completado).length

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Encabezado */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sky-500">
                Limones - Rope Access
              </p>
              <h1 className="mt-1 text-xl font-bold text-gray-900">
                Acta de Recepción Provisoria de Obra
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Ref. {acta.presupuesto_numero ?? '—'}
                {acta.fecha_recepcion_prov
                  ? ` · Fecha de recepción: ${fmtDateShort(acta.fecha_recepcion_prov)}`
                  : ''}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              firmadoOk
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {firmadoOk ? 'Conformidad firmada' : 'Pendiente de firma'}
            </span>
          </div>
        </div>

        {/* Datos del proyecto */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Datos de la obra
          </h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Comitente</p>
              <p className="font-medium text-gray-900">{acta.nombre_comitente || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Dirección</p>
              <p className="font-medium text-gray-900">{acta.direccion_obra || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Administrador</p>
              <p className="font-medium text-gray-900">
                {acta.nombre_administrador || '—'}
                {acta.administrador_dni ? ` · DNI ${acta.administrador_dni}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Estado de la obra</p>
              <p className={`font-bold ${completados === items.length && items.length > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {completados} de {items.length} ítem{items.length !== 1 ? 's' : ''} completado{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Checklist de trabajos */}
        {items.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Verificación de trabajos realizados
            </h2>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg p-3 ${
                    item.completado ? 'bg-green-50' : 'bg-amber-50'
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 text-base ${item.completado ? 'text-green-600' : 'text-amber-500'}`}>
                    {item.completado ? '✓' : '○'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.completado ? 'text-gray-900' : 'text-gray-700'}`}>
                      {idx + 1}. {item.servicio_nombre}
                    </p>
                    {item.observacion && (
                      <p className="mt-0.5 text-xs text-gray-500">{item.observacion}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    item.completado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.completado ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones generales */}
        {acta.observaciones_generales && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Observaciones generales
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{acta.observaciones_generales}</p>
          </div>
        )}

        {/* Firma del contratista */}
        {acta.firma_contratista_base64 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Firma del contratista
            </h2>
            <img
              src={acta.firma_contratista_base64}
              alt="Firma del contratista"
              className="h-16 w-auto rounded border border-gray-100 bg-gray-50 p-1"
            />
          </div>
        )}

        {/* Firma del cliente */}
        {firmadoOk ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 shrink-0 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Conformidad firmada correctamente</p>
                <p className="text-sm text-green-600">
                  Firmada el {fmtDate(acta.fecha_firma_cliente ?? new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tu firma de conformidad
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Al firmar confirmás que los trabajos listados fueron ejecutados a satisfacción y
              aceptás el inicio del período de garantía (si corresponde).
            </p>

            <SignatureCanvas
              onSave={(dataUrl) => setFirma(dataUrl)}
              existingSignature={firma}
            />

            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleFirmar}
              disabled={!firma || firmando}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-40 transition-colors"
            >
              {firmando
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle className="h-4 w-4" />}
              {firmando ? 'Registrando…' : 'Firmar conformidad'}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Al firmar, confirmás la recepción satisfactoria de los trabajos.
              Se registrará la fecha y hora de tu firma.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Limones - Rope Access · Trabajos en altura y fachadas
        </p>
      </div>
    </div>
  )
}
