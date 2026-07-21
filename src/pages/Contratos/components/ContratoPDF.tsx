import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PresupuestoCompleto } from '@/types/database'
import {
  type PlanPago,
  type ContratoFormValues,
  PLANES_PAGO,
  contratoToFormValues,
  calcTotalPresupuesto,
  calcFinanciamiento,
  addWorkingDays,
} from './contratoUtils'

export type { PlanPago, ContratoFormValues }
export { PLANES_PAGO, contratoToFormValues, calcTotalPresupuesto, calcFinanciamiento, addWorkingDays }

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function parseLocalDate(iso: string): Date {
  return new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
}

function fmtLong(iso: string | null | undefined): string {
  if (!iso) return '_____ de __________ de 20__'
  const d = parseLocalDate(iso)
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`
}

function fmtShort(iso: string | null | undefined): string {
  if (!iso) return '___/___/______'
  const d = parseLocalDate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function fmt(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(v)
}

function fmtOrBlank(raw: string, isCurrency = false): string {
  const n = parseFloat(raw)
  if (!raw || isNaN(n)) return '___________'
  return isCurrency ? fmt(n) : String(n)
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  black: '#111111',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  white: '#FFFFFF',
  accent: '#B7FF00',
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.black,
    paddingTop: 52,
    paddingBottom: 64,
    paddingHorizontal: 62,
    backgroundColor: C.white,
  },

  contratoHeader: {
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  contratoHeaderLabel: { fontSize: 7, color: C.gray500, letterSpacing: 1.5, textTransform: 'uppercase' },
  logoImg: { height: 26, width: 78, objectFit: 'contain' },

  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8.5,
    color: C.gray500,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  lugar: {
    fontSize: 10,
    textAlign: 'right',
    color: C.gray700,
    marginBottom: 14,
    marginTop: 14,
  },

  preamble: {
    fontSize: 10,
    lineHeight: 1.55,
    textAlign: 'justify',
    marginBottom: 14,
  },

  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
    marginVertical: 10,
  },

  clausula: { marginBottom: 8 },
  clausulaTitulo: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
    color: C.black,
  },
  clausulaTexto: {
    fontSize: 10,
    lineHeight: 1.55,
    textAlign: 'justify',
    color: C.black,
  },

  lista: { marginTop: 3 },
  listaItem: { flexDirection: 'row', paddingLeft: 8, marginTop: 2 },
  listaBullet: { width: 18, fontSize: 10, color: C.black },
  listaTexto: { flex: 1, fontSize: 10, lineHeight: 1.55, textAlign: 'justify' },

  cierre: {
    fontSize: 10,
    lineHeight: 1.55,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },

  firmaSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  firmaCol: { width: '38%', alignItems: 'center' },
  firmaLinea: {
    borderTopWidth: 0.5,
    borderTopColor: C.black,
    width: '100%',
    marginBottom: 5,
  },
  firmaTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  firmaSubtitulo: { fontSize: 8.5, color: C.gray500, textAlign: 'center' },

  firmaUrlBox: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#EFF6FF',
    borderWidth: 0.5,
    borderColor: '#B7FF00',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  firmaUrlLabel: { fontSize: 8.5, color: '#374151' },
  firmaUrlLink:  { fontSize: 8.5, color: '#B7FF00', textDecoration: 'underline' },

  footer: {
    position: 'absolute',
    bottom: 22,
    left: 62,
    right: 62,
    borderTopWidth: 0.5,
    borderTopColor: C.gray300,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.gray500 },
  pageNumber: { fontSize: 7, color: C.gray500 },

  b: { fontFamily: 'Helvetica-Bold' },
})

// ─── Página del contrato ──────────────────────────────────────────────────────

export function ContratoPDFPage({
  presupuesto,
  form,
  firmaContratista,
  firmaCliente,
  firmaUrl,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  form: ContratoFormValues
  firmaContratista?: string | null
  firmaCliente?: string | null
  firmaUrl?: string
  logoUrl?: string | null
}) {
  const b = s.b
  const baseTotal = calcTotalPresupuesto(presupuesto)
  const plan = (form.plan_pago || 'contado') as PlanPago
  const { totalFinal, anticipo, montoCuota } = calcFinanciamiento(baseTotal, plan)

  const comitente  = form.nombre_comitente     || presupuesto.cliente_razon_social    || '___________'
  const dirObra    = form.direccion_obra        || presupuesto.cliente_direccion       || '___________'
  const admin      = form.nombre_administrador  || presupuesto.cliente_administrador   || '___________'
  const dni        = form.administrador_dni     || '___________'
  const diasEstimados = presupuesto.dias_estimados_obra ?? 0
  const esFinanciado  = plan === '60dias' || plan === '90dias'
  const tasaInteres = form.tasa_interes ? `${form.tasa_interes}%` : '_____%'

  // Campos del presupuesto
  const alcanceObra       = presupuesto.alcance_obra       || ''
  const exenciones        = presupuesto.exenciones         || ''
  const diagnosticoTec    = presupuesto.diagnostico_tecnico || ''
  const tieneGarantia     = presupuesto.tiene_garantia
  const garantiaVenc      = presupuesto.garantia_vencimiento

  return (
    <Page size="A4" style={s.page}>

      {/* Encabezado */}
      <View style={s.contratoHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {logoUrl && <Image src={logoUrl} style={s.logoImg} />}
          <Text style={s.contratoHeaderLabel}>Limones - Rope Access · Contrato de Obra</Text>
        </View>
        <Text style={s.contratoHeaderLabel}>Ref. Presupuesto {presupuesto.numero ?? '—'}</Text>
      </View>

      {/* Título */}
      <Text style={[s.title, { marginTop: 12 }]}>Contrato de Obra</Text>
      <Text style={s.subtitle}>
        Restauración, Reparación e Impermeabilización de superficies en altura{'\n'}
        mediante sistemas de acceso por cuerdas
      </Text>
      <Text style={[s.subtitle, { color: C.gray700 }]}>{dirObra}</Text>

      {/* Lugar y fecha */}
      <Text style={s.lugar}>
        Ciudad Autónoma de Buenos Aires, {fmtLong(form.fecha_firma)}
      </Text>

      {/* Entre partes */}
      <Text style={s.preamble}>
        {'Entre el Sr. '}
        <Text style={b}>Luis Alfonzo</Text>
        {', CUIT N.º '}
        <Text style={b}>27-96416229-3</Text>
        {', con domicilio en Albarracín 2050, PH 3, Ciudad Autónoma de Buenos Aires, en adelante denominado '}
        <Text style={b}>"EL CONTRATISTA"</Text>
        {', y el '}
        <Text style={b}>{comitente}</Text>
        {', con domicilio en '}
        <Text style={b}>{dirObra}</Text>
        {', representado en este acto por el Sr. '}
        <Text style={b}>{admin}</Text>
        {', DNI '}
        <Text style={b}>{dni}</Text>
        {', en su carácter de Administrador y dentro de las facultades conferidas por el Reglamento de Copropiedad y la normativa vigente, en adelante denominado '}
        <Text style={b}>"EL COMITENTE"</Text>
        {', se celebra el presente Contrato de Obra sujeto a las siguientes cláusulas:'}
      </Text>

      <View style={s.divider} />

      {/* ── PRIMERA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Primera – Objeto y documentación integrante</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'EL COMITENTE encomienda y EL CONTRATISTA acepta ejecutar los trabajos conforme al Presupuesto Técnico-Comercial N.º '}
          <Text style={b}>{presupuesto.numero ?? '—'}</Text>
          {' de fecha '}
          <Text style={b}>{fmtShort(presupuesto.fecha_creacion)}</Text>
          {', que forma parte integrante del presente contrato.\nEl alcance técnico, materiales, procedimientos, exclusiones, sectores de intervención y condiciones particulares serán exclusivamente los detallados en dicho presupuesto.\nEn caso de contradicción, prevalecerá el presupuesto en lo técnico y el presente contrato en lo legal.\nLas tareas incluyen provisión de materiales, mano de obra, herramientas, logística y ejecución integral de la obra.\nToda tarea no prevista será considerada adicional y deberá ser cotizada y aprobada previamente por escrito.\nLas decisiones técnicas serán adoptadas por EL CONTRATISTA conforme a las reglas del buen arte, sin perjuicio de la supervisión razonable del COMITENTE o su representante.'}
        </Text>
        {alcanceObra ? (
          <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
            <Text style={b}>Alcance de la obra: </Text>
            {alcanceObra}
          </Text>
        ) : null}
        {exenciones ? (
          <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
            <Text style={b}>Exclusiones: </Text>
            {exenciones}
          </Text>
        ) : null}
        {diagnosticoTec ? (
          <Text style={s.clausulaTexto}>
            <Text style={b}>Diagnóstico técnico - Procedimientos: </Text>
            {diagnosticoTec}
          </Text>
        ) : null}
      </View>

      {/* ── SEGUNDA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Segunda – Alcance técnico</Text>
        <Text style={s.clausulaTexto}>
          {'Los trabajos comprenden tareas de impermeabilización, reparación y mantenimiento, no constituyendo trabajos de embellecimiento general del edificio.\nSe incluyen tareas de limpieza, hidrolavado, preparación de superficies, reparación de revoques, tratamiento de fisuras y aplicación de revestimientos impermeables.\nLos materiales serán de primera calidad y estarán disponibles para inspección.\nLos métodos y procedimientos serán definidos por EL CONTRATISTA conforme evaluación técnica.\nQuedan expresamente excluidos todos los trabajos no detallados en el presupuesto, incluyendo retiro de redes, toldos, protecciones o trabajos sobre equipos de climatización.'}
        </Text>
      </View>

      {/* ── TERCERA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Tercera – Obligaciones del comitente</Text>
        <Text style={s.clausulaTexto}>
          {'EL COMITENTE deberá garantizar el acceso al edificio y a los sectores de trabajo, facilitar el uso de balcones y terrazas para descensos, proveer tomas de agua y energía eléctrica, y asignar un espacio seguro de guardado y un baño para el personal.\nLos propietarios deberán retirar o proteger elementos que interfieran con la ejecución de los trabajos, tales como redes, toldos, muebles, macetas y equipos de aire acondicionado.\nEl CONTRATISTA no será responsable por daños o defectos derivados de la falta de remoción de dichos elementos o de la imposibilidad de acceso.\nEl COMITENTE será responsable por robos o daños sufridos por herramientas, equipos o materiales cuando los mismos hayan sido almacenados en espacios provistos por el consorcio.'}
        </Text>
      </View>

      {/* ── CUARTA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Cuarta – Precio y forma de pago</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'El precio total de la obra se fija en la suma de PESOS '}
          <Text style={b}>{fmt(totalFinal)}</Text>
          {'.\nEl pago se realizará mediante transferencia bancaria de la siguiente forma:'}
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>a)</Text>
            <Text style={s.listaTexto}>
              {'Anticipo de '}
              <Text style={b}>{form.adelanto ? fmt(parseFloat(form.adelanto)) : fmt(anticipo)}</Text>
              {' a la firma del contrato, condición necesaria para el inicio de la obra.'}
            </Text>
          </View>
          {!esFinanciado ? (
            <View style={s.listaItem}>
              <Text style={s.listaBullet}>b)</Text>
              <Text style={s.listaTexto}>
                {'Saldo de '}
                <Text style={b}>{fmt(totalFinal - (form.adelanto ? parseFloat(form.adelanto) : anticipo))}</Text>
                {' a la Recepción Provisoria de la obra.'}
              </Text>
            </View>
          ) : plan === '60dias' ? (
            <View style={s.listaItem}>
              <Text style={s.listaBullet}>b)</Text>
              <Text style={s.listaTexto}>
                {'Saldo en dos (2) cuotas mensuales y consecutivas de '}
                <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                {form.fecha_cuota_1 ? ` (Cuota 1: ${fmtShort(form.fecha_cuota_1)}` : ''}
                {form.fecha_cuota_2 ? ` — Cuota 2: ${fmtShort(form.fecha_cuota_2)})` : (form.fecha_cuota_1 ? ')' : '')}
                {'.'}
              </Text>
            </View>
          ) : (
            <View style={s.listaItem}>
              <Text style={s.listaBullet}>b)</Text>
              <Text style={s.listaTexto}>
                {'Saldo en tres (3) cuotas mensuales y consecutivas de '}
                <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                {form.fecha_cuota_1 ? ` (Cuota 1: ${fmtShort(form.fecha_cuota_1)}` : ''}
                {form.fecha_cuota_2 ? ` — Cuota 2: ${fmtShort(form.fecha_cuota_2)}` : ''}
                {form.fecha_cuota_3 ? ` — Cuota 3: ${fmtShort(form.fecha_cuota_3)})` : (form.fecha_cuota_1 ? ')' : '')}
                {'.'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[s.clausulaTexto, { marginTop: 4 }]}>
          Las cuotas y saldos impagos se actualizarán conforme al índice de la Cámara Argentina de la Construcción (CAC), tomando como base el mes del presupuesto. La mora será automática y facultará al CONTRATISTA a suspender los trabajos hasta la regularización de la deuda, prorrogándose los plazos de obra sin penalidad.
        </Text>
      </View>

      {/* ── QUINTA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Quinta – Plazo de ejecución</Text>
        <Text style={s.clausulaTexto}>
          {'El inicio de la obra quedará condicionado al pago del anticipo y al cumplimiento de las obligaciones del COMITENTE.\nEl plazo de ejecución será de '}
          <Text style={b}>{diasEstimados > 0 ? `${diasEstimados}` : '_____'}</Text>
          {' días hábiles a cielo abierto.\nNo se considerarán demoras imputables al CONTRATISTA aquellas originadas por condiciones climáticas, interferencias, falta de acceso, trabajos adicionales, conflictos gremiales, faltantes de materiales o causas de fuerza mayor.\nEn caso de corresponder penalidad por demora imputable al CONTRATISTA, la misma será de '}
          <Text style={b}>{fmtOrBlank(form.monto_multa, true)}</Text>
          {' por día hábil, con un máximo del 5% del monto total del contrato.'}
        </Text>
      </View>

      {/* ── SEXTA ───────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Sexta – Seguridad, seguros y responsabilidad</Text>
        <Text style={s.clausulaTexto}>
          {'EL CONTRATISTA proveerá a su personal todos los elementos de seguridad necesarios y cumplirá con la normativa vigente en materia de seguridad e higiene.\nContará con seguro de Accidentes Personales o ART para el personal afectado.\nEL CONTRATISTA informa y recomienda expresamente al COMITENTE la contratación de un seguro de responsabilidad civil contra terceros que cubra eventuales daños a personas o bienes durante la ejecución de la obra.\nEL COMITENTE declara conocer dicha recomendación y deja constancia de que su contratación es facultativa y a su exclusivo cargo, no encontrándose incluida dentro del precio de la obra.\nEn caso de no contratar dicha cobertura, EL COMITENTE asume los riesgos derivados de dicha decisión y se obliga a mantener indemne al CONTRATISTA frente a reclamos de terceros que no sean consecuencia directa de culpa comprobable del mismo.\nEL CONTRATISTA será responsable por los daños directos que resulten de incumplimientos comprobados atribuibles a su actuación.\nNo será responsable por daños indirectos, extraordinarios, preexistentes o no detectables, ni por vicios ocultos o fallas estructurales del inmueble.\nEl personal contratado dependerá exclusivamente del CONTRATISTA, quien asumirá todas las obligaciones laborales, previsionales y fiscales, manteniendo indemne al COMITENTE frente a cualquier reclamo.'}
        </Text>
      </View>

      {/* ── SÉPTIMA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Séptima – Limitaciones y trabajos excluidos</Text>
        <Text style={s.clausulaTexto}>
          {'El CONTRATISTA no será responsable por vicios ocultos, patologías constructivas, filtraciones provenientes de sectores no intervenidos, interferencias externas ni daños producidos por terceros o por falta de mantenimiento.\nCualquier reparación no prevista será considerada adicional y deberá ser previamente cotizada y aprobada.'}
        </Text>
      </View>

      {/* ── OCTAVA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Octava – Recepción de obra</Text>
        <Text style={s.clausulaTexto}>
          {'Finalizados los trabajos se suscribirá un Acta de Recepción Provisoria.\nEl COMITENTE dispondrá de 30 días corridos para formular observaciones por escrito.\nTranscurrido dicho plazo sin observaciones, la obra se considerará aceptada y se tendrá por producida la recepción definitiva.'}
        </Text>
      </View>

      {/* ── NOVENA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Novena – Garantía</Text>
        {tieneGarantia === true ? (
          <Text style={s.clausulaTexto}>
            {'EL CONTRATISTA otorga una garantía de '}
            <Text style={b}>dos (2) años</Text>
            {' sobre los trabajos ejecutados, contados desde la recepción provisoria'}
            {garantiaVenc ? `, con vencimiento el ${fmtLong(garantiaVenc)}` : ''}
            {'.\nLa garantía cubre únicamente defectos atribuibles a la ejecución.\nQuedan excluidos los daños ocasionados por terceros, falta de mantenimiento, intervenciones posteriores, condiciones estructurales o fenómenos extraordinarios.\nLa intervención de terceros anulará la garantía.'}
          </Text>
        ) : tieneGarantia === false ? (
          <Text style={s.clausulaTexto}>
            Los trabajos objeto del presente Contrato no incluyen garantía. Las partes acuerdan expresamente esta condición al momento de la celebración del Contrato.
          </Text>
        ) : (
          <Text style={s.clausulaTexto}>
            {'Las condiciones de garantía serán las establecidas en el Presupuesto N.º '}
            <Text style={b}>{presupuesto.numero ?? '—'}</Text>
            {' y sus anexos.'}
          </Text>
        )}
      </View>

      {/* ── DÉCIMA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima – Imprevisión</Text>
        <Text style={s.clausulaTexto}>
          En caso de alteraciones económicas extraordinarias que tornen excesivamente onerosa la ejecución de la obra, las partes se comprometen a renegociar de buena fe las condiciones del contrato conforme a la normativa vigente.
        </Text>
      </View>

      {/* ── DÉCIMA PRIMERA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Primera – Rescisión</Text>
        <Text style={s.clausulaTexto}>
          {'Ante incumplimiento de cualquiera de las partes, y previa intimación fehaciente por cinco (5) días, la parte cumplidora podrá resolver el contrato, reclamar daños y perjuicios o exigir su cumplimiento.\nLas sumas adeudadas devengarán un interés del '}
          <Text style={b}>{tasaInteres}</Text>
          {' mensual.'}
        </Text>
      </View>

      {/* ── DÉCIMA SEGUNDA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Segunda – Jurisdicción</Text>
        <Text style={s.clausulaTexto}>
          Las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires.
        </Text>
      </View>

      {/* ── DÉCIMA TERCERA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Tercera – Domicilios</Text>
        <Text style={s.clausulaTexto}>
          Las partes constituyen los domicilios indicados en el encabezamiento, donde serán válidas todas las notificaciones mientras no se comunique fehacientemente su modificación.
        </Text>
      </View>

      {/* Cierre */}
      <Text style={s.cierre}>
        {'En prueba de conformidad, se firman dos (2) ejemplares de igual tenor en la Ciudad Autónoma de Buenos Aires, a los '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getDate()) : '___'}</Text>
        {' días del mes de '}
        <Text style={b}>{form.fecha_firma ? MESES[parseLocalDate(form.fecha_firma).getMonth()] : '__________'}</Text>
        {' de '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getFullYear()) : '20__'}</Text>
        {'.'}
      </Text>

      {/* Firmas — COMITENTE primero, luego CONTRATISTA */}
      <View style={s.firmaSection}>
        <View style={s.firmaCol}>
          {firmaCliente ? (
            <Image src={firmaCliente} style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <View style={{ height: 44 }} />
          )}
          <View style={s.firmaLinea} />
          <Text style={s.firmaTitulo}>EL COMITENTE</Text>
          <Text style={s.firmaSubtitulo}>{admin}</Text>
          <Text style={s.firmaSubtitulo}>DNI {dni}</Text>
        </View>
        <View style={s.firmaCol}>
          {firmaContratista ? (
            <Image src={firmaContratista} style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <View style={{ height: 44 }} />
          )}
          <View style={s.firmaLinea} />
          <Text style={s.firmaTitulo}>EL CONTRATISTA</Text>
          <Text style={s.firmaSubtitulo}>Luis Alfonzo</Text>
          <Text style={s.firmaSubtitulo}>CUIT 27-96416229-3</Text>
        </View>
      </View>

      {firmaUrl && !firmaCliente && (
        <View style={s.firmaUrlBox} wrap={false}>
          <Text style={s.firmaUrlLabel}>Firmá este contrato en línea:</Text>
          <Link src={firmaUrl} style={s.firmaUrlLink}>{firmaUrl}</Link>
        </View>
      )}

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          Limones - Rope Access · Contrato de Obra · Ref. {presupuesto.numero ?? '—'}
        </Text>
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>
    </Page>
  )
}

// ─── Documento standalone ─────────────────────────────────────────────────────

export function ContratoPDFDocument({
  presupuesto,
  form,
  firmaContratista,
  firmaCliente,
  firmaUrl,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  form: ContratoFormValues
  firmaContratista?: string | null
  firmaCliente?: string | null
  firmaUrl?: string
  logoUrl?: string | null
}) {
  return (
    <Document title={`Contrato · ${presupuesto.numero ?? ''}`} author="Limones - Rope Access">
      <ContratoPDFPage
        presupuesto={presupuesto}
        form={form}
        firmaContratista={firmaContratista}
        firmaCliente={firmaCliente}
        firmaUrl={firmaUrl}
        logoUrl={logoUrl}
      />
    </Document>
  )
}
