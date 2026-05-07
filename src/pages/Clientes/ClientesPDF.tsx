import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

export interface ClienteRow {
  razon_social:   string
  cuit:           string
  telefono:       string
  email:          string
  direccion:      string
  presupuestos:   { length: number }
  total_aprobado: number
}

const C = {
  black:   '#111111',
  white:   '#FFFFFF',
  accent:  '#B7FF00',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  gray50:  '#F9FAFB',
}

const ps = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 8, color: C.black,
    paddingTop: 0, paddingBottom: 44, paddingHorizontal: 0,
    backgroundColor: C.white,
  },
  band: {
    backgroundColor: C.black,
    paddingHorizontal: 36, paddingTop: 28, paddingBottom: 22,
    marginBottom: 20,
  },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  company:     { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  companySlug: { fontSize: 7, color: C.gray500, letterSpacing: 2, marginTop: 2 },
  docTitle:    { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.accent },
  docDate:     { fontSize: 8, color: C.gray500, marginTop: 3, textAlign: 'right' },
  kpiRow: {
    flexDirection: 'row', gap: 10,
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: '#2A2A2A',
  },
  kpiBox:   { flex: 1, backgroundColor: '#1C1C1C', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8 },
  kpiLabel: { fontSize: 6.5, color: C.gray500, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  kpiValue:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white },
  kpiAccent: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.accent },
  tableWrap: { paddingHorizontal: 36 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    paddingVertical: 6, paddingHorizontal: 8,
    borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: C.gray300,
  },
  th:     { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.8 },
  row:    { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.gray100 },
  rowAlt: { backgroundColor: C.gray50 },
  td:     { fontSize: 8.5, color: C.black },
  tdSub:  { fontSize: 7, color: C.gray500, marginTop: 1.5 },
  tdBold: { fontSize: 8.5, color: C.black, fontFamily: 'Helvetica-Bold' },
  colNombre: { flex: 3.2 },
  colCuit:   { flex: 1.8 },
  colTel:    { flex: 1.8 },
  colEmail:  { flex: 2.8 },
  colPresp:  { flex: 0.8, textAlign: 'center' },
  colTotal:  { flex: 2, textAlign: 'right' },
  footer: {
    position: 'absolute', bottom: 18, left: 36, right: 36,
    borderTopWidth: 0.5, borderTopColor: C.gray300,
    paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: C.gray500 },
})

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n)
}

interface Props {
  clientes: {
    razon_social:   string
    cuit:           string
    telefono:       string
    email:          string
    direccion:      string
    presupuestos:   unknown[]
    total_aprobado: number
  }[]
  fecha: string
}

export function ClientesPDFDoc({ clientes, fecha }: Props) {
  const totalAprobado = clientes.reduce((acc, c) => acc + c.total_aprobado, 0)
  const totalPresup   = clientes.reduce((acc, c) => acc + c.presupuestos.length, 0)

  return (
    <Document title="Listado de Clientes" author="Los Limones Creativos">
      <Page size="A4" orientation="landscape" style={ps.page}>

        <View style={ps.band} fixed>
          <View style={ps.bandTop}>
            <View>
              <Text style={ps.company}>Los Limones Creativos</Text>
              <Text style={ps.companySlug}>TRABAJOS EN ALTURA · FACHADAS · IMPERMEABILIZACIONES</Text>
            </View>
            <View>
              <Text style={ps.docTitle}>Clientes</Text>
              <Text style={ps.docDate}>Generado el {fecha}</Text>
            </View>
          </View>
          <View style={ps.kpiRow}>
            <View style={ps.kpiBox}>
              <Text style={ps.kpiLabel}>Total clientes</Text>
              <Text style={ps.kpiValue}>{clientes.length}</Text>
            </View>
            <View style={ps.kpiBox}>
              <Text style={ps.kpiLabel}>Presupuestos emitidos</Text>
              <Text style={ps.kpiValue}>{totalPresup}</Text>
            </View>
            <View style={ps.kpiBox}>
              <Text style={ps.kpiLabel}>Total aprobado</Text>
              <Text style={ps.kpiAccent}>{fmt(totalAprobado)}</Text>
            </View>
          </View>
        </View>

        <View style={ps.tableWrap}>
          <View style={ps.tableHeader}>
            <Text style={[ps.th, ps.colNombre]}>CLIENTE</Text>
            <Text style={[ps.th, ps.colCuit]}>CUIT</Text>
            <Text style={[ps.th, ps.colTel]}>TELÉFONO</Text>
            <Text style={[ps.th, ps.colEmail]}>EMAIL</Text>
            <Text style={[ps.th, ps.colPresp]}>PRES.</Text>
            <Text style={[ps.th, ps.colTotal]}>TOTAL APROBADO</Text>
          </View>
          {clientes.map((c, i) => (
            <View key={c.razon_social} style={[ps.row, i % 2 === 1 ? ps.rowAlt : {}]}>
              <View style={ps.colNombre}>
                <Text style={ps.tdBold}>{c.razon_social}</Text>
                {c.direccion ? <Text style={ps.tdSub}>{c.direccion}</Text> : null}
              </View>
              <Text style={[ps.td, ps.colCuit]}>{c.cuit || '—'}</Text>
              <Text style={[ps.td, ps.colTel]}>{c.telefono || '—'}</Text>
              <Text style={[ps.td, ps.colEmail]}>{c.email || '—'}</Text>
              <Text style={[ps.td, ps.colPresp]}>{c.presupuestos.length}</Text>
              <Text style={[ps.tdBold, ps.colTotal]}>
                {c.total_aprobado > 0 ? fmt(c.total_aprobado) : '—'}
              </Text>
            </View>
          ))}
        </View>

        <View style={ps.footer} fixed>
          <Text style={ps.footerText}>Los Limones Creativos · Listado de Clientes</Text>
          <Text style={ps.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
