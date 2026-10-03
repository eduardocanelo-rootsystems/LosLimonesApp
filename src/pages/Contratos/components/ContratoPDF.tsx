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

  // Tabla materiales/MO (Cuarta – Ley 941)
  tabla: {
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: C.gray300,
  },
  tablaFila: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  tablaFilaUltima: {
    flexDirection: 'row',
  },
  tablaEncabezado: {
    backgroundColor: '#F9FAFB',
  },
  tablaTotal: {
    backgroundColor: '#F3F4F6',
  },
  tablaCelda: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9.5,
  },
  tablaCeldaDer: {
    textAlign: 'right',
    fontFamily: 'Helvetica',
  },

  checkItem: { flexDirection: 'row', marginTop: 3, paddingLeft: 8 },
  checkBox: { width: 16, fontSize: 10 },
  checkTexto: { flex: 1, fontSize: 10, lineHeight: 1.5 },

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

  anexos: { marginTop: 20 },
  anexosTitulo: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    color: C.black,
  },
  anexoItem: { fontSize: 9.5, lineHeight: 1.55, marginLeft: 8, marginTop: 1 },

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

  // Partes
  const comitente     = form.nombre_comitente    || presupuesto.cliente_razon_social    || '___________'
  const cuitConsorcio = presupuesto.cliente_cuit                                        || '___________'
  const dirObra       = form.direccion_obra       || presupuesto.cliente_direccion      || '___________'
  const admin         = form.nombre_administrador || presupuesto.cliente_administrador  || '___________'
  const cuitAdmin     = form.administrador_dni                                          || '___________'
  const emailAdmin    = presupuesto.cliente_email                                       || '___________'
  const aniosGarantia = form.anios_garantia || '2'

  const diasEstimados  = presupuesto.dias_estimados_obra ?? 0
  const esFinanciado   = plan === '60dias' || plan === '90dias'
  const tasaInteres    = form.tasa_interes ? `${form.tasa_interes}%` : '_____%'

  const alcanceObra    = presupuesto.alcance_obra        || ''
  const exenciones     = presupuesto.exenciones          || ''
  const diagnosticoTec = presupuesto.diagnostico_tecnico || ''
  const tieneGarantia  = presupuesto.tiene_garantia

  // Materiales y MO para Ley 941 (Cuarta)
  const importeMateriales = presupuesto.materiales.reduce((a, m) => a + Number(m.subtotal), 0)
  const importeManoObra   = totalFinal - importeMateriales

  // Fecha validez del presupuesto: fecha_creacion + 15 días
  const fechaValidez = presupuesto.fecha_creacion
    ? (() => {
        const d = new Date(presupuesto.fecha_creacion + 'T12:00:00')
        d.setDate(d.getDate() + 15)
        return fmtShort(d.toISOString())
      })()
    : '___/___/______'

  // Penalidad: 0,5% del total por día hábil
  const penalidad = totalFinal * 0.005

  return (
    <Page size="A4" style={s.page}>

      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <View style={s.contratoHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {logoUrl && <Image src={logoUrl} style={s.logoImg} />}
          <Text style={s.contratoHeaderLabel}>Limones - Rope Access · Contrato de Obra</Text>
        </View>
        <Text style={s.contratoHeaderLabel}>Ref. Presupuesto {presupuesto.numero ?? '—'}</Text>
      </View>

      {/* ── Título ─────────────────────────────────────────────────────── */}
      <Text style={[s.title, { marginTop: 12 }]}>Contrato de Obra</Text>
      <Text style={s.subtitle}>
        Restauración, Reparación e Impermeabilización de superficies en altura{'\n'}
        mediante sistemas de acceso por cuerdas
      </Text>
      <Text style={[s.subtitle, { color: C.gray700 }]}>{dirObra}</Text>

      {/* ── Lugar y fecha ──────────────────────────────────────────────── */}
      <Text style={s.lugar}>
        Ciudad Autónoma de Buenos Aires, {fmtLong(form.fecha_firma)}
      </Text>

      {/* ── Entre partes ───────────────────────────────────────────────── */}
      <Text style={s.preamble}>
        {'Entre el Sr. '}
        <Text style={b}>Luis Alfonzo</Text>
        {', CUIT N.º '}
        <Text style={b}>27-96416229-3</Text>
        {', con domicilio en Albarracín 2050, CABA, correo electrónico '}
        <Text style={b}>limonesropeaccess@gmail.com</Text>
        {', en adelante denominado '}
        <Text style={b}>"EL CONTRATISTA"</Text>
        {'; y '}
        <Text style={b}>{comitente}</Text>
        {', CUIT N.º '}
        <Text style={b}>{cuitConsorcio}</Text>
        {', con domicilio en '}
        <Text style={b}>{dirObra}</Text>
        {', representado en este acto por su Administrador, Sr./a '}
        <Text style={b}>{admin}</Text>
        {', CUIT N.º '}
        <Text style={b}>{cuitAdmin}</Text>
        {', correo electrónico '}
        <Text style={b}>{emailAdmin}</Text>
        {', actuando dentro de las facultades conferidas por el Reglamento de Copropiedad y la normativa vigente, en adelante denominado '}
        <Text style={b}>"EL COMITENTE"</Text>
        {'; se celebra el presente Contrato de Obra sujeto a las siguientes cláusulas:'}
      </Text>

      <View style={s.divider} />

      {/* ── PRIMERA ────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Primera – Objeto y documentación integrante</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'EL COMITENTE encomienda y EL CONTRATISTA acepta ejecutar los trabajos de restauración, reparación e impermeabilización de superficies en altura mediante sistemas de acceso por cuerdas, conforme al Presupuesto Técnico-Comercial N.º '}
          <Text style={b}>{presupuesto.numero ?? '—'}</Text>
          {' de fecha '}
          <Text style={b}>{fmtShort(presupuesto.fecha_creacion)}</Text>
          {' (con validez hasta el '}
          <Text style={b}>{fechaValidez}</Text>
          {'), que forma parte integrante del presente contrato como Anexo I.\nEl alcance técnico, materiales, procedimientos, exclusiones y condiciones particulares serán exclusivamente los detallados en dicho presupuesto.\nEn caso de contradicción prevalecerá el presupuesto en lo técnico y el presente contrato en lo legal.\nLas tareas incluyen provisión de materiales, mano de obra, herramientas, logística y ejecución integral de la obra.\nToda tarea no prevista será considerada adicional y deberá ser cotizada y aprobada previamente por escrito.\nLas decisiones técnicas serán adoptadas por EL CONTRATISTA conforme a las reglas del buen arte, sin perjuicio de la supervisión razonable del COMITENTE.'}
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
            <Text style={b}>Diagnóstico técnico – Procedimientos: </Text>
            {diagnosticoTec}
          </Text>
        ) : null}
      </View>

      {/* ── SEGUNDA ────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Segunda – Alcance técnico</Text>
        <Text style={s.clausulaTexto}>
          {'Los trabajos comprenden tareas de impermeabilización, reparación y mantenimiento, no constituyendo trabajos de embellecimiento general del edificio.\nSe incluyen tareas de limpieza, hidrolavado, preparación de superficies, reparación de revoques, tratamiento de fisuras y aplicación de revestimientos impermeables.\nLos materiales serán de primera calidad y estarán disponibles para inspección.\nLos métodos y procedimientos serán definidos por EL CONTRATISTA conforme evaluación técnica.\nQuedan expresamente excluidos todos los trabajos no detallados en el presupuesto, incluyendo retiro de redes, toldos, protecciones o trabajos sobre equipos de climatización.'}
        </Text>
      </View>

      {/* ── TERCERA ────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Tercera – Obligaciones del comitente</Text>
        <Text style={s.clausulaTexto}>
          {'EL COMITENTE deberá garantizar el acceso al edificio y a los sectores de trabajo, facilitar el uso de balcones y terrazas para descensos, proveer tomas de agua y energía eléctrica, y asignar un espacio seguro de guardado y un baño para el personal.\nLos propietarios deberán retirar o proteger elementos que interfieran con la ejecución (redes, toldos, muebles, macetas, equipos de aire acondicionado). EL CONTRATISTA no será responsable por daños derivados de la falta de remoción de dichos elementos o de la imposibilidad de acceso.\nEL COMITENTE será responsable por robos o daños sufridos por herramientas, equipos o materiales almacenados en espacios provistos por el consorcio.'}
        </Text>
      </View>

      {/* ── CUARTA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Cuarta – Precio y forma de pago</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'El precio total de la obra se fija en la suma de PESOS '}
          <Text style={b}>{fmt(totalFinal)}</Text>
          {', discriminado del siguiente modo:'}
        </Text>

        {/* Tabla materiales/MO – Ley 941 CABA */}
        <View style={s.tabla}>
          <View style={[s.tablaFila, s.tablaEncabezado]}>
            <Text style={[s.tablaCelda, s.b, { flex: 2 }]}>Concepto</Text>
            <Text style={[s.tablaCelda, s.b, s.tablaCeldaDer]}>Importe</Text>
          </View>
          <View style={s.tablaFila}>
            <Text style={[s.tablaCelda, { flex: 2 }]}>Materiales</Text>
            <Text style={[s.tablaCelda, s.tablaCeldaDer]}>{fmt(importeMateriales)}</Text>
          </View>
          <View style={s.tablaFila}>
            <Text style={[s.tablaCelda, { flex: 2 }]}>Mano de obra</Text>
            <Text style={[s.tablaCelda, s.tablaCeldaDer]}>{fmt(importeManoObra)}</Text>
          </View>
          <View style={[s.tablaFilaUltima, s.tablaTotal]}>
            <Text style={[s.tablaCelda, s.b, { flex: 2 }]}>TOTAL</Text>
            <Text style={[s.tablaCelda, s.b, s.tablaCeldaDer]}>{fmt(totalFinal)}</Text>
          </View>
        </View>

        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          El pago se realizará mediante transferencia bancaria de la siguiente forma:
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>a)</Text>
            <Text style={s.listaTexto}>
              {'Anticipo de '}
              <Text style={b}>{form.adelanto ? fmt(parseFloat(form.adelanto)) : fmt(anticipo)}</Text>
              {' a la firma del presente contrato, condición necesaria e indispensable para el inicio de la obra.'}
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
          Las cuotas y saldos impagos se actualizarán conforme al índice de la Cámara Argentina de la Construcción (CAC), tomando como base el mes del presupuesto. La mora será automática y facultará al CONTRATISTA a suspender los trabajos hasta la regularización, prorrogándose los plazos sin penalidad para el CONTRATISTA.
        </Text>
      </View>

      {/* ── QUINTA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Quinta – Plazo de ejecución</Text>
        <Text style={s.clausulaTexto}>
          {'El inicio de los trabajos se efectuará dentro de los '}
          <Text style={b}>5 (cinco) días hábiles</Text>
          {' siguientes a la firma del presente contrato y al cobro del anticipo pactado, sujeto a condiciones climáticas adversas o retraso en la disponibilidad de algún material fundamental para el comienzo de la obra.\nEl plazo de ejecución será de '}
          <Text style={b}>{diasEstimados > 0 ? `${diasEstimados}` : '_____'}</Text>
          {' días hábiles a cielo abierto, contados desde el inicio efectivo.\nNo se considerarán demoras imputables al CONTRATISTA las originadas por condiciones climáticas, interferencias técnicas, falta de acceso, trabajos adicionales, suspensiones o paros gremiales, faltante de materiales en el mercado o causas de fuerza mayor.\nLa demora imputable al CONTRATISTA tendrá una penalidad del '}
          <Text style={b}>0,5 % ({fmt(penalidad)})</Text>
          {' del precio total por día hábil, con un máximo del 5 % del monto total del contrato.'}
        </Text>
      </View>

      {/* ── SEXTA ──────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Sexta – Seguridad, seguros y responsabilidad</Text>
        <Text style={s.clausulaTexto}>
          {'EL CONTRATISTA proveerá a su personal todos los elementos de seguridad necesarios y cumplirá con la normativa vigente en materia de seguridad e higiene.\nContará con seguro de Accidentes Personales o ART para el personal afectado a la obra.\nEL CONTRATISTA recomienda expresamente al COMITENTE la contratación de un seguro de responsabilidad civil contra terceros que cubra eventuales daños a personas o bienes durante la ejecución. El COMITENTE declara conocer dicha recomendación; su contratación es facultativa y a su exclusivo cargo, no estando incluida en el precio de la obra. En caso de no contratar dicha cobertura, EL COMITENTE asume los riesgos derivados y se obliga a mantener indemne al CONTRATISTA frente a reclamos de terceros que no sean consecuencia directa de culpa comprobable de este.\nEL CONTRATISTA será responsable por los daños directos que resulten de incumplimientos comprobados atribuibles a su actuación, pero no por daños indirectos, extraordinarios, preexistentes, vicios ocultos o fallas estructurales del inmueble.\nEl personal depende exclusivamente del CONTRATISTA, quien asume todas las obligaciones laborales, previsionales y fiscales, manteniendo indemne al COMITENTE frente a cualquier reclamo.'}
        </Text>
      </View>

      {/* ── SÉPTIMA ────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Séptima – Limitaciones y trabajos excluidos</Text>
        <Text style={s.clausulaTexto}>
          {'EL CONTRATISTA no será responsable por vicios ocultos, patologías constructivas, filtraciones provenientes de sectores no intervenidos, interferencias externas ni daños producidos por terceros o por falta de mantenimiento posterior.\nCualquier reparación no prevista en el presupuesto será considerada adicional y deberá ser cotizada y aprobada previamente por escrito antes de su ejecución.'}
        </Text>
      </View>

      {/* ── OCTAVA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Octava – Recepción de obra</Text>
        <Text style={s.clausulaTexto}>
          {'Finalizados los trabajos se suscribirá un Acta de Recepción Provisoria. EL COMITENTE dispondrá de '}
          <Text style={b}>30 días corridos</Text>
          {' para formular observaciones por escrito. Transcurrido dicho plazo sin observaciones, la obra se considerará aceptada y se tendrá por producida la recepción definitiva, con los efectos legales correspondientes.'}
        </Text>
      </View>

      {/* ── NOVENA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Novena – Garantía</Text>
        {tieneGarantia === false ? (
          <Text style={s.clausulaTexto}>
            Los trabajos objeto del presente Contrato no incluyen garantía. Las partes acuerdan expresamente esta condición al momento de la celebración del Contrato.
          </Text>
        ) : (
          <Text style={s.clausulaTexto}>
            {'EL CONTRATISTA otorga una garantía de '}
            <Text style={b}>{aniosGarantia === '1' ? 'un (1) año' : `${aniosGarantia} (${aniosGarantia}) años`}</Text>
            {' sobre los trabajos ejecutados, contados desde la recepción provisoria de la obra.\nLa garantía cubre únicamente defectos atribuibles directamente a la ejecución realizada por EL CONTRATISTA.\nQuedan excluidos los daños ocasionados por terceros, falta de mantenimiento, intervenciones posteriores no autorizadas, condiciones estructurales del inmueble o fenómenos extraordinarios.\nLa intervención de terceros en los sectores garantizados anulará la presente garantía.'}
          </Text>
        )}
      </View>

      {/* ── DÉCIMA ─────────────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima – Imprevisión</Text>
        <Text style={s.clausulaTexto}>
          En caso de alteraciones económicas extraordinarias que tornen excesivamente onerosa la ejecución de la obra para una de las partes, ambas se comprometen a renegociar de buena fe las condiciones del contrato conforme a la normativa vigente, en particular el artículo 1091 del Código Civil y Comercial de la Nación.
        </Text>
      </View>

      {/* ── DÉCIMA PRIMERA ─────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Primera – Rescisión</Text>
        <Text style={s.clausulaTexto}>
          {'Ante incumplimiento de cualquiera de las partes, y previa intimación fehaciente concediendo un plazo de cinco (5) días hábiles para su regularización, la parte cumplidora podrá resolver el presente contrato, reclamar daños y perjuicios o exigir su cumplimiento.\nLas sumas adeudadas devengarán un interés del '}
          <Text style={b}>{tasaInteres}</Text>
          {' mensual desde la fecha de mora hasta su efectivo pago.'}
        </Text>
      </View>

      {/* ── DÉCIMA SEGUNDA ─────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Segunda – Jurisdicción</Text>
        <Text style={s.clausulaTexto}>
          Para cualquier controversia derivada del presente contrato, las partes se someten a la jurisdicción de los Tribunales Ordinarios de la Ciudad Autónoma de Buenos Aires, renunciando expresamente a cualquier otro fuero que pudiera corresponder.
        </Text>
      </View>

      {/* ── DÉCIMA TERCERA ─────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Tercera – Domicilios</Text>
        <Text style={s.clausulaTexto}>
          Las partes constituyen domicilio en los indicados en el encabezamiento del presente contrato, donde serán válidas todas las notificaciones judiciales y extrajudiciales, mientras no se comunique fehacientemente su modificación.
        </Text>
      </View>

      {/* ── DÉCIMA CUARTA ──────────────────────────────────────────────── */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Décima Cuarta – Cumplimiento Ley 941 CABA</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 4 }]}>
          {'En cumplimiento de la '}
          <Text style={b}>Ley 941 de la Ciudad Autónoma de Buenos Aires</Text>
          {' y su reglamentación, EL CONTRATISTA declara y el ADMINISTRADOR DEL CONSORCIO certifica haber recibido la siguiente documentación:'}
        </Text>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Inscripción vigente en el Registro de Empresas de Conservación, Mantenimiento y Reparación de Edificios de la CABA.</Text>
        </View>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Detalle discriminado de materiales y mano de obra conforme al artículo 5° de la Ley 941 (obra en Cláusula Cuarta del presente contrato).</Text>
        </View>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Nómina del personal afectado a la obra con constancias de alta en AFIP/ANSES vigentes al inicio de los trabajos.</Text>
        </View>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Póliza de seguro de Accidentes Personales o contrato de ART con nómina del personal cubierto.</Text>
        </View>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Constancias de cumplimiento de obligaciones laborales y previsionales del período anterior a la firma.</Text>
        </View>
        <View style={s.checkItem}>
          <Text style={s.checkBox}>☐</Text>
          <Text style={s.checkTexto}>Certificación de equipos de acceso por cuerdas y elementos de protección personal (EPP) conforme normativa vigente (Res. SRT 503/14 y concordantes).</Text>
        </View>
        <Text style={[s.clausulaTexto, { marginTop: 5 }]}>
          El incumplimiento de la presentación de cualquiera de los puntos anteriores por causas atribuibles al CONTRATISTA habilitará al COMITENTE a retener el pago del anticipo o de las cuotas pendientes hasta su regularización, sin que ello genere penalidad alguna para el COMITENTE ni interés a favor del CONTRATISTA.
        </Text>
      </View>

      {/* ── Cierre ─────────────────────────────────────────────────────── */}
      <Text style={s.cierre}>
        {'En prueba de conformidad, se suscriben dos (2) ejemplares de igual tenor y a un solo efecto, en la Ciudad Autónoma de Buenos Aires, a los '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getDate()) : '___'}</Text>
        {' días del mes de '}
        <Text style={b}>{form.fecha_firma ? MESES[parseLocalDate(form.fecha_firma).getMonth()] : '__________'}</Text>
        {' de '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getFullYear()) : '20__'}</Text>
        {'.'}
      </Text>

      {/* ── Firmas ─────────────────────────────────────────────────────── */}
      <View style={s.firmaSection}>
        <View style={s.firmaCol}>
          {firmaCliente ? (
            <Image src={firmaCliente} style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
          ) : (
            <View style={{ height: 44 }} />
          )}
          <View style={s.firmaLinea} />
          <Text style={s.firmaTitulo}>EL COMITENTE</Text>
          <Text style={s.firmaSubtitulo}>{comitente}</Text>
          <Text style={s.firmaSubtitulo}>p/ {admin}</Text>
          <Text style={s.firmaSubtitulo}>CUIT {cuitAdmin}</Text>
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

      {/* ── Anexos ─────────────────────────────────────────────────────── */}
      <View style={s.anexos} wrap={false}>
        <Text style={s.anexosTitulo}>Anexos integrantes del contrato</Text>
        <Text style={s.anexoItem}>
          {'Anexo I — Presupuesto Técnico-Comercial N.º '}
          <Text style={b}>{presupuesto.numero ?? '—'}</Text>
          {' de fecha '}
          <Text style={b}>{fmtShort(presupuesto.fecha_creacion)}</Text>
          {'.'}
        </Text>
        <Text style={s.anexoItem}>
          Anexo II — Documentación del CONTRATISTA exigida por la Ley 941 CABA (art. 11): inscripción registral, nómina de personal, constancias de ART o seguro de accidentes personales y certificación de equipos.
        </Text>
        <Text style={s.anexoItem}>
          Anexo III — Copia del acta de la Asamblea de Propietarios o del instrumento que acredita la aprobación de la obra por parte del consorcio (cuando corresponda).
        </Text>
      </View>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
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
