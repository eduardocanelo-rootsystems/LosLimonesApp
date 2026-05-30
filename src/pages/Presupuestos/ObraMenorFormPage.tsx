import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, FileDown, Loader2, Save, ScrollText } from 'lucide-react'
import { toast } from 'sonner'
import { reloadOnStaleChunk } from '@/lib/chunkReload'
import { cn, formatCurrency } from '@/lib/utils'
import { useMontoMinimoObraMenor } from '@/hooks/useConfiguracion'
import { useLogoCliente } from '@/hooks/useLogoCliente'
import { useServicios } from '@/pages/Servicios/useServicios'
import { useMateriales } from '@/pages/Materiales/useMateriales'
import { useManoDeObra } from '@/pages/ManoDeObra/useManoDeObra'
import type {
  EstadoPresupuesto,
  FormManoObraItem,
  FormMaterialItem,
  FormPresupuestoItem,
} from '@/types/database'
import type { PlanFinanciamiento } from './components/SeccionFinanciamiento'
import { useGuardarPresupuesto, usePresupuesto, usePresupuestos } from './usePresupuestos'
import { SeccionCliente } from './components/SeccionCliente'
import type { HistorialCliente } from './components/SeccionCliente'
import { SeccionItems } from './components/SeccionItems'
import { SeccionMateriales } from './components/SeccionMateriales'
import { SeccionDescuento } from './components/SeccionDescuento'
import { SeccionManoDeObra } from './components/SeccionManoDeObra'
import { PanelTotales } from './components/PanelTotales'
import { SeccionFinanciamiento } from './components/SeccionFinanciamiento'
import { SeccionCobros } from './components/SeccionCobros'

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

export default function ObraMenorFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const esNuevo = !id

  const { data: presupuesto, isLoading: loadingPresupuesto } = usePresupuesto(id)
  const { data: todosLosPresupuestos = [] } = usePresupuestos()
  const { data: montoMinimo } = useMontoMinimoObraMenor()
  const logoUrl = useLogoCliente()
  const { data: catalogoServicios = [] } = useServicios()
  const { data: catalogoMateriales = [] } = useMateriales()
  const { data: catalogoManoDeObra = [] } = useManoDeObra()
  const guardar = useGuardarPresupuesto()

  // ─── Estado ──────────────────────────────────────────────────────────────────

  const [estado, setEstado]                     = useState<EstadoPresupuesto>('emitido')
  const [clienteRazonSocial, setClienteRazonSocial] = useState('')
  const [clienteCuit, setClienteCuit]           = useState('')
  const [clienteTelefono, setClienteTelefono]   = useState('')
  const [clienteDireccion, setClienteDireccion] = useState('')
  const [clienteAdministrador, setClienteAdministrador] = useState('')
  const [clienteAdministradorCuit, setClienteAdministradorCuit] = useState('')
  const [clienteEmail, setClienteEmail]         = useState('')
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('')
  const [tieneGarantia, setTieneGarantia]       = useState<boolean | null>(null)
  const [garantiaVencimiento, setGarantiaVencimiento] = useState('')
  const [observaciones, setObservaciones]       = useState('')
  const [items, setItems]                       = useState<FormPresupuestoItem[]>([])
  const [materiales, setMateriales]             = useState<FormMaterialItem[]>([])
  const [manoDeObra, setManoDeObra]             = useState<FormManoObraItem[]>([])
  const [tieneDescuento, setTieneDescuento]     = useState(false)
  const [descuentoTipo, setDescuentoTipo]       = useState<'fijo' | 'porcentaje'>('porcentaje')
  const [descuentoValor, setDescuentoValor]     = useState('')
  const [diasEstimados, setDiasEstimados]       = useState('')
  const [ivaPct, setIvaPct]                     = useState('0')
  const [fechaAprobacion, setFechaAprobacion]   = useState('')
  const [planPago, setPlanPago]                 = useState<PlanFinanciamiento>(null)

  // ─── Cargar ───────────────────────────────────────────────────────────────────

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
    setDescripcionTrabajo(presupuesto.diagnostico_tecnico ?? '')
    setTieneGarantia(presupuesto.tiene_garantia ?? null)
    setGarantiaVencimiento(presupuesto.garantia_vencimiento ?? '')
    setObservaciones(presupuesto.observaciones ?? '')
    setDescuentoTipo((presupuesto.descuento_tipo ?? 'porcentaje') as 'fijo' | 'porcentaje')
    setDescuentoValor(presupuesto.descuento_valor?.toString() ?? '')
    setTieneDescuento(!!presupuesto.descuento_tipo)
    setIvaPct(presupuesto.iva_pct?.toString() ?? '0')
    setDiasEstimados(presupuesto.dias_estimados_obra?.toString() ?? '')
    setFechaAprobacion(presupuesto.fecha_aprobacion?.substring(0, 10) ?? '')
    setPlanPago((presupuesto.plan_pago as PlanFinanciamiento) ?? null)
    setItems(
      presupuesto.items.map((it) => ({
        _key: it.id,
        servicio_id: it.servicio_id ?? '',
        nombre: it.nombre_snapshot,
        precio_unitario: it.precio_unitario,
        cantidad: it.cantidad,
        es_adicional: it.es_adicional,
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
        dias: mo.dias ?? null,
        es_adicional: mo.es_adicional,
      }))
    )
  }, [presupuesto])

  // ─── handleField para SeccionCliente ─────────────────────────────────────────

  const handleField = (field: string, value: unknown) => {
    switch (field) {
      case 'cliente_razon_social': setClienteRazonSocial(value as string); break
      case 'cliente_cuit': setClienteCuit(value as string); break
      case 'cliente_telefono': setClienteTelefono(value as string); break
      case 'cliente_direccion': setClienteDireccion(value as string); break
      case 'cliente_administrador': setClienteAdministrador(value as string); break
      case 'cliente_administrador_cuit': setClienteAdministradorCuit(value as string); break
      case 'cliente_email': setClienteEmail(value as string); break
      case 'tiene_descuento': setTieneDescuento(value as boolean); break
      case 'descuento_tipo': setDescuentoTipo(value as 'fijo' | 'porcentaje'); break
      case 'descuento_valor': setDescuentoValor(value as string); break
    }
  }

  // ─── Cálculos ────────────────────────────────────────────────────────────────

  const dias = parseFloat(diasEstimados) || 0

  const { subtotalItems, subtotalMateriales, costoManoObra } = useMemo(() => {
    const si = items.reduce((acc, i) => acc + i.precio_unitario * i.cantidad, 0)
    const sm = materiales.reduce((acc, m) => acc + m.precio * m.cantidad, 0)
    const cmo = manoDeObra.reduce((acc, mo) => acc + mo.costo_diario * mo.cantidad_empleados * (mo.dias ?? dias), 0)
    return { subtotalItems: si, subtotalMateriales: sm, costoManoObra: cmo }
  }, [items, materiales, manoDeObra, dias])

  const totalCliente = useMemo(() => {
    const bruto = subtotalItems + subtotalMateriales
    const descMonto = tieneDescuento
      ? descuentoTipo === 'fijo'
        ? parseFloat(descuentoValor) || 0
        : (bruto * (parseFloat(descuentoValor) || 0)) / 100
      : 0
    const neto = bruto - descMonto
    const iva = parseFloat(ivaPct) || 0
    return neto + (neto * iva) / 100
  }, [subtotalItems, subtotalMateriales, tieneDescuento, descuentoTipo, descuentoValor, ivaPct])

  const { importeTotal, importeServicios } = useMemo(() => {
    const recargo = planPago === '60dias' ? 0.10 : planPago === '90dias' ? 0.20 : 0
    const factorFin = 1 + recargo / 2
    const totalSinMO = totalCliente * factorFin
    const brutoBase = subtotalItems + subtotalMateriales
    const factor = brutoBase > 0 ? totalCliente / brutoBase : 1
    const total = totalSinMO + costoManoObra * factor * factorFin
    // Aplicar monto mínimo
    const totalConMinimo = montoMinimo != null ? Math.max(total, montoMinimo) : total
    const ratio = brutoBase > 0 ? subtotalItems / brutoBase : 1
    return { importeTotal: totalConMinimo, importeServicios: totalSinMO * ratio }
  }, [totalCliente, planPago, subtotalItems, subtotalMateriales, costoManoObra, montoMinimo])

  // ─── PDF ─────────────────────────────────────────────────────────────────────

  const [descargandoPDF, setDescargandoPDF] = useState(false)
  const esAprobado = estado === 'aprobado'

  const handleDescargarPDF = async () => {
    if (!presupuesto) return
    setDescargandoPDF(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { ObraMenorPDFDocument } = await import('./components/ObraMenorPDF')
      const blob = await pdf(
        <ObraMenorPDFDocument presupuesto={presupuesto} logoUrl={logoUrl} montoMinimo={montoMinimo ?? null} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${presupuesto.numero ?? 'presupuesto'}-menor.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      if (!reloadOnStaleChunk(err)) {
        console.error('[PDF]', err)
        toast.error(`Error al generar el PDF: ${err instanceof Error ? err.message : String(err)}`)
      }
    } finally {
      setDescargandoPDF(false)
    }
  }

  // ─── Historial clientes ───────────────────────────────────────────────────────

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
        razon_social:       p.cliente_razon_social!,
        cuit:               p.cliente_cuit             ?? '',
        telefono:           p.cliente_telefono         ?? '',
        direccion:          p.cliente_direccion        ?? '',
        administrador:      p.cliente_administrador    ?? '',
        administrador_cuit: p.cliente_administrador_cuit ?? '',
        email:              p.cliente_email            ?? '',
      }))
  }, [todosLosPresupuestos])

  // ─── Guardar ─────────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    if (tieneGarantia === null) {
      toast.error('Debés indicar si el presupuesto tiene garantía o no.')
      return
    }
    if (tieneGarantia && !garantiaVencimiento) {
      toast.error('Ingresá la fecha de vencimiento de la garantía.')
      return
    }
    if (esAprobado && !fechaAprobacion) {
      toast.error('Ingresá la fecha de aprobación antes de guardar.')
      return
    }
    try {
      const result = await guardar.mutateAsync({
        id,
        tipo: 'obra_menor',
        estado,
        cliente_razon_social: clienteRazonSocial,
        cliente_cuit: clienteCuit,
        cliente_telefono: clienteTelefono,
        cliente_direccion: clienteDireccion,
        cliente_administrador: clienteAdministrador,
        cliente_administrador_cuit: clienteAdministradorCuit,
        cliente_email: clienteEmail,
        edif_anios: null, edif_altura: null, edif_color: '', edif_acabado: [],
        edif_m2: null, edif_condicion_estructural: '', edif_tipologia: '',
        edif_clase_incendio: '', edif_valor_patrimonial: false, edif_proteccion: '', coef_k: null,
        observaciones,
        diagnostico_tecnico: descripcionTrabajo || null,
        alcance_obra: null, exenciones: null,
        tiene_garantia: tieneGarantia,
        garantia_vencimiento: tieneGarantia && garantiaVencimiento ? garantiaVencimiento : null,
        descuento_tipo: tieneDescuento ? descuentoTipo : null,
        descuento_valor: tieneDescuento && descuentoValor ? parseFloat(descuentoValor) : null,
        iva_pct: parseFloat(ivaPct) || 0,
        dias_estimados_obra: diasEstimados ? parseInt(diasEstimados) : null,
        fecha_aprobacion: fechaAprobacion ? new Date(fechaAprobacion).toISOString() : null,
        plan_pago: planPago,
        importe_servicios: importeServicios > 0 ? importeServicios : null,
        importe_total:     importeTotal     > 0 ? importeTotal     : null,
        servicios: [],
        materiales,
        mano_obra: manoDeObra,
        items,
      })
      toast.success(esNuevo ? `Presupuesto ${result.numero} creado.` : 'Presupuesto actualizado.')
      if (esNuevo && result.id) navigate(`/presupuestos/${result.id}`, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'Error al guardar.'
      toast.error(msg)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

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
                <span className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-400">
                  Obra Menor
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
              aria-label="Estado del presupuesto"
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
                  className={cn('input-base text-sm font-mono', !fechaAprobacion && 'border-warning/60')}
                />
              </div>
            )}
            {!esNuevo && (estado === 'aprobado' || estado === 'finalizado') && (
              <>
                <button type="button" onClick={() => navigate(`/presupuestos/${id}/contrato`)} className="btn-secondary">
                  <ScrollText className="h-4 w-4" />Contrato
                </button>
                <button type="button" onClick={() => navigate(`/presupuestos/${id}/acta`)} className="btn-secondary">
                  <ClipboardCheck className="h-4 w-4" />Acta
                </button>
              </>
            )}
            {!esNuevo && presupuesto && (
              <button type="button" onClick={handleDescargarPDF} disabled={descargandoPDF} className="btn-secondary">
                {descargandoPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                PDF
              </button>
            )}
            <button type="button" onClick={handleGuardar} disabled={guardar.isPending} className="btn-primary">
              {guardar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </button>
          </div>
        </div>
      </div>

      <SeccionCliente
        razonSocial={clienteRazonSocial} cuit={clienteCuit} telefono={clienteTelefono}
        direccion={clienteDireccion} administrador={clienteAdministrador}
        administradorCuit={clienteAdministradorCuit} email={clienteEmail}
        historial={historialClientes} onChange={handleField}
      />

      {/* Descripción del trabajo */}
      <section className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Descripción del trabajo
        </h2>
        <textarea
          value={descripcionTrabajo}
          onChange={(e) => setDescripcionTrabajo(e.target.value)}
          maxLength={3000}
          rows={5}
          className="input-base resize-y"
          placeholder="Descripción de los trabajos a realizar…"
        />
        <p className="mt-1 text-right text-xs text-ink-500">{descripcionTrabajo.length}/3000</p>
      </section>

      {/* Garantía */}
      <section className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">
          Garantía
          {tieneGarantia === null && <span className="ml-2 text-xs font-normal text-danger">* obligatorio</span>}
        </h2>
        <div className="flex gap-3 mb-4">
          {(['Sin garantía', 'Con garantía'] as const).map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => { setTieneGarantia(idx === 1); if (idx === 0) setGarantiaVencimiento('') }}
              className={cn(
                'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                (idx === 0 ? tieneGarantia === false : tieneGarantia === true)
                  ? 'border-accent-500 bg-accent-500/10 text-accent-300'
                  : 'border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-200'
              )}
            >{label}</button>
          ))}
        </div>
        {tieneGarantia === true && (
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-400 whitespace-nowrap">Vencimiento:</label>
            <input
              type="date" value={garantiaVencimiento}
              onChange={(e) => setGarantiaVencimiento(e.target.value)}
              className={cn('input-base font-mono', !garantiaVencimiento && 'border-danger/60')}
            />
          </div>
        )}
      </section>

      <SeccionItems
        items={items}
        catalogo={catalogoServicios}
        esAprobado={esAprobado}
        onChange={setItems}
      />

      <SeccionMateriales items={materiales} catalogo={catalogoMateriales} esAprobado={esAprobado} onChange={setMateriales} />

      <SeccionDescuento tieneDescuento={tieneDescuento} tipo={descuentoTipo} valor={descuentoValor} onChange={handleField} />

      <SeccionManoDeObra
        items={manoDeObra} diasEstimados={diasEstimados} catalogo={catalogoManoDeObra}
        esAprobado={esAprobado} onChange={setManoDeObra} onDiasChange={setDiasEstimados}
      />

      <PanelTotales
        subtotalServicios={subtotalItems}
        subtotalMateriales={subtotalMateriales}
        extrasMonto={0}
        tieneDescuento={tieneDescuento}
        descuentoTipo={descuentoTipo}
        descuentoValor={parseFloat(descuentoValor) || 0}
        ivaPct={parseFloat(ivaPct) || 0}
        costoManoObra={costoManoObra}
        onIvaChange={setIvaPct}
      />

      {montoMinimo != null && totalCliente + costoManoObra < montoMinimo && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          El total calculado ({formatCurrency(totalCliente + costoManoObra)}) es menor al monto mínimo.
          Se facturará {formatCurrency(montoMinimo)}.
        </div>
      )}

      <SeccionFinanciamiento total={totalCliente} planSeleccionado={planPago} onChange={setPlanPago} />

      {id && (estado === 'aprobado' || estado === 'finalizado') && (
        <SeccionCobros
          presupuestoId={id} plan={planPago}
          importeTotal={importeTotal > 0 ? importeTotal : null}
          importeServicios={importeServicios > 0 ? importeServicios : null}
        />
      )}

      {/* Observaciones */}
      <section className="card p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-400">Observaciones</h2>
        <textarea
          value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
          maxLength={1500} rows={4} className="input-base resize-y"
          placeholder="Notas adicionales…"
        />
        <p className="mt-1 text-right text-xs text-ink-500">{observaciones.length}/1500</p>
      </section>
    </div>
  )
}
