import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileDown, Loader2, Save, ScrollText } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { cn } from '@/lib/utils'
import { PresupuestoPDFDocument } from './components/PresupuestoPDF'
import { PresupuestoContratoPDFDocument } from './components/PresupuestoContratoPDF'
import { useContrato } from '@/pages/Contratos/useContrato'
import { contratoToFormValues } from '@/pages/Contratos/components/ContratoPDF'
import { useFirmaContratista } from '@/hooks/useConfiguracion'
import { useServicios } from '@/pages/Servicios/useServicios'
import { useMateriales } from '@/pages/Materiales/useMateriales'
import { useManoDeObra } from '@/pages/ManoDeObra/useManoDeObra'
import type {
  EstadoPresupuesto,
  FormManoObraItem,
  FormMaterialItem,
  FormServicioItem,
} from '@/types/database'
import { useGuardarPresupuesto, usePresupuesto } from './usePresupuestos'
import { SeccionCliente } from './components/SeccionCliente'
import { SeccionEdificacion } from './components/SeccionEdificacion'
import { SeccionServicios } from './components/SeccionServicios'
import { SeccionMateriales } from './components/SeccionMateriales'
import { SeccionDescuento } from './components/SeccionDescuento'
import { SeccionManoDeObra } from './components/SeccionManoDeObra'
import { PanelTotales } from './components/PanelTotales'

const ESTADO_LABEL: Record<EstadoPresupuesto, string> = {
  emitido: 'Emitido',
  aprobado: 'Aprobado',
  finalizado: 'Finalizado',
}

const ESTADO_COLOR: Record<EstadoPresupuesto, string> = {
  emitido: 'text-warning',
  aprobado: 'text-success',
  finalizado: 'text-ink-400',
}

export default function PresupuestoFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const esNuevo = !id

  const { data: presupuesto, isLoading: loadingPresupuesto } = usePresupuesto(id)
  const { data: contrato } = useContrato(id)
  const { data: firmaContratista } = useFirmaContratista()
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
      <div className="sticky top-16 z-30 -mx-6 border-b border-ink-800 bg-ink-950/90 px-6 py-3 backdrop-blur-md">
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
              className="input-base text-sm"
            >
              <option value="emitido">Emitido</option>
              <option value="aprobado">Aprobado</option>
              <option value="finalizado">Finalizado</option>
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
              esAprobado ? (
                <PDFDownloadLink
                  document={
                    <PresupuestoContratoPDFDocument
                      presupuesto={presupuesto}
                      form={contratoToFormValues(contrato ?? null, presupuesto)}
                      firmaContratista={firmaContratista ?? contrato?.firma_contratista_base64 ?? null}
                      firmaCliente={contrato?.firma_cliente_base64 ?? null}
                    />
                  }
                  fileName={`${presupuesto.numero ?? 'presupuesto'}-contrato.pdf`}
                  className="btn-secondary"
                >
                  {({ loading }) =>
                    loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        Presupuesto + Contrato
                      </>
                    )
                  }
                </PDFDownloadLink>
              ) : (
                <PDFDownloadLink
                  document={<PresupuestoPDFDocument presupuesto={presupuesto} />}
                  fileName={`${presupuesto.numero ?? 'presupuesto'}.pdf`}
                  className="btn-secondary"
                >
                  {({ loading }) =>
                    loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <FileDown className="h-4 w-4" />
                        PDF
                      </>
                    )
                  }
                </PDFDownloadLink>
              )
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
        claseIncendio={edifClaseIncendio}
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
          maxLength={350}
          rows={4}
          className="input-base resize-none"
          placeholder="Notas sobre el estado del edificio, condiciones especiales de acceso, requerimientos del cliente…"
        />
        <p className="mt-1 text-right text-xs text-ink-500">{observaciones.length}/350</p>
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
    </div>
  )
}
