import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Copy, FileDown, Loader2, PenLine, Save, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { cn } from '@/lib/utils'
import { usePresupuesto } from '@/pages/Presupuestos/usePresupuestos'
import { useContrato, useGuardarContrato, useAnularFirmaCliente } from './useContrato'
import { useFirmaContratista, useGuardarFirmaContratista } from '@/hooks/useConfiguracion'
import { SignatureCanvas } from '@/components/SignatureCanvas'
import {
  ContratoPDFDocument,
  calcTotalPresupuesto,
  calcFinanciamiento,
  PLANES_PAGO,
  addWorkingDays,
} from './components/ContratoPDF'
import type { ContratoFormValues, PlanPago } from './components/ContratoPDF'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(v)
}

function addDaysToISO(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().substring(0, 10)
}

function calcFechasCuota(fechaFirma: string, plan: PlanPago): [string, string] {
  if (!fechaFirma) return ['', '']
  if (plan === '60dias') return [addDaysToISO(fechaFirma, 30), addDaysToISO(fechaFirma, 60)]
  if (plan === '90dias') return [addDaysToISO(fechaFirma, 45), addDaysToISO(fechaFirma, 90)]
  return ['', '']
}

// ─── Componentes de formulario ────────────────────────────────────────────────

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

export default function ContratoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: presupuesto, isLoading: loadingPres } = usePresupuesto(id)
  const { data: contrato, isLoading: loadingContrato } = useContrato(id)
  const guardar      = useGuardarContrato()
  const anularFirma  = useAnularFirmaCliente()
  const { data: firmaGuardada } = useFirmaContratista()
  const guardarFirma = useGuardarFirmaContratista()

  const [mostrarCanvasFirma, setMostrarCanvasFirma] = useState(false)
  const fileInputFirmaRef = useRef<HTMLInputElement>(null)

  const initialized = useRef(false)

  // ─── Estado del formulario ─────────────────────────────────────────────────

  const [nombreComitente, setNombreComitente] = useState('')
  const [direccionObra, setDireccionObra] = useState('')
  const [nombreAdministrador, setNombreAdministrador] = useState('')
  const [administradorDni, setAdministradorDni] = useState('')
  const [sectorObra, setSectorObra] = useState('')
  const [planPago, setPlanPago] = useState<PlanPago>('')
  const [adelanto, setAdelanto] = useState('')
  const [numCuotas, setNumCuotas] = useState('')
  const [montoCuota, setMontoCuota] = useState('')
  const [fechaCuota1, setFechaCuota1] = useState('')
  const [fechaCuota2, setFechaCuota2] = useState('')
  const [montoMulta, setMontoMulta] = useState('')
  const [direccionLegal, setDireccionLegal] = useState('')
  const [fechaInicioObra, setFechaInicioObra] = useState('')
  const [fechaFirma, setFechaFirma] = useState('')

  // Fecha fin calculada: inicio + días hábiles del presupuesto (no se guarda en DB)
  const fechaFinObra = useMemo(() => {
    if (!fechaInicioObra || !presupuesto?.dias_estimados_obra) return ''
    return addWorkingDays(fechaInicioObra, presupuesto.dias_estimados_obra)
  }, [fechaInicioObra, presupuesto?.dias_estimados_obra])

  // ─── Inicialización ────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialized.current) return
    if (loadingPres || loadingContrato) return
    if (!presupuesto) return

    initialized.current = true

    // Fecha de firma: usa la guardada o la fecha de aprobación del presupuesto
    const fechaFirmaDefault = presupuesto.fecha_aprobacion
      ? presupuesto.fecha_aprobacion.substring(0, 10)
      : ''

    if (contrato) {
      setNombreComitente(contrato.nombre_comitente ?? presupuesto.cliente_razon_social ?? '')
      setDireccionObra(contrato.direccion_obra ?? presupuesto.cliente_direccion ?? '')
      setNombreAdministrador(contrato.nombre_administrador ?? presupuesto.cliente_administrador ?? '')
      setAdministradorDni(contrato.administrador_dni ?? '')
      setSectorObra(contrato.sector_obra ?? '')
      setPlanPago((contrato.plan_pago as PlanPago) ?? '')
      setAdelanto(contrato.adelanto?.toString() ?? '')
      setNumCuotas(contrato.num_cuotas?.toString() ?? '')
      setMontoCuota(contrato.monto_cuota?.toString() ?? '')
      setFechaCuota1(contrato.fecha_cuota_1 ?? '')
      setFechaCuota2(contrato.fecha_cuota_2 ?? '')
      setMontoMulta(contrato.monto_multa?.toString() ?? '')
      setDireccionLegal(contrato.direccion_legal ?? presupuesto.cliente_direccion ?? '')
      setFechaInicioObra(contrato.fecha_inicio_obra ?? '')
      setFechaFirma(contrato.fecha_firma ?? fechaFirmaDefault)
    } else {
      // Nuevo contrato: pre-llenar todo lo disponible desde el presupuesto
      setNombreComitente(presupuesto.cliente_razon_social ?? '')
      setDireccionObra(presupuesto.cliente_direccion ?? '')
      setNombreAdministrador(presupuesto.cliente_administrador ?? '')
      setDireccionLegal(presupuesto.cliente_direccion ?? '')
      setFechaFirma(fechaFirmaDefault)
    }
  }, [presupuesto, contrato, loadingPres, loadingContrato])

  // ─── Selección de plan ─────────────────────────────────────────────────────

  const handleSelectPlan = (plan: PlanPago) => {
    if (!presupuesto) return
    const base = calcTotalPresupuesto(presupuesto)
    const { anticipo, numInstallments, montoCuota: cuota } = calcFinanciamiento(base, plan)

    setPlanPago(plan)
    setAdelanto(anticipo.toFixed(2))
    setNumCuotas(numInstallments > 0 ? String(numInstallments) : '')
    setMontoCuota(numInstallments > 0 ? cuota.toFixed(2) : '')

    if (numInstallments > 0) {
      const firma = fechaFirma
      const [d1, d2] = calcFechasCuota(firma, plan)
      setFechaCuota1(d1)
      setFechaCuota2(d2)
    } else {
      setFechaCuota1('')
      setFechaCuota2('')
    }
  }

  // Recalcular fechas de cuota cuando cambia la fecha de firma
  const handleFechaFirmaChange = (value: string) => {
    setFechaFirma(value)
    if (planPago === '60dias' || planPago === '90dias') {
      const [d1, d2] = calcFechasCuota(value, planPago)
      setFechaCuota1(d1)
      setFechaCuota2(d2)
    }
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (!id) return
    try {
      await guardar.mutateAsync({
        presupuesto_id: id,
        nombre_comitente: nombreComitente || null,
        direccion_obra: direccionObra || null,
        nombre_administrador: nombreAdministrador || null,
        administrador_dni: administradorDni || null,
        sector_obra: sectorObra || null,
        plan_pago: (planPago || null) as 'contado' | '60dias' | '90dias' | null,
        adelanto: adelanto ? parseFloat(adelanto) : null,
        num_cuotas: numCuotas ? parseInt(numCuotas) : null,
        monto_cuota: montoCuota ? parseFloat(montoCuota) : null,
        fecha_cuota_1: fechaCuota1 || null,
        fecha_cuota_2: fechaCuota2 || null,
        monto_multa: montoMulta ? parseFloat(montoMulta) : null,
        direccion_legal: direccionLegal || null,
        fecha_inicio_obra: fechaInicioObra || null,
        fecha_firma: fechaFirma || null,
        firma_contratista_base64: firmaGuardada ?? null,
      })
      toast.success('Contrato guardado.')
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Error al guardar.'
      toast.error(msg)
    }
  }

  const handleGuardarFirma = async (dataUrl: string) => {
    try {
      await guardarFirma.mutateAsync(dataUrl)
      setMostrarCanvasFirma(false)
      toast.success('Firma guardada correctamente.')
    } catch {
      toast.error('Error al guardar la firma.')
    }
  }

  const handleSubirImagenFirma = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = 420
        canvas.height = 150
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 420, 150)
        const scale = Math.min(420 / img.width, 150 / img.height)
        const x = (420 - img.width  * scale) / 2
        const y = (150 - img.height * scale) / 2
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        handleGuardarFirma(canvas.toDataURL('image/png'))
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    if (fileInputFirmaRef.current) fileInputFirmaRef.current.value = ''
  }

  const copiarLinkFirma = () => {
    if (!contrato?.token_firma) return
    const url = `${window.location.origin}/firmar/${contrato.token_firma}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado al portapapeles.')
  }

  const firmaEfectiva = firmaGuardada ?? contrato?.firma_contratista_base64 ?? null

  // ─── Form values para el PDF ───────────────────────────────────────────────

  const formValues: ContratoFormValues = {
    nombre_comitente: nombreComitente,
    direccion_obra: direccionObra,
    nombre_administrador: nombreAdministrador,
    administrador_dni: administradorDni,
    sector_obra: sectorObra,
    plan_pago: planPago,
    adelanto,
    num_cuotas: numCuotas,
    monto_cuota: montoCuota,
    fecha_cuota_1: fechaCuota1,
    fecha_cuota_2: fechaCuota2,
    monto_multa: montoMulta,
    direccion_legal: direccionLegal,
    fecha_inicio_obra: fechaInicioObra,
    fecha_firma: fechaFirma,
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingPres || loadingContrato) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
      </div>
    )
  }

  if (!presupuesto) {
    return <div className="py-16 text-center text-ink-400">Presupuesto no encontrado.</div>
  }

  const baseTotal = calcTotalPresupuesto(presupuesto)
  const esFinanciado = planPago === '60dias' || planPago === '90dias'
  const fileName = `contrato-${presupuesto.numero ?? id}.pdf`

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
                <span className="text-xs text-ink-500">· Contrato de Locación de Obra</span>
              </div>
              {presupuesto.cliente_razon_social && (
                <p className="text-xs text-ink-500">{presupuesto.cliente_razon_social}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PDFDownloadLink
              document={
                <ContratoPDFDocument
                  presupuesto={presupuesto}
                  form={formValues}
                  firmaContratista={firmaEfectiva}
                  firmaCliente={contrato?.firma_cliente_base64 ?? null}
                  firmaUrl={contrato?.token_firma ? `${window.location.origin}/firmar/${contrato.token_firma}` : undefined}
                />
              }
              fileName={fileName}
              className="btn-secondary"
            >
              {({ loading }) =>
                loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Solo contrato
                  </>
                )
              }
            </PDFDownloadLink>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardar.isPending}
              className="btn-primary"
            >
              {guardar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ── Partes ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Partes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del comitente">
            <input
              type="text"
              value={nombreComitente}
              onChange={(e) => setNombreComitente(e.target.value)}
              className="input-base"
              placeholder="Consorcio / Empresa"
            />
          </Field>
          <Field label="Dirección de la obra" hint="Aparece en el título y en las cláusulas Primera y Novena">
            <input
              type="text"
              value={direccionObra}
              onChange={(e) => setDireccionObra(e.target.value)}
              className="input-base"
              placeholder="Calle 123, piso 4, CABA"
            />
          </Field>
          <Field label="Nombre del administrador">
            <input
              type="text"
              value={nombreAdministrador}
              onChange={(e) => setNombreAdministrador(e.target.value)}
              className="input-base"
              placeholder="Nombre y apellido"
            />
          </Field>
          <Field label="DNI del administrador">
            <input
              type="text"
              value={administradorDni}
              onChange={(e) => setAdministradorDni(e.target.value)}
              className="input-base font-mono"
              placeholder="12.345.678"
            />
          </Field>
          <Field
            label="Domicilio legal del comitente"
            span2
            hint="Para la Cláusula Novena · puede diferir de la dirección de la obra"
          >
            <input
              type="text"
              value={direccionLegal}
              onChange={(e) => setDireccionLegal(e.target.value)}
              className="input-base"
              placeholder="Calle 123, piso 4, CABA"
            />
          </Field>
        </div>
      </section>

      {/* ── Objeto ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Objeto de la obra</h2>
        <Field label="Sector" hint="Ej: pozo de aire y luz, fachada principal, medianera norte">
          <input
            type="text"
            value={sectorObra}
            onChange={(e) => setSectorObra(e.target.value)}
            className="input-base"
            placeholder="pozo de aire y luz"
          />
        </Field>
      </section>

      {/* ── Financiamiento ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Plan de financiamiento
        </h2>

        <div className="overflow-hidden rounded-lg border border-ink-700">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 border-b border-ink-700 bg-ink-800 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">Plan</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 text-right">Total</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-400 text-right">Anticipo</span>
            <span className="w-44 text-xs font-semibold uppercase tracking-wider text-ink-400 text-right">Cuotas</span>
          </div>

          {(['contado', '60dias', '90dias'] as PlanPago[]).map((plan) => {
            const { totalFinal, anticipo, numInstallments, montoCuota: cuota } = calcFinanciamiento(baseTotal, plan)
            const cfg = PLANES_PAGO[plan as keyof typeof PLANES_PAGO]
            const isSelected = planPago === plan

            return (
              <button
                key={plan}
                type="button"
                onClick={() => handleSelectPlan(plan)}
                className={cn(
                  'grid w-full grid-cols-[1fr_auto_auto_auto] gap-x-6 border-b border-ink-700 px-4 py-3 text-left transition-colors last:border-b-0',
                  isSelected
                    ? 'bg-accent-500/10 ring-inset ring-1 ring-accent-500/40'
                    : 'hover:bg-ink-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                    isSelected ? 'border-accent-400 bg-accent-400' : 'border-ink-600'
                  )} />
                  <div>
                    <p className={cn('text-sm font-medium', isSelected ? 'text-accent-300' : 'text-ink-100')}>
                      {cfg.label}
                    </p>
                    {cfg.recargo > 0 && (
                      <p className="text-xs text-ink-500">
                        Recargo {(cfg.recargo * 100).toFixed(0)}% sobre valor de contado
                      </p>
                    )}
                  </div>
                </div>
                <span className={cn('font-mono text-sm tabular-nums', isSelected ? 'font-semibold text-ink-100' : 'text-ink-300')}>
                  {fmtCurrency(totalFinal)}
                </span>
                <span className="font-mono text-sm tabular-nums text-ink-300">
                  {fmtCurrency(anticipo)}
                </span>
                <span className="w-44 font-mono text-sm tabular-nums text-right text-ink-300">
                  {plan === 'contado'
                    ? <span className="text-ink-500">saldo al completar</span>
                    : `${numInstallments} × ${fmtCurrency(cuota)}`}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Anticipo: 50% del valor de contado · Al seleccionar un plan se completan los campos automáticamente.
        </p>
      </section>

      {/* ── Precio y pago ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Precio y pago
        </h2>

        {/* Total (read-only) */}
        <div className="mb-5 flex flex-wrap items-center gap-6 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-500">Total de contado</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-accent-400">{fmtCurrency(baseTotal)}</p>
          </div>
          {esFinanciado && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ink-500">
                Total financiado ({PLANES_PAGO[planPago as '60dias' | '90dias'].cuotasLabel})
              </p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-ink-100">
                {fmtCurrency(calcFinanciamiento(baseTotal, planPago).totalFinal)}
              </p>
            </div>
          )}
          <div className="ml-auto text-right">
            <p className="text-xs text-ink-500">Días estimados de obra</p>
            <p className="font-semibold text-ink-300">{presupuesto.dias_estimados_obra ?? '—'} días hábiles</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Anticipo ($ ARS)" hint="Auto-completado al elegir plan">
            <input
              type="number"
              min="0"
              step="0.01"
              value={adelanto}
              onChange={(e) => setAdelanto(e.target.value)}
              className="input-base font-mono"
              placeholder="0.00"
            />
          </Field>
          {esFinanciado && (
            <>
              <Field label="N.° de cuotas">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={numCuotas}
                  onChange={(e) => setNumCuotas(e.target.value)}
                  className="input-base font-mono"
                  placeholder="2"
                />
              </Field>
              <Field label="Monto por cuota ($ ARS)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoCuota}
                  onChange={(e) => setMontoCuota(e.target.value)}
                  className="input-base font-mono"
                  placeholder="0.00"
                />
              </Field>
              <Field label="Fecha vencimiento Cuota 1" hint="Auto-calculada desde la fecha de firma">
                <input
                  type="date"
                  value={fechaCuota1}
                  onChange={(e) => setFechaCuota1(e.target.value)}
                  className="input-base font-mono"
                />
              </Field>
              <Field label="Fecha vencimiento Cuota 2">
                <input
                  type="date"
                  value={fechaCuota2}
                  onChange={(e) => setFechaCuota2(e.target.value)}
                  className="input-base font-mono"
                />
              </Field>
            </>
          )}
        </div>
      </section>

      {/* ── Plazos ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Plazos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha de inicio de obra">
            <input
              type="date"
              value={fechaInicioObra}
              onChange={(e) => setFechaInicioObra(e.target.value)}
              className="input-base font-mono"
            />
          </Field>
          <Field
            label="Fecha estimada de finalización"
            hint={presupuesto.dias_estimados_obra
              ? `Calculada automáticamente: ${presupuesto.dias_estimados_obra} días hábiles desde el inicio`
              : 'Configurá los días estimados en el presupuesto para calcular este valor'}
          >
            <div className={cn(
              'input-base font-mono select-none',
              fechaFinObra ? 'text-ink-200' : 'text-ink-500'
            )}>
              {fechaFinObra
                ? new Intl.DateTimeFormat('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    timeZone: 'America/Argentina/Buenos_Aires',
                  }).format(new Date(fechaFinObra + 'T12:00:00'))
                : '—'}
            </div>
          </Field>
          <Field label="Multa por día de retraso ($ ARS)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={montoMulta}
              onChange={(e) => setMontoMulta(e.target.value)}
              className="input-base font-mono"
              placeholder="0.00"
            />
          </Field>
        </div>
      </section>

      {/* ── Fecha de firma ── */}
      <section className="card p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">Fecha de firma</h2>
        <Field
          label="Fecha de firma del contrato"
          hint={esFinanciado ? 'Al cambiar esta fecha se recalculan automáticamente las fechas de cuota' : 'Aparece en el encabezado y en la cláusula de cierre'}
        >
          <input
            type="date"
            value={fechaFirma}
            onChange={(e) => handleFechaFirmaChange(e.target.value)}
            className="input-base font-mono"
          />
        </Field>
      </section>

      {/* ── Firma digital ── */}
      <section className="card p-6 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Firma digital</h2>

        {/* Firma del contratista */}
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
                <p className="text-xs text-success font-medium flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Firma configurada
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarCanvasFirma(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Dibujar nueva firma
                </button>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors">
                  {guardarFirma.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Upload className="h-3.5 w-3.5" />
                  }
                  Subir imagen de firma
                  <input
                    ref={fileInputFirmaRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleSubirImagenFirma}
                  />
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

        {/* Divider */}
        <div className="border-t border-ink-800" />

        {/* Firma del cliente */}
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-ink-500">
            Firma del cliente
          </p>
          {contrato?.firmado_cliente ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/30 px-4 py-3">
                <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium text-success">Contrato firmado por el cliente</p>
                  {contrato.fecha_firma_cliente && (
                    <p className="text-xs text-ink-400">
                      {new Intl.DateTimeFormat('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                        timeZone: 'America/Argentina/Buenos_Aires',
                      }).format(new Date(contrato.fecha_firma_cliente))}
                    </p>
                  )}
                </div>
              </div>
              {contrato.firma_cliente_base64 && (
                <div>
                  <p className="mb-1 text-xs text-ink-500">Firma registrada:</p>
                  <div className="inline-block rounded-lg border border-ink-700 bg-white p-2">
                    <img src={contrato.firma_cliente_base64} alt="Firma del cliente" className="h-14 w-auto" />
                  </div>
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
                Guardá el contrato primero y luego copiá el link para enviárselo al cliente.
                El cliente podrá firmar digitalmente desde cualquier dispositivo.
              </p>
              {contrato?.token_firma ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-lg border border-ink-700 bg-ink-900 px-3 py-2">
                    <p className="truncate font-mono text-xs text-ink-400">
                      {`${window.location.origin}/firmar/${contrato.token_firma}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copiarLinkFirma}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-xs font-medium text-ink-300 hover:border-accent-500 hover:text-accent-400 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar link
                  </button>
                </div>
              ) : (
                <p className="text-xs text-warning">
                  Guardá el contrato para obtener el link de firma.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
