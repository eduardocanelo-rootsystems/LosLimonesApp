import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, ClipboardCheck, Copy, FileDown,
  Loader2, PenLine, Save, Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { reloadOnStaleChunk } from '@/lib/chunkReload'
import { usePresupuesto } from '@/pages/Presupuestos/usePresupuestos'
import { useFirmaContratista, useGuardarFirmaContratista } from '@/hooks/useConfiguracion'
import { useLogoCliente } from '@/hooks/useLogoCliente'
import { SignatureCanvas } from '@/components/SignatureCanvas'
import { useActaRecepcion, useGuardarActa, useAnularFirmaActa } from './useActaRecepcion'
import type { ActaItem } from './useActaRecepcion'
import type { ActaPDFData } from './ActaRecepcionPDF'

// ─── Tipo local para ítems editables ─────────────────────────────────────────

interface ItemEditable {
  id: string | null
  servicio_nombre: string
  completado: boolean
  observacion: string
  orden: number
}

// ─── Componente Field ─────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
  span2,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  span2?: boolean
}) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ActaRecepcionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: presupuesto, isLoading: loadingPres }   = usePresupuesto(id)
  const { data: acta,        isLoading: loadingActa }   = useActaRecepcion(id)
  const guardar      = useGuardarActa()
  const anularFirma  = useAnularFirmaActa()
  const { data: firmaGuardada } = useFirmaContratista()
  const guardarFirma = useGuardarFirmaContratista()
  const logoUrl      = useLogoCliente()

  const [mostrarCanvasFirma, setMostrarCanvasFirma] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initialized  = useRef(false)

  // ─── Estado del formulario ─────────────────────────────────────────────────

  const [fechaRecepcion, setFechaRecepcion] = useState('')
  const [observaciones,  setObservaciones]  = useState('')
  const [items, setItems] = useState<ItemEditable[]>([])

  // ─── Inicialización ────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialized.current) return
    if (loadingPres || loadingActa) return
    if (!presupuesto) return

    initialized.current = true

    if (acta) {
      // Cargar acta existente
      setFechaRecepcion(acta.fecha_recepcion_prov ?? '')
      setObservaciones(acta.observaciones_generales ?? '')
      setItems(
        acta.items.map((i: ActaItem) => ({
          id:              i.id,
          servicio_nombre: i.servicio_nombre,
          completado:      i.completado,
          observacion:     i.observacion ?? '',
          orden:           i.orden,
        }))
      )
    } else {
      // Nuevo acta: auto-poblar desde servicios del presupuesto (no adicionales)
      const servicios = presupuesto.servicios.filter((s) => !s.es_adicional)
      setItems(
        servicios.map((s, idx) => ({
          id:              null,
          servicio_nombre: s.nombre_snapshot,
          completado:      true,
          observacion:     '',
          orden:           idx,
        }))
      )
      // Fecha por defecto: hoy
      setFechaRecepcion(new Date().toISOString().substring(0, 10))
    }
  }, [presupuesto, acta, loadingPres, loadingActa])

  // ─── Manipulación de ítems ─────────────────────────────────────────────────

  const toggleCompletado = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, completado: !item.completado } : item))
    )
  }

  const updateObservacion = (idx: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, observacion: value } : item))
    )
  }

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id:              null,
        servicio_nombre: '',
        completado:      true,
        observacion:     '',
        orden:           prev.length,
      },
    ])
  }

  const eliminarItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, orden: i })))
  }

  const updateNombre = (idx: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, servicio_nombre: value } : item))
    )
  }

  // ─── Firma contratista ────────────────────────────────────────────────────

  const handleGuardarFirma = async (dataUrl: string) => {
    try {
      await guardarFirma.mutateAsync(dataUrl)
      setMostrarCanvasFirma(false)
      toast.success('Firma guardada.')
    } catch {
      toast.error('Error al guardar la firma.')
    }
  }

  const handleSubirImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 420; canvas.height = 150
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 420, 150)
        const scale = Math.min(420 / img.width, 150 / img.height)
        const x = (420 - img.width * scale) / 2
        const y = (150 - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        handleGuardarFirma(canvas.toDataURL('image/png'))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  const firmaEfectiva = firmaGuardada ?? acta?.firma_contratista_base64 ?? null

  const handleGuardar = async () => {
    if (!id) return
    if (!fechaRecepcion) { toast.error('La fecha de recepción es obligatoria.'); return }
    if (items.some((i) => !i.servicio_nombre.trim())) {
      toast.error('Todos los ítems deben tener nombre.')
      return
    }
    try {
      await guardar.mutateAsync({
        presupuesto_id:          id,
        fecha_recepcion_prov:    fechaRecepcion || null,
        observaciones_generales: observaciones || null,
        firma_contratista_base64: firmaEfectiva,
        items: items.map((item, idx) => ({
          servicio_nombre: item.servicio_nombre,
          completado:      item.completado,
          observacion:     item.observacion,
          orden:           idx,
        })),
      })
      toast.success('Acta guardada.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar.'
      toast.error(msg)
    }
  }

  // ─── Descargar PDF ────────────────────────────────────────────────────────

  const [generandoPDF, setGenerandoPDF] = useState(false)

  const handleDescargarPDF = async () => {
    if (!presupuesto) return
    setGenerandoPDF(true)
    try {
      const [{ pdf }, { ActaRecepcionPDFDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ActaRecepcionPDF'),
      ])
      const pdfData: ActaPDFData = {
        presupuesto_numero:      presupuesto.numero ?? null,
        presupuesto_fecha:       presupuesto.fecha_creacion ?? null,
        nombre_comitente:        presupuesto.cliente_razon_social ?? null,
        nombre_administrador:    presupuesto.cliente_administrador ?? null,
        administrador_dni:       presupuesto.cliente_administrador_cuit ?? null,
        direccion_obra:          presupuesto.cliente_direccion ?? null,
        fecha_recepcion_prov:    fechaRecepcion || null,
        observaciones_generales: observaciones || null,
        items: items.map((item, idx) => ({
          id:              item.id ?? `tmp-${idx}`,
          acta_id:         acta?.id ?? '',
          servicio_nombre: item.servicio_nombre,
          completado:      item.completado,
          observacion:     item.observacion || null,
          orden:           idx,
        })),
      }
      const blob = await pdf(
        <ActaRecepcionPDFDocument
          data={pdfData}
          firmaContratista={firmaEfectiva}
          firmaCliente={acta?.firma_cliente_base64 ?? null}
          logoUrl={logoUrl}
        />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `acta-${presupuesto.numero ?? id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      if (!reloadOnStaleChunk(err)) toast.error('Error al generar el PDF.')
    } finally {
      setGenerandoPDF(false)
    }
  }

  // ─── Copiar link de firma ─────────────────────────────────────────────────

  const copiarLink = () => {
    if (!acta?.token_firma) return
    const url = `${window.location.origin}/firmar-acta/${acta.token_firma}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado.')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingPres || loadingActa) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
      </div>
    )
  }

  if (!presupuesto) {
    return <div className="py-16 text-center text-ink-400">Presupuesto no encontrado.</div>
  }

  const completados = items.filter((i) => i.completado).length

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ── */}
      <div className="sticky top-16 z-30 -mx-6 border-b border-ink-800 bg-ink-950/90 px-6 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/presupuestos/${id}`)}
              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-accent-400">
                  {presupuesto.numero ?? '—'}
                </span>
                <span className="text-xs text-ink-500">· Acta de Recepción Provisoria</span>
              </div>
              {presupuesto.cliente_razon_social && (
                <p className="text-xs text-ink-500">{presupuesto.cliente_razon_social}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="btn-secondary"
            >
              {generandoPDF
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><FileDown className="h-4 w-4" />Descargar PDF</>}
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardar.isPending}
              className="btn-primary"
            >
              {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ── Fecha de recepción ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Recepción Provisoria
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha de recepción provisoria" hint="Aparece en el acta y activa el período de 30 días para la recepción definitiva">
            <input
              type="date"
              value={fechaRecepcion}
              onChange={(e) => setFechaRecepcion(e.target.value)}
              className="input-base font-mono"
            />
          </Field>
          <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
            <ClipboardCheck className={cn('h-8 w-8 shrink-0', completados === items.length && items.length > 0 ? 'text-success' : 'text-warning')} />
            <div>
              <p className="text-xs text-ink-500 uppercase tracking-wider">Avance</p>
              <p className="text-lg font-bold tabular-nums text-ink-100">
                {completados} / {items.length}
                <span className="ml-1 text-xs font-normal text-ink-400">ítems completados</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Checklist de ítems ── */}
      <section className="card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
            Verificación de trabajos
          </h2>
          <button
            type="button"
            onClick={agregarItem}
            className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-medium text-ink-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
          >
            + Agregar ítem
          </button>
        </div>

        <div className="space-y-3">
          {items.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-500">
              No hay ítems. El presupuesto no tiene servicios asignados, o podés agregar ítems manualmente.
            </p>
          )}

          {items.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                item.completado
                  ? 'border-success/30 bg-success/5'
                  : 'border-warning/30 bg-warning/5'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Toggle completado */}
                <button
                  type="button"
                  onClick={() => toggleCompletado(idx)}
                  className={cn(
                    'mt-0.5 h-5 w-5 shrink-0 rounded border-2 transition-colors flex items-center justify-center',
                    item.completado
                      ? 'border-success bg-success text-white'
                      : 'border-ink-600 bg-transparent'
                  )}
                >
                  {item.completado && <CheckCircle className="h-3 w-3" />}
                </button>

                <div className="flex-1 space-y-2">
                  {/* Nombre del ítem */}
                  <input
                    type="text"
                    value={item.servicio_nombre}
                    onChange={(e) => updateNombre(idx, e.target.value)}
                    placeholder="Nombre del servicio / trabajo"
                    className="input-base text-sm font-medium"
                  />

                  {/* Observación */}
                  <input
                    type="text"
                    value={item.observacion}
                    onChange={(e) => updateObservacion(idx, e.target.value)}
                    placeholder="Observaciones (opcional)"
                    className="input-base text-sm text-ink-400"
                  />
                </div>

                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                  item.completado
                    ? 'bg-success/20 text-success'
                    : 'bg-warning/20 text-warning'
                )}>
                  {item.completado ? 'Completado' : 'Pendiente'}
                </span>

                <button
                  type="button"
                  onClick={() => eliminarItem(idx)}
                  className="shrink-0 text-ink-600 hover:text-danger transition-colors text-xs"
                  title="Eliminar ítem"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Observaciones generales ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Observaciones generales
        </h2>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          rows={4}
          placeholder="Notas generales sobre la recepción de la obra…"
          className="input-base w-full resize-none"
        />
      </section>

      {/* ── Firma digital ── */}
      <section className="card space-y-6 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Firma digital</h2>

        {/* Firma contratista */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">
            Tu firma (contratista)
          </p>
          {firmaEfectiva && !mostrarCanvasFirma ? (
            <div className="flex items-start gap-4">
              <div className="rounded-lg border border-ink-700 bg-white p-2">
                <img src={firmaEfectiva} alt="Tu firma" className="h-14 w-auto" />
              </div>
              <div className="space-y-1.5">
                <p className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle className="h-3.5 w-3.5" />Firma configurada
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarCanvasFirma(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors"
                >
                  <PenLine className="h-3.5 w-3.5" />Dibujar nueva firma
                </button>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors">
                  {guardarFirma.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Upload className="h-3.5 w-3.5" />}
                  Subir imagen
                  <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleSubirImagen} />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {mostrarCanvasFirma && (
                <button
                  type="button"
                  onClick={() => setMostrarCanvasFirma(false)}
                  className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
                >
                  ← Cancelar
                </button>
              )}
              <SignatureCanvas onSave={handleGuardarFirma} existingSignature={firmaEfectiva} />
            </div>
          )}
        </div>

        <div className="border-t border-ink-800" />

        {/* Firma cliente */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">
            Conformidad del cliente
          </p>

          {acta?.firmado_cliente ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Acta firmada por el cliente</p>
                  {acta.fecha_firma_cliente && (
                    <p className="text-xs text-ink-400">
                      {new Intl.DateTimeFormat('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: 'America/Argentina/Buenos_Aires',
                      }).format(new Date(acta.fecha_firma_cliente))}
                    </p>
                  )}
                </div>
              </div>
              {acta.firma_cliente_base64 && (
                <div className="inline-block rounded-lg border border-ink-700 bg-white p-2">
                  <img src={acta.firma_cliente_base64} alt="Firma del cliente" className="h-14 w-auto" />
                </div>
              )}
              <button
                type="button"
                onClick={() => { if (id) anularFirma.mutate(id) }}
                disabled={anularFirma.isPending}
                className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-danger transition-colors disabled:opacity-50"
              >
                {anularFirma.isPending ? '…' : '× Anular firma del cliente'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ink-500">
                Guardá el acta primero y luego copiá el link para enviárselo al cliente.
                El cliente podrá firmar desde cualquier dispositivo.
              </p>
              {acta?.token_firma ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
                    <p className="truncate font-mono text-xs text-ink-400">
                      {`${window.location.origin}/firmar-acta/${acta.token_firma}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copiarLink}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-medium text-ink-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />Copiar link
                  </button>
                </div>
              ) : (
                <p className="text-xs text-warning">
                  Guardá el acta para obtener el link de firma.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
