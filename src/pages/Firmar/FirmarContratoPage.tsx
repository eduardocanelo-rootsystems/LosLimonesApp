import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SignatureCanvas } from '@/components/SignatureCanvas'

interface ContratoPublico {
  id: string
  token_firma: string
  firmado_cliente: boolean
  fecha_firma_cliente: string | null
  firma_contratista_base64: string | null
  nombre_comitente: string
  nombre_administrador: string
  administrador_dni: string
  direccion_obra: string
  presupuesto_numero: string
  presupuesto_fecha: string
  total: number
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(v)
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

export default function FirmarContratoPage() {
  const { token } = useParams<{ token: string }>()

  const [contrato, setContrato] = useState<ContratoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [firmando, setFirmando] = useState(false)
  const [firmadoOk, setFirmadoOk] = useState(false)
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = supabase as any

  useEffect(() => {
    if (!token) { setError('Link inválido.'); setLoading(false); return }

    dbAny
      .rpc('get_contrato_por_token', { p_token: token })
      .then(({ data, error: rpcError }: { data: unknown; error: unknown }) => {
        if (rpcError || !data) {
          setError('No se encontró el contrato o el link es inválido.')
        } else {
          const c = data as ContratoPublico
          setContrato(c)
          if (c.firmado_cliente) setFirmadoOk(true)
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleFirmar = async () => {
    if (!firmaBase64 || !token) return
    setFirmando(true)
    try {
      const { data, error: rpcError } = await dbAny.rpc('firmar_contrato_cliente', {
        p_token: token,
        p_firma_base64: firmaBase64,
      })
      if (rpcError) throw rpcError
      if (!data) throw new Error('No se pudo registrar la firma. Es posible que el contrato ya haya sido firmado.')
      setFirmadoOk(true)
      setContrato((prev) => prev ? { ...prev, firmado_cliente: true, fecha_firma_cliente: new Date().toISOString() } : prev)
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

  if (error && !contrato) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-6">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-center text-gray-600">{error}</p>
      </div>
    )
  }

  if (!contrato) return null

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
                Contrato de Locación de Obra
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Ref. {contrato.presupuesto_numero} · {fmtDate(contrato.presupuesto_fecha).split(',')[0]}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              firmadoOk
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {firmadoOk ? 'Firmado' : 'Pendiente de firma'}
            </span>
          </div>
        </div>

        {/* Datos del contrato */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Datos del contrato
          </h2>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Comitente</p>
              <p className="font-medium text-gray-900">{contrato.nombre_comitente || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Administrador</p>
              <p className="font-medium text-gray-900">
                {contrato.nombre_administrador || '—'}
                {contrato.administrador_dni ? ` · DNI ${contrato.administrador_dni}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Dirección de obra</p>
              <p className="font-medium text-gray-900">{contrato.direccion_obra || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Monto total</p>
              <p className="font-bold text-gray-900">{fmt(contrato.total)}</p>
            </div>
          </div>
        </div>

        {/* Estado de firma del contratista */}
        {contrato.firma_contratista_base64 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Firma del contratista
            </h2>
            <img
              src={contrato.firma_contratista_base64}
              alt="Firma del contratista"
              className="h-16 w-auto rounded border border-gray-100 bg-gray-50 p-1"
            />
          </div>
        )}

        {/* Sección de firma del cliente */}
        {firmadoOk ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 shrink-0 text-green-500" />
              <div>
                <p className="font-semibold text-green-800">Contrato firmado correctamente</p>
                <p className="text-sm text-green-600">
                  Firmado el {fmtDate(contrato.fecha_firma_cliente ?? new Date().toISOString())}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tu firma
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Dibujá tu firma en el recuadro de abajo y presioná "Firmar contrato" para confirmar.
            </p>

            <SignatureCanvas
              onSave={(dataUrl) => setFirmaBase64(dataUrl)}
              existingSignature={firmaBase64}
            />

            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}

            <button
              type="button"
              onClick={handleFirmar}
              disabled={!firmaBase64 || firmando}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-40 transition-colors"
            >
              {firmando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {firmando ? 'Firmando…' : 'Firmar contrato'}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Al firmar, confirmás haber leído y aceptado los términos del contrato.
              Se registrará la fecha y hora de tu firma.
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          Limones - Rope Access · Trabajos en altura y fachadas
        </p>
      </div>
    </div>
  )
}
