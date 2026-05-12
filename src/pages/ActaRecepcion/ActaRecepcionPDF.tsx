import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ActaItem } from './useActaRecepcion'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ActaPDFData {
  presupuesto_numero: string | null
  presupuesto_fecha: string | null
  nombre_comitente: string | null
  nombre_administrador: string | null
  administrador_dni: string | null
  direccion_obra: string | null
  fecha_recepcion_prov: string | null
  observaciones_generales: string | null
  items: ActaItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (!iso) return '—'
  const d = parseLocalDate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  black:   '#111111',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  white:   '#FFFFFF',
  accent:  '#B7FF00',
  green:   '#16A34A',
  red:     '#DC2626',
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

  header: {
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLabel: { fontSize: 7, color: C.gray500, letterSpacing: 1.5, textTransform: 'uppercase' },
  logoImg: { height: 26, width: 78, objectFit: 'contain' },

  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: C.gray500,
    textAlign: 'center',
    marginBottom: 14,
  },

  infoBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  infoCell: {
    width: '50%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  infoCellFull: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  infoLabel: { fontSize: 7, color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  infoValue: { fontSize: 10, color: C.black, fontFamily: 'Helvetica-Bold' },

  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: C.gray500,
    marginBottom: 5,
    marginTop: 12,
  },

  // Tabla de ítems
  table: {
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 28,
  },
  tableRowAlt: {
    backgroundColor: C.gray100,
  },
  colNum:      { width: 24,   fontSize: 8,  color: C.gray500 },
  colServicio: { flex: 1,     fontSize: 10, lineHeight: 1.4  },
  colEstado:   { width: 72,   fontSize: 10, textAlign: 'center' },
  colObs:      { width: 140,  fontSize: 9,  color: C.gray700, lineHeight: 1.4 },
  thText:      { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.gray700, textTransform: 'uppercase', letterSpacing: 0.5 },
  estadoOk:    { color: C.green, fontFamily: 'Helvetica-Bold' },
  estadoNo:    { color: C.red,   fontFamily: 'Helvetica-Bold' },

  obsBox: {
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 3,
    padding: 10,
    marginBottom: 18,
  },
  obsText: {
    fontSize: 10,
    lineHeight: 1.55,
    color: C.black,
  },

  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
    marginVertical: 12,
  },

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
  firmaTitulo:    { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  firmaSubtitulo: { fontSize: 8.5, color: C.gray500, textAlign: 'center' },

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
  footerText:  { fontSize: 7, color: C.gray500 },
  pageNumber:  { fontSize: 7, color: C.gray500 },

  b: { fontFamily: 'Helvetica-Bold' },
})

// ─── Componente de página (exportado para uso en doc. combinado) ──────────────

export function ActaRecepcionPDFPage({
  data,
  firmaContratista,
  firmaCliente,
  logoUrl,
}: {
  data: ActaPDFData
  firmaContratista?: string | null
  firmaCliente?: string | null
  logoUrl?: string | null
}) {
  const b = s.b
  const comitente   = data.nombre_comitente    || '___________'
  const admin       = data.nombre_administrador || '___________'
  const dni         = data.administrador_dni    || '___________'
  const dirObra     = data.direccion_obra       || '___________'
  const totalItems  = data.items.length
  const completados = data.items.filter((i) => i.completado).length

  return (
    <Page size="A4" style={s.page}>

      {/* Encabezado */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {logoUrl && <Image src={logoUrl} style={s.logoImg} />}
          <Text style={s.headerLabel}>Limones - Rope Access · Acta de Recepción Provisoria</Text>
        </View>
        <Text style={s.headerLabel}>Ref. Presupuesto {data.presupuesto_numero ?? '—'}</Text>
      </View>

      {/* Título */}
      <Text style={s.title}>Acta de Recepción Provisoria de Obra</Text>
      <Text style={s.subtitle}>
        Ciudad Autónoma de Buenos Aires · {fmtLong(data.fecha_recepcion_prov)}
      </Text>

      {/* Datos del proyecto */}
      <View style={s.infoBox}>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Comitente</Text>
          <Text style={s.infoValue}>{comitente}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Dirección de la obra</Text>
          <Text style={s.infoValue}>{dirObra}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Administrador</Text>
          <Text style={s.infoValue}>{admin} · DNI {dni}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Presupuesto N.º</Text>
          <Text style={s.infoValue}>
            {data.presupuesto_numero ?? '—'} · {fmtShort(data.presupuesto_fecha)}
          </Text>
        </View>
        <View style={[s.infoCellFull, { borderBottomWidth: 0 }]}>
          <Text style={s.infoLabel}>Estado de la obra</Text>
          <Text style={[s.infoValue, completados === totalItems ? { color: C.green } : { color: C.red }]}>
            {completados} de {totalItems} ítem{totalItems !== 1 ? 's' : ''} completado{totalItems !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Tabla de ítems */}
      <Text style={s.sectionTitle}>Verificación de trabajos realizados</Text>
      <View style={s.table}>
        {/* Encabezado de tabla */}
        <View style={s.tableHeader}>
          <Text style={[s.colNum,      s.thText]}>#</Text>
          <Text style={[s.colServicio, s.thText]}>Servicio / Trabajo</Text>
          <Text style={[s.colEstado,   s.thText]}>Estado</Text>
          <Text style={[s.colObs,      s.thText]}>Observaciones</Text>
        </View>

        {/* Filas */}
        {data.items.map((item, idx) => (
          <View
            key={item.id}
            style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}
            wrap={false}
          >
            <Text style={s.colNum}>{idx + 1}</Text>
            <Text style={s.colServicio}>{item.servicio_nombre}</Text>
            <Text style={[s.colEstado, item.completado ? s.estadoOk : s.estadoNo]}>
              {item.completado ? '✓ Completado' : '✗ Pendiente'}
            </Text>
            <Text style={s.colObs}>{item.observacion || '—'}</Text>
          </View>
        ))}
      </View>

      {/* Observaciones generales */}
      {data.observaciones_generales ? (
        <>
          <Text style={s.sectionTitle}>Observaciones generales</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{data.observaciones_generales}</Text>
          </View>
        </>
      ) : (
        <View style={{ marginBottom: 14 }} />
      )}

      <View style={s.divider} />

      {/* Texto de conformidad */}
      <Text style={s.cierre}>
        {'Las partes firman el presente documento en prueba de conformidad con los trabajos recibidos,\n'}
        {'en la Ciudad Autónoma de Buenos Aires, a los '}
        <Text style={b}>{data.fecha_recepcion_prov ? String(parseLocalDate(data.fecha_recepcion_prov).getDate()) : '___'}</Text>
        {' días del mes de '}
        <Text style={b}>{data.fecha_recepcion_prov ? MESES[parseLocalDate(data.fecha_recepcion_prov).getMonth()] : '__________'}</Text>
        {' de '}
        <Text style={b}>{data.fecha_recepcion_prov ? String(parseLocalDate(data.fecha_recepcion_prov).getFullYear()) : '20__'}</Text>
        {'.'}
      </Text>

      {/* Firmas — COMITENTE primero, luego CONTRATISTA */}
      <View style={s.firmaSection} wrap={false}>
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

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          Limones - Rope Access · Acta de Recepción Provisoria · Ref. {data.presupuesto_numero ?? '—'}
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

export function ActaRecepcionPDFDocument({
  data,
  firmaContratista,
  firmaCliente,
  logoUrl,
}: {
  data: ActaPDFData
  firmaContratista?: string | null
  firmaCliente?: string | null
  logoUrl?: string | null
}) {
  return (
    <Document
      title={`Acta de Recepción · ${data.presupuesto_numero ?? ''}`}
      author="Limones - Rope Access"
    >
      <ActaRecepcionPDFPage
        data={data}
        firmaContratista={firmaContratista}
        firmaCliente={firmaCliente}
        logoUrl={logoUrl}
      />
    </Document>
  )
}
