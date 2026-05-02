import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Contrato, PresupuestoCompleto } from '@/types/database'

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type PlanPago = 'contado' | '60dias' | '90dias' | ''

export interface ContratoFormValues {
  nombre_comitente: string
  direccion_obra: string
  nombre_administrador: string
  administrador_dni: string
  sector_obra: string
  plan_pago: PlanPago
  adelanto: string
  num_cuotas: string
  monto_cuota: string
  fecha_cuota_1: string
  fecha_cuota_2: string
  monto_multa: string
  direccion_legal: string
  fecha_inicio_obra: string
  fecha_firma: string
}

// ─── Lógica de financiamiento ─────────────────────────────────────────────────

export const PLANES_PAGO = {
  contado: { label: 'Contado (50/50)', recargo: 0, cuotasLabel: '' },
  '60dias': { label: 'Financiado a 60 días', recargo: 0.10, cuotasLabel: '+10%' },
  '90dias': { label: 'Financiado a 90 días', recargo: 0.35, cuotasLabel: '+35%' },
} as const

export function contratoToFormValues(
  contrato: Contrato | null,
  presupuesto: PresupuestoCompleto
): ContratoFormValues {
  const fechaFirmaDefault = presupuesto.fecha_aprobacion
    ? presupuesto.fecha_aprobacion.substring(0, 10)
    : ''
  return {
    nombre_comitente: contrato?.nombre_comitente ?? presupuesto.cliente_razon_social ?? '',
    direccion_obra: contrato?.direccion_obra ?? presupuesto.cliente_direccion ?? '',
    nombre_administrador: contrato?.nombre_administrador ?? presupuesto.cliente_administrador ?? '',
    administrador_dni: contrato?.administrador_dni ?? presupuesto.cliente_administrador_cuit ?? '',
    sector_obra: contrato?.sector_obra ?? '',
    plan_pago: (contrato?.plan_pago as PlanPago) ?? '',
    adelanto: contrato?.adelanto?.toString() ?? '',
    num_cuotas: contrato?.num_cuotas?.toString() ?? '',
    monto_cuota: contrato?.monto_cuota?.toString() ?? '',
    fecha_cuota_1: contrato?.fecha_cuota_1 ?? '',
    fecha_cuota_2: contrato?.fecha_cuota_2 ?? '',
    monto_multa: contrato?.monto_multa?.toString() ?? '',
    direccion_legal: contrato?.direccion_legal ?? presupuesto.cliente_direccion ?? '',
    fecha_inicio_obra: contrato?.fecha_inicio_obra ?? '',
    fecha_firma: contrato?.fecha_firma ?? fechaFirmaDefault,
  }
}

export function calcTotalPresupuesto(p: PresupuestoCompleto): number {
  const ss = p.servicios.reduce((a, s) => a + Number(s.subtotal), 0)
  const sm = p.materiales.reduce((a, m) => a + Number(m.subtotal), 0)
  const bruto = ss + sm
  const desc =
    p.descuento_tipo === 'fijo'
      ? Number(p.descuento_valor ?? 0)
      : p.descuento_tipo === 'porcentaje'
        ? (bruto * Number(p.descuento_valor ?? 0)) / 100
        : 0
  const neto = bruto - desc
  return neto + (neto * Number(p.iva_pct)) / 100
}

export function calcFinanciamiento(baseTotal: number, plan: PlanPago) {
  const recargo = plan === '60dias' ? 0.10 : plan === '90dias' ? 0.35 : 0
  const totalFinal = baseTotal * (1 + recargo)
  const anticipo = baseTotal * 0.5
  const saldo = totalFinal - anticipo
  const numInstallments = plan === '60dias' || plan === '90dias' ? 2 : 0
  const montoCuota = numInstallments > 0 ? saldo / numInstallments : saldo
  return { totalFinal, anticipo, saldo, numInstallments, montoCuota }
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function parseLocalDate(iso: string): Date {
  return new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
}

export function addWorkingDays(startIso: string, days: number): string {
  const d = new Date(startIso + 'T12:00:00')
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d.toISOString().substring(0, 10)
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

  // Encabezado de página de contrato (en documento combinado, actúa como separador)
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
  logoImg: { height: 22, width: 80, objectFit: 'contain' },

  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: C.gray500,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  lugar: {
    fontSize: 10,
    textAlign: 'right',
    color: C.gray700,
    marginBottom: 14,
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
    marginVertical: 12,
  },

  clausula: { marginBottom: 9 },
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
  listaBullet: { width: 14, fontSize: 10, color: C.black },
  listaTexto: { flex: 1, fontSize: 10, lineHeight: 1.55, textAlign: 'justify' },

  cierre: {
    fontSize: 10,
    lineHeight: 1.55,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 28,
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

// ─── Página del contrato (exportada para uso en documento combinado) ──────────

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

  const comitente = form.nombre_comitente || presupuesto.cliente_razon_social || '___________'
  const comitenteCuit = presupuesto.cliente_cuit || '___________'
  const dirObra = form.direccion_obra || presupuesto.cliente_direccion || '___________'
  const admin = form.nombre_administrador || presupuesto.cliente_administrador || '___________'
  const dni = form.administrador_dni || '___________'
  const sector = form.sector_obra || '___________'
  const dirLegal = form.direccion_legal || presupuesto.cliente_direccion || '___________'
  const diasEstimados = presupuesto.dias_estimados_obra ?? 0
  const esFinanciado = plan === '60dias' || plan === '90dias'
  const fechaFin = form.fecha_inicio_obra && diasEstimados > 0
    ? addWorkingDays(form.fecha_inicio_obra, diasEstimados)
    : null
  const serviciosNombres = presupuesto.servicios
    .filter((sv) => !sv.es_adicional)
    .map((sv) => sv.nombre_snapshot)
    .join('; ')

  return (
    <Page size="A4" style={s.page}>

      {/* Encabezado con referencia al presupuesto */}
      <View style={s.contratoHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {logoUrl && <Image src={logoUrl} style={s.logoImg} />}
          <Text style={s.contratoHeaderLabel}>Los Limones Creativos · Contrato de Locación de Obra</Text>
        </View>
        <Text style={s.contratoHeaderLabel}>Ref. Presupuesto {presupuesto.numero ?? '—'}</Text>
      </View>

      {/* Título */}
      <Text style={[s.title, { marginTop: 12 }]}>Contrato de Locación de Obra</Text>
      <Text style={s.subtitle}>{dirObra.toUpperCase()}</Text>

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
        {', sito en '}
        <Text style={b}>{dirObra}</Text>
        {', representado en este acto por el Sr. '}
        <Text style={b}>{admin}</Text>
        {', DNI '}
        <Text style={b}>{dni}</Text>
        {', en adelante denominado '}
        <Text style={b}>"EL COMITENTE"</Text>
        {', convienen lo siguiente:'}
      </Text>

      <View style={s.divider} />

      {/* PRIMERA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Primera: Objeto y Detalle Técnico</Text>
        <Text style={s.clausulaTexto}>
          {'EL COMITENTE encomienda al CONTRATISTA la ejecución de la obra detallada en el presupuesto '}
          <Text style={b}>N.º {presupuesto.numero ?? '—'}</Text>
          {' de fecha '}
          <Text style={b}>{fmtShort(presupuesto.fecha_creacion)}</Text>
          {', a realizarse en el sector de '}
          <Text style={b}>{sector}</Text>
          {' del edificio mencionado en el encabezado. Los trabajos incluyen: '}
          <Text style={b}>{serviciosNombres || 'los detallados en el presupuesto adjunto'}</Text>
          {'. Comprenden la preparación de superficies, reparaciones de mampostería, tratamiento de grietas y terminación con productos de primera calidad.'}
        </Text>
      </View>

      {/* SEGUNDA — varía según el plan */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Segunda: Precio y Forma de Pago</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>
          {'El precio total de la obra se fija en la suma de '}
          <Text style={b}>{fmt(totalFinal)}</Text>
          {esFinanciado
            ? ` (financiamiento a ${plan === '60dias' ? '60' : '90'} días, incluye ${plan === '60dias' ? '10' : '35'}% de recargo sobre el valor de contado de ${fmt(baseTotal)}).`
            : '.'}
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>•</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>Anticipo: </Text>
              <Text style={b}>{form.adelanto ? fmt(parseFloat(form.adelanto)) : fmt(anticipo)}</Text>
              {' a la firma del presente contrato.'}
            </Text>
          </View>
          {plan === 'contado' || plan === '' ? (
            <View style={s.listaItem}>
              <Text style={s.listaBullet}>•</Text>
              <Text style={s.listaTexto}>
                <Text style={b}>Saldo: </Text>
                {'La suma restante de '}
                <Text style={b}>{fmt(totalFinal - (form.adelanto ? parseFloat(form.adelanto) : anticipo))}</Text>
                {' será abonada a la recepción provisoria de la obra.'}
              </Text>
            </View>
          ) : (
            <>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}>•</Text>
                <Text style={s.listaTexto}>
                  <Text style={b}>Cuota 1: </Text>
                  <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                  {form.fecha_cuota_1 ? `, a abonar el ${fmtShort(form.fecha_cuota_1)}.` : '.'}
                </Text>
              </View>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}>•</Text>
                <Text style={s.listaTexto}>
                  <Text style={b}>Cuota 2: </Text>
                  <Text style={b}>{form.monto_cuota ? fmt(parseFloat(form.monto_cuota)) : fmtOrBlank(String(montoCuota), true)}</Text>
                  {form.fecha_cuota_2 ? `, a abonar el ${fmtShort(form.fecha_cuota_2)}.` : '.'}
                </Text>
              </View>
              <View style={s.listaItem}>
                <Text style={s.listaBullet}>•</Text>
                <Text style={s.listaTexto}>
                  <Text style={b}>Cláusula de Ajuste: </Text>
                  {'Las cuotas del saldo se ajustarán por el índice de la Cámara Argentina de la Construcción (C.A.C.), tomando como base la fecha del presupuesto.'}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* TERCERA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Tercera: Plazos y Condiciones Climáticas</Text>
        <Text style={s.clausulaTexto}>
          {'La obra comenzará el día '}
          <Text style={b}>{fmtLong(form.fecha_inicio_obra)}</Text>
          {fechaFin ? ' y finalizará estimativamente el ' : ' y tendrá una duración estimada de '}
          {fechaFin
            ? <Text style={b}>{fmtLong(fechaFin)}</Text>
            : <Text style={b}>{diasEstimados > 0 ? `${diasEstimados} días hábiles` : '_____ días hábiles'}</Text>
          }
          {fechaFin && diasEstimados > 0
            ? ` (${diasEstimados} días hábiles de trabajo efectivo a cielo abierto).`
            : ' de trabajo efectivo a cielo abierto.'}
          {' El plazo se extenderá por días de lluvia o condiciones climáticas que impidan técnicamente las tareas. Por cada día de retraso injustificado, se establece una multa de '}
          <Text style={b}>{fmtOrBlank(form.monto_multa, true)}</Text>
          {'.'}
        </Text>
      </View>

      {/* CUARTA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Cuarta: Seguros y Responsabilidad</Text>
        <Text style={s.clausulaTexto}>
          EL CONTRATISTA presentará, previo al inicio, seguros de Accidentes Personales (con Cláusula de No Repetición a favor del COMITENTE) y de Responsabilidad Civil. Es único responsable por su personal y subcontratistas.
        </Text>
      </View>

      {/* QUINTA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Quinta: Interferencias y Elementos de Terceros</Text>
        <Text style={s.clausulaTexto}>
          EL CONTRATISTA no se responsabiliza por el movimiento de equipos de aire acondicionado ni por daños accidentales o terminaciones defectuosas en áreas donde no se hayan retirado redes de protección, objetos de valor o mobiliario por parte de los propietarios.
        </Text>
      </View>

      {/* SEXTA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Sexta: Limitación de Responsabilidad por Materiales</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>
          EL CONTRATISTA queda eximido de responsabilidad y la garantía de obra no tendrá efecto en los siguientes casos:
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>1.</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>Materiales provistos por el cliente: </Text>
              Si EL COMITENTE optara por adquirir los materiales, EL CONTRATISTA no responderá por su rendimiento, durabilidad o fallas de calidad, limitándose su garantía únicamente a la ejecución de la mano de obra.
            </Text>
          </View>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>2.</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>Defectos de fabricación: </Text>
              EL CONTRATISTA no será responsable por vicios propios o fallas de fabricación de los insumos (pinturas, selladores, etc.), independientemente de quién los adquiera, siempre que hayan sido aplicados según las especificaciones del fabricante.
            </Text>
          </View>
        </View>
      </View>

      {/* SÉPTIMA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Séptima: Adicionales</Text>
        <Text style={s.clausulaTexto}>
          Se cobrarán adicionales por reparaciones fuera de lo previsto (desmoronamientos profundos, frentines degradados, etc.), los cuales serán comunicados y presupuestados previo a su ejecución.
        </Text>
      </View>

      {/* OCTAVA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Octava: Recepción y Garantía</Text>
        <Text style={s.clausulaTexto}>
          {'Al finalizar se firmará un Acta de Recepción Provisoria y, a los 30 días, la Recepción Final. Los trabajos cuentan con una garantía de '}
          <Text style={b}>2 años</Text>
          {' sobre la impermeabilización, condicionada a lo expuesto en la cláusula sexta.'}
        </Text>
      </View>

      {/* NOVENA */}
      <View style={s.clausula}>
        <Text style={s.clausulaTitulo}>Novena: Jurisdicción y Domicilios</Text>
        <Text style={[s.clausulaTexto, { marginBottom: 3 }]}>
          Las partes constituyen domicilios en:
        </Text>
        <View style={s.lista}>
          <View style={s.listaItem}>
            <Text style={s.listaBullet}>•</Text>
            <Text style={s.listaTexto}>
              <Text style={b}>EL CONTRATISTA: </Text>
              Albarracín 2050, PH3, CABA.
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
          Se someten a los Tribunales Ordinarios de la Capital Federal ante cualquier divergencia.
        </Text>
      </View>

      {/* Cierre */}
      <Text style={s.cierre}>
        {'En prueba de conformidad, se firman dos ejemplares de un mismo tenor a los '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getDate()) : '___'}</Text>
        {' días del mes de '}
        <Text style={b}>{form.fecha_firma ? MESES[parseLocalDate(form.fecha_firma).getMonth()] : '__________'}</Text>
        {' de '}
        <Text style={b}>{form.fecha_firma ? String(parseLocalDate(form.fecha_firma).getFullYear()) : '20__'}</Text>
        {'.'}
      </Text>

      {/* Firmas */}
      <View style={s.firmaSection}>
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
          Los Limones Creativos · Contrato de Locación de Obra · Ref. {presupuesto.numero ?? '—'}
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
    <Document title={`Contrato · ${presupuesto.numero ?? ''}`} author="Los Limones Creativos">
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
