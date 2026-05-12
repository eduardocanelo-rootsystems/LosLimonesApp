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
  const { totalFinal, anticipo, saldo, montoCuota } = calcFinanciamiento(baseTotal, plan)

  const comitente  = form.nombre_comitente     || presupuesto.cliente_razon_social    || '___________'
  const comitenteCuit = presupuesto.cliente_cuit || '___________'
  const dirObra    = form.direccion_obra        || presupuesto.cliente_direccion       || '___________'
  const admin      = form.nombre_administrador  || presupuesto.cliente_administrador   || '___________'
  const dni        = form.administrador_dni     || '___________'
  const dirLegal   = form.direccion_legal       || presupuesto.cliente_direccion       || '___________'
  const diasEstimados = presupuesto.dias_estimados_obra ?? 0
  const esFinanciado  = plan === '60dias' || plan === '90dias'
  const fechaFin   = form.fecha_inicio_obra && diasEstimados > 0
    ? addWorkingDays(form.fecha_inicio_obra, diasEstimados)
    : null
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
        {'Entre '}
        <Text style={b}>Luis Alfonzo</Text>
        {', CUIT N.º '}
        <Text style={b}>27-96416229-3</Text>
        {', con domicilio en la calle Albarracín 2050, PH3, CABA, en adelante denominado '}
        <Text style={b}>"EL CONTRATISTA"</Text>
        {'; y '}
        <Text style={b}>{comitente}</Text>
        {', CUIT N.º '}
        <Text style={b}>{comitenteCuit}</Text>
        {', representado en este acto por el/la Sr./Sra. '}
        <Text style={b}>{admin}</Text>
        {', DNI '}
        <Text style={b}>{dni}</Text>
        {', en adelante denominado '}
        <Text style={b}>"EL COMITENTE"</Text>
        {', acuerdan celebrar el presente Contrato de Obra conforme a las siguientes cláusulas y condiciones:'}
      </Text>

      <View style={s.divider} />

      {/* ── PRIMERA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Primera – Objeto y documentación integrante</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'El presente Contrato tiene por objeto la ejecución de la obra detallada en el Presupuesto '}
          <Text style={b}>N.º {presupuesto.numero ?? '—'}</Text>
          {' de fecha '}
          <Text style={b}>{fmtShort(presupuesto.fecha_creacion)}</Text>
          {', el que integra este instrumento como Anexo I. En caso de divergencia, prevalecerá el texto del Contrato.'}
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
          Los trabajos se ejecutarán mediante el sistema de acceso por cuerdas (rope access), metodología certificada para intervenciones en altura que permite actuar sobre fachadas, contrafrentes, pozos de luz y áreas de difícil acceso sin necesidad de andamios. EL CONTRATISTA se compromete a emplear materiales de primera calidad, seleccionados según las especificaciones técnicas del fabricante y las características del edificio, aplicados conforme a las normas vigentes para sistemas de impermeabilización y restauración de superficies expuestas.
        </Text>
      </View>

      {/* ── TERCERA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Tercera – Obligaciones del comitente</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>EL COMITENTE se obliga a:</Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>a)</Text>
            <Text style={s.listaTexto}>Garantizar el libre y seguro acceso al inmueble y a todas las áreas donde se ejecutarán los trabajos, incluyendo terrazas, azoteas y espacios comunes.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>b)</Text>
            <Text style={s.listaTexto}>Notificar a propietarios y ocupantes sobre las tareas programadas con la debida antelación.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>c)</Text>
            <Text style={s.listaTexto}>Retirar o custodiar —antes del inicio de los trabajos— elementos de valor (macetas, toldos, equipos de aire acondicionado, objetos de decoración u otros) de las áreas de intervención.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>d)</Text>
            <Text style={s.listaTexto}>Designar un referente de contacto disponible durante la ejecución de la obra.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>e)</Text>
            <Text style={s.listaTexto}>Abonar los importes convenidos en las condiciones y plazos establecidos en la Cláusula Cuarta.</Text>
          </View>
        </View>
      </View>

      {/* ── CUARTA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Cuarta – Precio y forma de pago</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'El precio total de la obra se fija en '}
          <Text style={b}>{fmt(totalFinal)}</Text>
          {esFinanciado
            ? ` (financiamiento a ${plan === '60dias' ? '60' : '90'} días, con un recargo del ${plan === '60dias' ? '10' : '20'}% sobre el 50% financiado; valor de contado: ${fmt(baseTotal)}).`
            : ', abonado de la siguiente manera:'}
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>•</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>Anticipo: </Text>
              <Text style={b}>{form.adelanto ? fmt(parseFloat(form.adelanto)) : fmt(anticipo)}</Text>
              {' a la firma del presente Contrato.'}
            </Text>
          </View>
          {!esFinanciado ? (
            <View style={s.listaItem}>
              <Text style={s.listaBullet}>•</Text>
              <Text style={s.listaTexto}>
                <Text style={b}>Saldo: </Text>
                <Text style={b}>{fmt(totalFinal - (form.adelanto ? parseFloat(form.adelanto) : anticipo))}</Text>
                {' a la Recepción Provisoria de la obra.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}>•</Text>
                <Text style={s.listaTexto}>
                  <Text style={b}>Saldo financiado: </Text>
                  <Text style={b}>{fmt(saldo)}</Text>
                  {', en dos (2) cuotas iguales:'}
                </Text>
              </View>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}> </Text>
                <Text style={s.listaTexto}>
                  {'– Cuota 1: '}
                  <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                  {form.fecha_cuota_1 ? `, con vencimiento el ${fmtShort(form.fecha_cuota_1)}.` : '.'}
                </Text>
              </View>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}> </Text>
                <Text style={s.listaTexto}>
                  {'– Cuota 2: '}
                  <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                  {form.fecha_cuota_2 ? `, con vencimiento el ${fmtShort(form.fecha_cuota_2)}.` : '.'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ── QUINTA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Quinta – Plazo de ejecución</Text>
        <Text style={s.clausulaTexto}>
          {'La obra comenzará el '}
          <Text style={b}>{fmtLong(form.fecha_inicio_obra)}</Text>
          {fechaFin ? ' y finalizará estimativamente el ' : '. La duración estimada es de '}
          {fechaFin
            ? <Text style={b}>{fmtLong(fechaFin)}</Text>
            : <Text style={b}>{diasEstimados > 0 ? `${diasEstimados} días hábiles` : '_____ días hábiles'}</Text>
          }
          {fechaFin && diasEstimados > 0
            ? ` (${diasEstimados} días hábiles de trabajo efectivo a cielo abierto).`
            : ' de trabajo efectivo a cielo abierto.'}
          {' El plazo se prorrogará automáticamente por los días en que las condiciones climáticas o causas de fuerza mayor impidan técnicamente la realización de las tareas. Por cada día de retraso injustificado imputable a EL CONTRATISTA, se establece una multa de '}
          <Text style={b}>{fmtOrBlank(form.monto_multa, true)}</Text>
          {'.'}
        </Text>
      </View>

      {/* ── SEXTA ───────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Sexta – Seguridad, seguros y responsabilidad</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>
          Con anterioridad al inicio de los trabajos, EL CONTRATISTA presentará:
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>a)</Text>
            <Text style={s.listaTexto}>Póliza de Seguro de Accidentes del Trabajo (ART) vigente, con Cláusula de No Repetición a favor de EL COMITENTE.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>b)</Text>
            <Text style={s.listaTexto}>Póliza de Seguro de Responsabilidad Civil, que cubra daños a terceros y a bienes de EL COMITENTE derivados de la ejecución de los trabajos.</Text>
          </View>
        </View>
        <Text style={[s.clausulaTexto, { marginTop: 4 }]}>
          EL CONTRATISTA es el único responsable frente a su personal y a los subcontratistas que intervengan en la obra. EL COMITENTE no asumirá responsabilidad por accidentes, enfermedades profesionales ni cualquier otra contingencia que afecte al personal afectado a los trabajos.
        </Text>
      </View>

      {/* ── SÉPTIMA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Séptima – Limitaciones y trabajos excluidos</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>EL CONTRATISTA no asumirá responsabilidad por:</Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>a)</Text>
            <Text style={s.listaTexto}>Daños producidos durante el traslado necesario de equipos de aire acondicionado, antenas u otros artefactos instalados en fachadas o terrazas, cuando dicho movimiento sea imprescindible para la ejecución de los trabajos y no hubiera sido contratado expresamente.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>b)</Text>
            <Text style={s.listaTexto}>Defectos de terminación en áreas donde no se hayan retirado previamente redes de protección, lonas, objetos de valor, mobiliario u otros elementos por parte de los propietarios u ocupantes.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>c)</Text>
            <Text style={s.listaTexto}>Vicios propios o fallas de fabricación de materiales —pinturas, selladores, membranas u otros— independientemente de quién los adquiera, siempre que hayan sido aplicados conforme a las especificaciones del fabricante.</Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>d)</Text>
            <Text style={s.listaTexto}>Trabajos adicionales no contemplados en el Presupuesto (reparaciones de profundidad mayor a la prevista, recambio de aberturas, sectores no incluidos u otras intervenciones ajenas al objeto pactado). Dichos adicionales serán comunicados a EL COMITENTE y presupuestados por separado antes de su ejecución.</Text>
          </View>
        </View>
      </View>

      {/* ── OCTAVA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Octava – Recepción de obra</Text>
        <Text style={s.clausulaTexto}>
          A la finalización de los trabajos, las partes suscribirán conjuntamente un Acta de Recepción Provisoria, a partir de la cual comenzará un período de observación de <Text style={b}>treinta (30) días corridos</Text>. Transcurrido dicho plazo sin que EL COMITENTE hubiera formulado observaciones por escrito, se operará la Recepción Definitiva, dando por cumplidas las obligaciones de EL CONTRATISTA salvo las de garantía que correspondan conforme a la Cláusula Novena.
        </Text>
      </View>

      {/* ── NOVENA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Novena – Garantía</Text>
        {tieneGarantia === true ? (
          <Text style={s.clausulaTexto}>
            {'Los trabajos ejecutados cuentan con una garantía de '}
            <Text style={b}>dos (2) años</Text>
            {' contados desde la Recepción Provisoria'}
            {garantiaVenc ? `, con fecha de vencimiento el ${fmtLong(garantiaVenc)},` : ''}
            {' sobre los sistemas de impermeabilización aplicados. La garantía queda condicionada al cumplimiento de las obligaciones de EL COMITENTE establecidas en la Cláusula Tercera y a las limitaciones previstas en la Cláusula Séptima.'}
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
          Si circunstancias extraordinarias e imprevisibles al momento de la celebración de este Contrato —incluyendo variaciones significativas en los costos de materiales, mano de obra o insumos— tornaran excesivamente onerosa la prestación a cargo de EL CONTRATISTA, las partes se obligan a renegociar de buena fe las condiciones económicas en un plazo no mayor de quince (15) días hábiles desde la notificación fehaciente de la situación. En caso de no arribar a un acuerdo, cualquiera de las partes podrá invocar la rescisión del Contrato sin penalidad, reconociéndose los trabajos efectivamente ejecutados hasta esa fecha.
        </Text>
      </View>

      {/* ── DÉCIMA PRIMERA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Primera – Rescisión</Text>
        <Text style={s.clausulaTexto}>
          Cualquiera de las partes podrá rescindir el presente Contrato mediante notificación fehaciente con una antelación mínima de cinco (5) días hábiles. En caso de rescisión por causa imputable a EL COMITENTE, este abonará los trabajos ejecutados más una indemnización equivalente al veinte por ciento (20%) del saldo pendiente. En caso de rescisión por causa imputable a EL CONTRATISTA, este reintegrará los anticipos recibidos por trabajos no ejecutados. Las sumas adeudadas en cualquier supuesto devengarán un interés del <Text style={b}>{tasaInteres}</Text> mensual desde su vencimiento hasta el efectivo pago.
        </Text>
      </View>

      {/* ── DÉCIMA SEGUNDA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Segunda – Jurisdicción</Text>
        <Text style={s.clausulaTexto}>
          Para todos los efectos legales derivados del presente Contrato, las partes se someten a la jurisdicción exclusiva de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando a cualquier otro fuero o jurisdicción que pudiera corresponderles.
        </Text>
      </View>

      {/* ── DÉCIMA TERCERA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Tercera – Domicilios</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>
          Las partes constituyen los siguientes domicilios especiales a todos los efectos del presente Contrato:
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>•</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>EL CONTRATISTA: </Text>
              Albarracín 2050, PH3, Ciudad Autónoma de Buenos Aires.
            </Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>•</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>EL COMITENTE: </Text>
              {dirLegal}
            </Text>
          </View>
        </View>
        <Text style={[s.clausulaTexto, { marginTop: 4 }]}>
          Las notificaciones cursadas a los domicilios precedentes se tendrán por válidamente efectuadas.
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
