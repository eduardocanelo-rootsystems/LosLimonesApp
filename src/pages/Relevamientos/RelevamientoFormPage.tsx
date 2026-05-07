import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { SeccionCliente } from '@/pages/Presupuestos/components/SeccionCliente'
import { SeccionEdificacion } from '@/pages/Presupuestos/components/SeccionEdificacion'
import { SeccionFotos } from '@/pages/Presupuestos/components/SeccionFotos'
import { useGuardarRelevamiento, useRelevamiento } from './useRelevamientos'

export default function RelevamientoFormPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const esNuevo    = !id
  const guardar    = useGuardarRelevamiento()

  const { data: relevamiento, isLoading } = useRelevamiento(id)

  // ─── Estado ────────────────────────────────────────────────────────────────

  const [clienteRazonSocial,      setClienteRazonSocial]      = useState('')
  const [clienteCuit,             setClienteCuit]             = useState('')
  const [clienteTelefono,         setClienteTelefono]         = useState('')
  const [clienteDireccion,        setClienteDireccion]        = useState('')
  const [clienteAdministrador,    setClienteAdministrador]    = useState('')
  const [clienteAdministradorCuit,setClienteAdministradorCuit]= useState('')
  const [clienteEmail,            setClienteEmail]            = useState('')

  const [edifAnios,     setEdifAnios]     = useState('')
  const [edifAltura,    setEdifAltura]    = useState('')
  const [edifColor,     setEdifColor]     = useState('')
  const [edifAcabado,   setEdifAcabado]   = useState<string[]>([])
  const [edifM2,        setEdifM2]        = useState('')
  const [edifCondicion, setEdifCondicion] = useState('')
  const [edifTipologia, setEdifTipologia] = useState('')
  const [edifPatrimonial, setEdifPatrimonial] = useState(false)
  const [edifProteccion,  setEdifProteccion]  = useState('')
  const [coefK,         setCoefK]         = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [guardado, setGuardado] = useState(false)
  const [presupuestoId, setPresupuestoId] = useState<string | undefined>(id)

  // ─── Cargar al editar ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!relevamiento) return
    setClienteRazonSocial(relevamiento.cliente_razon_social ?? '')
    setClienteCuit(relevamiento.cliente_cuit ?? '')
    setClienteTelefono(relevamiento.cliente_telefono ?? '')
    setClienteDireccion(relevamiento.cliente_direccion ?? '')
    setClienteAdministrador(relevamiento.cliente_administrador ?? '')
    setClienteAdministradorCuit(relevamiento.cliente_administrador_cuit ?? '')
    setClienteEmail(relevamiento.cliente_email ?? '')
    setEdifAnios(relevamiento.edif_anios?.toString() ?? '')
    setEdifAltura(relevamiento.edif_altura?.toString() ?? '')
    setEdifColor(relevamiento.edif_color ?? '')
    setEdifAcabado((relevamiento.edif_acabado as string[]) ?? [])
    setEdifM2(relevamiento.edif_m2?.toString() ?? '')
    setEdifCondicion(relevamiento.edif_condicion_estructural ?? '')
    setEdifTipologia(relevamiento.edif_tipologia ?? '')
    setEdifPatrimonial(relevamiento.edif_valor_patrimonial ?? false)
    setEdifProteccion(relevamiento.edif_proteccion ?? '')
    setCoefK(relevamiento.coef_k?.toString() ?? '')
    setObservaciones(relevamiento.observaciones ?? '')
  }, [relevamiento])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleField = (field: string, value: unknown) => {
    switch (field) {
      case 'cliente_razon_social':       setClienteRazonSocial(value as string); break
      case 'cliente_cuit':               setClienteCuit(value as string); break
      case 'cliente_telefono':           setClienteTelefono(value as string); break
      case 'cliente_direccion':          setClienteDireccion(value as string); break
      case 'cliente_administrador':      setClienteAdministrador(value as string); break
      case 'cliente_administrador_cuit': setClienteAdministradorCuit(value as string); break
      case 'cliente_email':              setClienteEmail(value as string); break
      case 'edif_anios':                 setEdifAnios(value as string); break
      case 'edif_altura':                setEdifAltura(value as string); break
      case 'edif_color':                 setEdifColor(value as string); break
      case 'edif_acabado':               setEdifAcabado(value as string[]); break
      case 'edif_m2':                    setEdifM2(value as string); break
      case 'edif_condicion_estructural': setEdifCondicion(value as string); break
      case 'edif_tipologia':             setEdifTipologia(value as string); break
      case 'edif_valor_patrimonial':     setEdifPatrimonial(value as boolean); break
      case 'edif_proteccion':            setEdifProteccion(value as string); break
      case 'coef_k':                     setCoefK(value as string); break
    }
  }

  // ─── Guardar ─────────────────────────────────────────────────────────────────

  const handleGuardar = async () => {
    try {
      const resultado = await guardar.mutateAsync({
        id: presupuestoId,
        cliente_razon_social:       clienteRazonSocial,
        cliente_cuit:               clienteCuit,
        cliente_telefono:           clienteTelefono,
        cliente_direccion:          clienteDireccion,
        cliente_administrador:      clienteAdministrador,
        cliente_administrador_cuit: clienteAdministradorCuit,
        cliente_email:              clienteEmail,
        edif_anios:                 edifAnios ? parseInt(edifAnios) : null,
        edif_altura:                edifAltura ? parseFloat(edifAltura) : null,
        edif_color:                 edifColor,
        edif_acabado:               edifAcabado,
        edif_m2:                    edifM2 ? parseFloat(edifM2) : null,
        edif_condicion_estructural: edifCondicion,
        edif_tipologia:             edifTipologia,
        edif_valor_patrimonial:     edifPatrimonial,
        edif_proteccion:            edifProteccion,
        edif_clase_incendio:        '',
        coef_k:                     coefK ? parseFloat(coefK) : null,
        observaciones:              observaciones,
      })
      setPresupuestoId(resultado.id)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
      if (esNuevo) {
        navigate(`/relevamientos/${resultado.id}`, { replace: true })
      }
    } catch (err) {
      const msg = err instanceof Error && err.message === 'timeout'
        ? 'Tiempo de espera agotado. Verificá tu conexión e intentá de nuevo.'
        : 'Error al guardar el relevamiento.'
      toast.error(msg)
    }
  }

  if (!esNuevo && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-4">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/relevamientos')}
          className="rounded-md p-2 text-ink-400 hover:bg-ink-800 hover:text-ink-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-ink-100">
            {esNuevo ? 'Nuevo relevamiento' : 'Editar relevamiento'}
          </h1>
          <p className="text-xs text-ink-500 mt-0.5">
            Completá los datos desde la obra
          </p>
        </div>
      </div>

      {/* Secciones */}
      <div className="flex flex-col gap-6">

        <SeccionCliente
          razonSocial={clienteRazonSocial}
          cuit={clienteCuit}
          telefono={clienteTelefono}
          direccion={clienteDireccion}
          administrador={clienteAdministrador}
          administradorCuit={clienteAdministradorCuit}
          email={clienteEmail}
          historial={[]}
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
          valorPatrimonial={edifPatrimonial}
          proteccion={edifProteccion}
          coefK={coefK}
          onChange={handleField}
        />

        {/* Observaciones */}
        <div className="card p-4">
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-ink-400">
            Observaciones
          </h3>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Estado de la fachada, accesos, condiciones especiales, notas para el presupuestador…"
            rows={5}
            className="input-base w-full resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Fotos */}
        {presupuestoId && (
          <SeccionFotos
            presupuestoId={presupuestoId}
            fotos={(relevamiento as any)?.fotos ?? []}
          />
        )}
        {esNuevo && !presupuestoId && (
          <div className="card p-4 text-center text-sm text-ink-500">
            Guardá el relevamiento para poder agregar fotos.
          </div>
        )}
      </div>

      {/* Botón guardar fijo en el fondo — cómodo en móvil */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-ink-800 bg-ink-950/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardar.isPending}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {guardar.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : guardado ? (
            <><CheckCircle2 className="h-5 w-5 text-green-400" /> Guardado</>
          ) : (
            <><Save className="h-5 w-5" /> Guardar relevamiento</>
          )}
        </button>
      </div>
    </div>
  )
}
