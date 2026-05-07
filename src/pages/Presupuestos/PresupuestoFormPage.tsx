import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Loader2, Mail, Save, ScrollText } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { useContrato } from '@/pages/Contratos/useContrato'
import { contratoToFormValues } from '@/pages/Contratos/components/contratoUtils'
import { useFirmaContratista } from '@/hooks/useConfiguracion'
import { useLogoCliente } from '@/hooks/useLogoCliente'
import { useServicios } from '@/pages/Servicios/useServicios'
import { useMateriales } from '@/pages/Materiales/useMateriales'
import { useManoDeObra } from '@/pages/ManoDeObra/useManoDeObra'
import type {
  EstadoPresupuesto,
  FormManoObraItem,
  FormMaterialItem,
  FormServicioItem,
} from '@/types/database'
import type { PlanFinanciamiento } from './components/SeccionFinanciamiento'
import { useGuardarPresupuesto, usePresupuesto, usePresupuestos } from './usePresupuestos'
import { SeccionCliente } from './components/SeccionCliente'
import type { HistorialCliente } from './components/SeccionCliente'
import { SeccionEdificacion } from './components/SeccionEdificacion'
import { SeccionServicios } from './components/SeccionServicios'
import { SeccionMateriales } from './components/SeccionMateriales'
import { SeccionDescuento } from './components/SeccionDescuento'
import { SeccionManoDeObra } from './components/SeccionManoDeObra'
import { PanelTotales } from './components/PanelTotales'
import { SeccionFinanciamiento } from './components/SeccionFinanciamiento'
import { SeccionCobros } from './components/SeccionCobros'
import { SeccionFotos } from './components/SeccionFotos'

const ESTADO_LABEL: Record<EstadoPresupuesto, string> = {
  emitido:      'Emitido',
  aprobado:     'Aprobado',
  finalizado:   'Finalizado',
  rechazado:    'Rechazado',
  relevamiento: 'Relevamiento',
}

const ESTADO_COLOR: Record<EstadoPresupuesto, string> = {
  emitido:      'text-warning',
  aprobado:     'text-success',
  finalizado:   'text-ink-400',
  rechazado:    'text-danger',
  relevamiento: 'text-ink-500',
}

export default function PresupuestoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const esNuevo = !id

  const { data: presupuesto, isLoading: loadingPresupuesto, isFetching: fetchingPresupuesto } = usePresupuesto(id)
  const { data: contrato, isFetching: fetchingContrato } = useContrato(id)
  const { data: todosLosPresupuestos = [] } = usePresupuestos()
  const { data: firmaContratista } = useFirmaContratista()
  const logoUrl = useLogoCliente()
  const { data: catalogoServicios = [] } = useServicios()
  const { data: catalogoMateriales = [] } = useMateriales()
  const { data: catalogoManoDeObra = [] } = useManoDeObra()
  const guardar = useGuardarPresupuesto()

  // ─── Estado del formulario ──────────────────────────────────────────────────

  const [estado, setEstado] = useState<EstadoPresupuesto>('emitido')

  // Cliente
  const [clienteRazonSocial, setClienteRazonSocial] = useState('')
  const [clienteCuit, setClienteCuit] = useState('')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [clienteAdministrador, setClienteAdministrador] = useState('')
  const [clienteAdministradorCuit, setClienteAdministradorCuit] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')

  // Edificación
  const [edifAnios, setEdifAnios] = useState('')
  const [edifAltura, setEdifAltura] = useState('')
  const [edifColor, setEdifColor] = useState('')
  const [edifAcabado, setEdifAcabado] = useState<string[]>([])
  const [edifM2, setEdifM2] = useState('')
  const [edifCondicion, setEdifCondicion] = useState('')
  const [edifTipologia, setEdifTipologia] = useState('')
  const [edifClaseIncendio, setEdifClaseIncendio] = useState('')
  const [edifValorPatrimonial, setEdifValorPatrimonial] = useState(false)
  const [edifProteccion, setEdifProteccion] = useState('')
  const [coefK, setCoefK] = useState('')

  // Observaciones
  const [observaciones, setObservaciones] = useState('')

  // Ítems
  const [servicios, setServicios] = useState<FormServicioItem[]>([])
  const [materiales, setMateriales] = useState<FormMaterialItem[]>([])
  const [manoDeObra, setManoDeObra] = useState<FormManoObraItem[]>([])

  // Descuento
  const [tieneDescuento, setTieneDescuento] = useState(false)
  const [descuentoTipo, setDescuentoTipo] = useState<'fijo' | 'porcentaje'>('porcentaje')
  const [descuentoValor, setDescuentoValor] = useState('')

  // MO
  const [diasEstimados, setDiasEstimados] = useState('')

  // IVA
  const [ivaPct, setIvaPct] = useState('0')

  // Aprobación
  const [fechaAprobacion, setFechaAprobacion] = useState('')

  // Financiamiento
  const [planPago, setPlanPago] = useState<PlanFinanciamiento>(null)

  // ─── Cargar datos al editar ─────────────────────────────────────────────────

  useEffect(() => {
    if (!presupuesto) return

    setEstado(presupuesto.estado)
    setClienteRazonSocial(presupuesto.cliente_razon_social ?? '')
    setClienteCuit(presupuesto.cliente_cuit ?? '')
    setClienteTelefono(presupuesto.cliente_telefono ?? '')
    setClienteDireccion(presupuesto.cliente_direccion ?? '')
    setClienteAdministrador(presupuesto.cliente_administrador ?? '')
    setClienteAdministradorCuit(presupuesto.cliente_administrador_cuit ?? '')
    setClienteEmail(presupuesto.cliente_email ?? '')
    setEdifAnios(presupuesto.edif_anios?.toString() ?? '')
    setEdifAltura(presupuesto.edif_altura?.toString() ?? '')
    setEdifColor(presupuesto.edif_color ?? '')
    setEdifAcabado(presupuesto.edif_acabado ?? [])
    setEdifM2(presupuesto.edif_m2?.toString() ?? '')
    setEdifCondicion(presupuesto.edif_condicion_estructural ?? '')
    setEdifTipologia(presupuesto.edif_tipologia ?? '')
    setEdifClaseIncendio(presupuesto.edif_clase_incendio ?? '')
    setEdifValorPatrimonial(presupuesto.edif_valor_patrimonial ?? false)
    setEdifProteccion(presupuesto.edif_proteccion ?? '')
    setCoefK(presupuesto.coef_k?.toString() ?? '')
    setObservaciones(presupuesto.observaciones ?? '')
    setDescuentoTipo((presupuesto.descuento_tipo ?? 'porcentaje') as 'fijo' | 'porcentaje')
    setDescuentoValor(presupuesto.descuento_valor?.toString() ?? '')
    setTieneDescuento(!!presupuesto.descuento_tipo)
    setIvaPct(presupuesto.iva_pct?.toString() ?? '0')
    setDiasEstimados(presupuesto.dias_estimados_obra?.toString() ?? '')
    setFechaAprobacion(
      presupuesto.fecha_aprobacion
        ? presupuesto.fecha_aprobacion.substring(0, 10)
        : ''
    )
    setPlanPago((presupuesto.plan_pago as PlanFinanciamiento) ?? null)

    setServicios(
      presupuesto.servicios.map((s) => ({
        _key: s.id,
        servicio_id: s.servicio_id ?? '',
        nombre: s.nombre_snapshot,
        precio_m2: s.precio_m2_snapshot,
        es_adicional: s.es_adicional,
      }))
    )
    setMateriales(
      presupuesto.materiales.map((m) => ({
        _key: m.id,
        material_id: m.material_id ?? '',
        nombre: m.nombre_snapshot,
        unidad: m.unidad_snapshot,
        precio: m.precio_snapshot,
        cantidad: m.cantidad,
        es_adicional: m.es_adicional,
      }))
    )
    setManoDeObra(
      presupuesto.mano_obra.map((mo) => ({
        _key: mo.id,
        tipo_id: mo.tipo_id ?? '',
        tipo: mo.tipo_snapshot,
        costo_diario: mo.costo_diario_snapshot,
        cantidad_empleados: mo.cantidad_empleados,
        es_adicional: mo.es_adicional,
      }))
    )
  }, [presupuesto])

  // ─── Handler genérico para campos simples ───────────────────────────────────

  const handleField = (field: string, value: unknown) => {
    switch (field) {
      case 'cliente_razon_social': setClienteRazonSocial(value as string); break
      case 'cliente_cuit': setClienteCuit(value as string); break
      case 'cliente_telefono': setClienteTelefono(value as string); break
      case 'cliente_direccion': setClienteDireccion(value as string); break
      case 'cliente_administrador': setClienteAdministrador(value as string); break
      case 'cliente_administrador_cuit': setClienteAdministradorCuit(value as string); break
      case 'cliente_email': setClienteEmail(value as string); break
      case 'edif_anios': setEdifAnios(value as string); break
      case 'edif_altura': setEdifAltura(value as string); break
      case 'edif_color': setEdifColor(value as string); break
      case 'edif_acabado': setEdifAcabado(value as string[]); break
      case 'edif_m2': setEdifM2(value as string); break
      case 'edif_condicion_estructural': setEdifCondicion(value as string); break
      case 'edif_tipologia': setEdifTipologia(value as string); break
      case 'edif_clase_incendio': setEdifClaseIncendio(value as string); break
      case 'edif_valor_patrimonial': setEdifValorPatrimonial(value as boolean); break
      case 'edif_proteccion': setEdifProteccion(value as string); break
      case 'coef_k': setCoefK(value as string); break
      case 'tiene_descuento': setTieneDescuento(value as boolean); break
      case 'descuento_tipo': setDescuentoTipo(value as 'fijo' | 'porcentaje'); break
      case 'descuento_valor': setDescuentoValor(value as string); break
    }
  }

  // ─── Enviar por email ───────────────────────────────────────────────────────

  const [emailModal,     setEmailModal]     = useState(false)
  const [emailDest,      setEmailDest]      = useState('')
  const [enviando,       setEnviando]       = useState(false)
  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const abrirEmailModal = () => {
    setEmailDest(clienteEmail)
    setEmailModal(true)
    setTimeout(() => emailInputRef.current?.focus(), 50)
  }

  const handleDescargarPDF = async () => {
    if (!presupuesto) return
    setDescargandoPDF(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const fileName = esAprobado
        ? `${presupuesto.numero ?? 'presupuesto'}-contrato.pdf`
        : `${presupuesto.numero ?? 'presupuesto'}.pdf`
      let blob: Blob
      if (esAprobado) {
        const { PresupuestoContratoPDFDocument } = await import('./components/PresupuestoContratoPDF')
        const firmaUrl = contrato?.token_firma ? `${window.location.origin}/firmar/${contrato.token_firma}` : undefined
        blob = await pdf(
          <PresupuestoContratoPDFDocument
            presupuesto={presupuesto}
            form={contratoToFormValues(contrato ?? null, presupuesto)}
            firmaContratista={firmaContratista ?? contrato?.firma_contratista_base64 ?? null}
            firmaCliente={contrato?.firma_cliente_base64 ?? null}
            firmaUrl={firmaUrl}
            logoUrl={logoUrl}
          />
        ).toBlob()
      } else {
        const { PresupuestoPDFDocument } = await import('./components/PresupuestoPDF')
        blob = await pdf(<PresupuestoPDFDocument presupuesto={presupuesto} logoUrl={logoUrl} />).toBlob()
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al generar el PDF.')
    } finally {
      setDescargandoPDF(false)
    }
  }

  const enviarPorEmail = async () => {
    if (!presupuesto || !emailDest.trim()) return
    setEnviando(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const firmaUrl = contrato?.token_firma
        ? `${window.location.origin}/firmar/${contrato.token_firma}`
        : undefined
      let blob: Blob
      if (esAprobado) {
        const { PresupuestoContratoPDFDocument } = await import('./components/PresupuestoContratoPDF')
        blob = await pdf(
          <PresupuestoContratoPDFDocument
            presupuesto={presupuesto}
            form={contratoToFormValues(contrato ?? null, presupuesto)}
            firmaContratista={firmaContratista ?? contrato?.firma_contratista_base64 ?? null}
            firmaCliente={contrato?.firma_cliente_base64 ?? null}
            firmaUrl={firmaUrl}
            logoUrl={logoUrl}
          />
        ).toBlob()
      } else {
        const { PresupuestoPDFDocument } = await import('./components/PresupuestoPDF')
        blob = await pdf(<PresupuestoPDFDocument presupuesto={presupuesto} logoUrl={logoUrl} />).toBlob()
      }

      const arrayBuffer = await blob.arrayBuffer()
      const bytes       = new Uint8Array(arrayBuffer)
      let binary = ''
      bytes.forEach((b) => { binary += String.fromCharCode(b) })
      const pdfBase64 = btoa(binary)

      const { data: fnData, error: fnError } = await supabase.functions.invoke('enviar-presupuesto', {
        body: {
          email:         emailDest.trim(),
          pdfBase64,
          numero:        presupuesto.numero ?? 'S/N',
          nombreCliente: presupuesto.cliente_razon_social ?? '',
        },
      })
      if (fnError) throw new Error(fnError.message ?? JSON.stringify(fnError))
      if (fnData?.ok === false) throw new Error(fnData.error ?? 'Error desconocido de Resend')
      toast.success(`Presupuesto enviado a ${emailDest.trim()}`)
      setEmailModal(false)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Error al enviar: ${msg}`)
    } finally {
      setEnviando(false)
    }
  }

  // ─── Historial de clientes ──────────────────────────────────────────────────

  const historialClientes = useMemo((): HistorialCliente[] => {
    const seen = new Set<string>()
    return todosLosPresupuestos
      .filter((p) => {
        if (!p.cliente_razon_social) return false
        const key = p.cliente_razon_social.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((p) => ({
        razon_social:     p.cliente_razon_social!,
        cuit:             p.cliente_cuit             ?? '',
        telefono:         p.cliente_telefono         ?? '',
        direccion:        p.cliente_direccion        ?? '',
        administrador:    p.cliente_administrador    ?? '',
        administrador_cuit: p.cliente_administrador_cuit ?? '',
        email:            p.cliente_email            ?? '',
      }))
  }, [todosLosPresupuestos])

  // ─── Cálculos ────────────────────────────────────────────────────────────────

  const m2 = parseFloat(edifM2) || 0
  const k = parseFloat(coefK) || 1
  const dias = parseFloat(diasEstimados) || 0

  const { subtotalServicios, subtotalMateriales, costoManoObra, extrasMonto } = useMemo(() => {
    const ss = servicios.reduce((acc, s) => acc + s.precio_m2 * m2 * k, 0)
    const sm = materiales.reduce((acc, m) => acc + m.precio * m.cantidad, 0)
    const cmo = manoDeObra.reduce((acc, mo) => acc + mo.costo_diario * mo.cantidad_empleados * dias, 0)
    const ext =
      servicios.filter((s) => s.es_adicional).reduce((acc, s) => acc + s.precio_m2 * m2 * k, 0) +
      materiales.filter((m) => m.es_adicional).reduce((acc, m) => acc + m.precio * m.cantidad, 0)
    return { subtotalServicios: ss, subtotalMateriales: sm, costoManoObra: cmo, extrasMonto: ext }
  }, [servicios, materiales, manoDeObra, m2, k, dias])

  const totalCliente = useMemo(() => {
    const bruto = subtotalServicios + subtotalMateriales
    const descMonto = tieneDescuento
      ? descuentoTipo === 'fijo'
        ? parseFloat(descuentoValor) || 0
        : (bruto * (parseFloat(descuentoValor) || 0)) / 100
      : 0
    const neto = bruto - descMonto
    const iva = parseFloat(ivaPct) || 0
    return neto + (neto * iva) / 100
  }, [subtotalServicios, subtotalMateriales, tieneDescuento, descuentoTipo, descuentoValor, ivaPct])

  // importe_total = total real al cliente incluyendo mano de obra (para que el ratio en cobros sea correcto)
  // importe_servicios = solo la parte de servicios de lista (sin mano de obra), base de distribución entre socios
  const { importeTotal, importeServicios } = useMemo(() => {
    const recargo = planPago === '60dias' ? 0.10 : planPago === '90dias' ? 0.35 : 0
    const brutoBase = subtotalServicios + subtotalMateriales
    const totalSinMO = totalCliente * (1 + recargo)
    // Aplicar el mismo factor descuento+IVA de servicios/materiales a la mano de obra
    const factor = brutoBase > 0 ? totalCliente / brutoBase : 1
    const total = totalSinMO + costoManoObra * factor * (1 + recargo)
    const ratio = brutoBase > 0 ? subtotalServicios / brutoBase : 1
    return { importeTotal: total, importeServicios: totalSinMO * ratio }
  }, [totalCliente, planPago, subtotalServicios, subtotalMateriales, costoManoObra])

  // ─── Guardar ─────────────────────────────────────────────────────────────────

  const esAprobado = estado === 'aprobado'

  const handleGuardar = async () => {
    if (esAprobado && !fechaAprobacion) {
      toast.error('Ingresá la fecha de aprobación antes de guardar.')
      return
    }
    if (esAprobado && fechaAprobacion && presupuesto?.fecha_creacion) {
      const emision = presupuesto.fecha_creacion.substring(0, 10)
      if (fechaAprobacion < emision) {
        toast.error('La fecha de aprobación no puede ser anterior a la fecha de emisión.')
        return
      }
    }
    try {
      const result = await guardar.mutateAsync({
        id,
        estado,
        cliente_razon_social: clienteRazonSocial,
        cliente_cuit: clienteCuit,
        cliente_telefono: clienteTelefono,
        cliente_direccion: clienteDireccion,
        cliente_administrador: clienteAdministrador,
        cliente_administrador_cuit: clienteAdministradorCuit,
        cliente_email: clienteEmail,
        edif_anios: edifAnios ? parseInt(edifAnios) : null,
        edif_altura: edifAltura ? parseFloat(edifAltura) : null,
        edif_color: edifColor,
        edif_acabado: edifAcabado,
        edif_m2: edifM2 ? parseFloat(edifM2) : null,
        edif_condicion_estructural: edifCondicion,
        edif_tipologia: edifTipologia,
        edif_clase_incendio: edifClaseIncendio,
        edif_valor_patrimonial: edifValorPatrimonial,
        edif_proteccion: edifProteccion,
        coef_k: coefK ? parseFloat(coefK) : null,
        observaciones,
        descuento_tipo: tieneDescuento ? descuentoTipo : null,
        descuento_valor: tieneDescuento && descuentoValor ? parseFloat(descuentoValor) : null,
        iva_pct: parseFloat(ivaPct) || 0,
        dias_estimados_obra: diasEstimados ? parseInt(diasEstimados) : null,
        fecha_aprobacion: fechaAprobacion ? new Date(fechaAprobacion).toISOString() : null,
        plan_pago: planPago,
        importe_servicios: importeServicios > 0 ? importeServicios : null,
        importe_total:     importeTotal     > 0 ? importeTotal     : null,
        servicios,
        materiales,
        mano_obra: manoDeObra,
      })

      toast.success(esNuevo ? `Presupuesto ${result.numero} creado.` : 'Presupuesto actualizado.')

      if (esNuevo && result.id) {
        navigate(`/presupuestos/${result.id}`, { replace: true })
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Error al guardar.'
      toast.error(msg)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!esNuevo && loadingPresupuesto) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="sticky top-20 z-30 -mx-4 border-b border-ink-800 bg-ink-950/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/presupuestos')}
              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-ink-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-accent-400">
                  {presupuesto?.numero ?? (esNuevo ? 'Nuevo presupuesto' : '—')}
                </span>
                <span className={cn('text-xs font-medium', ESTADO_COLOR[estado])}>
                  · {ESTADO_LABEL[estado]}
                </span>
              </div>
              {presupuesto?.cliente_razon_social && (
                <p className="text-xs text-ink-500">{presupuesto.cliente_razon_social}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoPresupuesto)}
              className="input-base w-36 text-sm"
            >
              <option value="emitido">Emitido</option>
              <option value="aprobado">Aprobado</option>
              <option value="finalizado">Finalizado</option>
              <option value="rechazado">Rechazado</option>
            </select>
            {esAprobado && (
              <div className="flex items-center gap-1.5">
                <label className="hidden text-xs text-ink-400 whitespace-nowrap sm:block">Fecha aprobación</label>
                <input
                  type="date"
                  value={fechaAprobacion}
                  min={presupuesto?.fecha_creacion?.substring(0, 10)}
                  onChange={(e) => setFechaAprobacion(e.target.value)}
                  className={cn(
                    'input-base text-sm font-mono',
                    !fechaAprobacion && 'border-warning/60 focus:border-warning'
                  )}
                />
              </div>
            )}
            {!esNuevo && (estado === 'aprobado' || estado === 'finalizado') && (
              <button
                type="button"
                onClick={() => navigate(`/presupuestos/${id}/contrato`)}
                className="btn-secondary"
              >
                <ScrollText className="h-4 w-4" />
                Contrato
              </button>
            )}
            {!esNuevo && presupuesto && (
              <button
                type="button"
                onClick={handleDescargarPDF}
                disabled={descargandoPDF || fetchingPresupuesto || fetchingContrato}
                className={cn('btn-secondary', (fetchingPresupuesto || fetchingContrato) && 'pointer-events-none opacity-60')}
              >
                {descargandoPDF || fetchingPresupuesto || fetchingContrato ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    {esAprobado ? 'Presupuesto + Contrato' : 'PDF'}
                  </>
                )}
              </button>
            )}
            {!esNuevo && presupuesto && (
              <button
                type="button"
                onClick={abrirEmailModal}
                disabled={enviando}
                className="btn-secondary"
              >
                <Mail className="h-4 w-4" />
                Enviar
              </button>
            )}
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

      {/* Secciones */}
      <SeccionCliente
        razonSocial={clienteRazonSocial}
        cuit={clienteCuit}
        telefono={clienteTelefono}
        direccion={clienteDireccion}
        administrador={clienteAdministrador}
        administradorCuit={clienteAdministradorCuit}
        email={clienteEmail}
        historial={historialClientes}
        onChange={handleField}
      />

      <SeccionEdificacion
        anios={edifAnios}
        altura={edifAltura}
        color={edifColor}
        acabado={edifAcabado}
        m2={edifM2}
        condicionEstructural={edifCondicion}
        tipologia={edifTipologia}
        valorPatrimonial={edifValorPatrimonial}
        proteccion={edifProteccion}
        coefK={coefK}
        onChange={handleField}
      />

      {/* Observaciones */}
      <section className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Observaciones
        </h2>
        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          maxLength={1500}
          rows={6}
          className="input-base resize-none"
          placeholder="Notas sobre el estado del edificio, condiciones especiales de acceso, requerimientos del cliente…"
        />
        <p className="mt-1 text-right text-xs text-ink-500">{observaciones.length}/1500</p>
      </section>

      <SeccionServicios
        items={servicios}
        catalogo={catalogoServicios}
        m2={m2}
        coefK={k}
        esAprobado={esAprobado}
        onChange={setServicios}
      />

      <SeccionMateriales
        items={materiales}
        catalogo={catalogoMateriales}
        esAprobado={esAprobado}
        onChange={setMateriales}
      />

      <SeccionDescuento
        tieneDescuento={tieneDescuento}
        tipo={descuentoTipo}
        valor={descuentoValor}
        onChange={handleField}
      />

      <SeccionManoDeObra
        items={manoDeObra}
        diasEstimados={diasEstimados}
        catalogo={catalogoManoDeObra}
        esAprobado={esAprobado}
        onChange={setManoDeObra}
        onDiasChange={setDiasEstimados}
      />

      <PanelTotales
        subtotalServicios={subtotalServicios}
        subtotalMateriales={subtotalMateriales}
        extrasMonto={extrasMonto}
        tieneDescuento={tieneDescuento}
        descuentoTipo={descuentoTipo}
        descuentoValor={parseFloat(descuentoValor) || 0}
        ivaPct={parseFloat(ivaPct) || 0}
        costoManoObra={costoManoObra}
        onIvaChange={setIvaPct}
      />

      <SeccionFinanciamiento
        total={totalCliente}
        planSeleccionado={planPago}
        onChange={setPlanPago}
      />

      {/* Cobros: solo visible en presupuestos aprobados o finalizados */}
      {id && (estado === 'aprobado' || estado === 'finalizado') && (
        <SeccionCobros
          presupuestoId={id}
          plan={planPago}
          importeTotal={importeTotal > 0 ? importeTotal : null}
          importeServicios={importeServicios > 0 ? importeServicios : null}
        />
      )}

      <SeccionFotos
        presupuestoId={id}
        fotos={presupuesto?.fotos ?? []}
      />

      <Modal
        open={emailModal}
        onClose={() => !enviando && setEmailModal(false)}
        title="Enviar presupuesto por email"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-ink-300">Destinatario</label>
            <input
              ref={emailInputRef}
              type="email"
              value={emailDest}
              onChange={(e) => setEmailDest(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') enviarPorEmail() }}
              placeholder="email@cliente.com"
              className="input-base w-full"
              disabled={enviando}
            />
          </div>
          <p className="text-xs text-ink-500">
            Se enviará el PDF del presupuesto{esAprobado ? ' + contrato' : ''} adjunto.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEmailModal(false)}
              disabled={enviando}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={enviarPorEmail}
              disabled={enviando || !emailDest.trim()}
              className="btn-primary"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {enviando ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
