import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Periodo, RangoFechas } from '@/components/shared/PeriodoSelector'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocioResumen {
  id:          string
  nombre:      string
  cuit:        string | null
  porcentaje:  number
  ventaNeta:   number
  compraNeta:  number
  poolBruto:   number
  retiros:     number
  neto:        number
}

export interface ResumenContadorData {
  periodo:        Periodo
  rango:          RangoFechas
  totalFacturado: number
  totalNcEmitido: number
  totalCobrado:   number
  pendienteCobro: number
  nFacturas:      number
  nNcs:           number
  totalCompras:   number
  nCompras:       number
  facturadoNeto:  number
  resultado:      number
  poolNeto:       number
  socios:         SocioResumen[]
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const C = {
  black:   '#0f172a',
  gray1:   '#334155',
  gray2:   '#64748b',
  gray3:   '#94a3b8',
  gray4:   '#e2e8f0',
  gray5:   '#f8fafc',
  accent:  '#4f46e5',
  green:   '#16a34a',
  red:     '#dc2626',
  white:   '#ffffff',
}

const s = StyleSheet.create({
  page:        { fontFamily: 'Helvetica', fontSize: 9, color: C.black, paddingHorizontal: 40, paddingVertical: 36 },

  // Header
  headerRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  company:     { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.black },
  docTitle:    { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent },
  periodLabel: { fontSize: 8, color: C.gray2, marginTop: 2 },
  genDate:     { fontSize: 7, color: C.gray3, textAlign: 'right', marginTop: 2 },
  divider:     { borderBottomWidth: 1, borderBottomColor: C.gray4, marginVertical: 10 },

  // Section
  sectionTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.gray2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, marginTop: 14 },

  // Summary table
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.gray5 },
  summaryLabel:  { color: C.gray1 },
  summaryValue:  { fontFamily: 'Helvetica-Bold', color: C.black },
  summaryTotal:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, backgroundColor: C.gray5, paddingHorizontal: 4, marginTop: 2 },
  summaryTotalLabel: { fontFamily: 'Helvetica-Bold', color: C.black },
  summaryTotalValue: { fontFamily: 'Helvetica-Bold', color: C.accent },

  // Grid table
  tableHeader:   { flexDirection: 'row', backgroundColor: C.gray4, paddingVertical: 4, paddingHorizontal: 4 },
  tableHeaderTxt:{ fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.gray1, textTransform: 'uppercase' },
  tableRow:      { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.gray5 },
  tableRowAlt:   { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.gray5, backgroundColor: C.gray5 },
  tableCell:     { color: C.gray1 },
  tableCellMono: { fontFamily: 'Helvetica', color: C.gray2, fontSize: 8 },
  tableCellBold: { fontFamily: 'Helvetica-Bold', color: C.black },
  right:         { textAlign: 'right' },

  // Result block
  resultBox:     { backgroundColor: C.gray5, borderRadius: 4, padding: 10, marginTop: 4 },
  resultRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  resultLabel:   { color: C.gray1 },
  resultValue:   { fontFamily: 'Helvetica-Bold' },
  resultFinal:   { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 4, borderTopWidth: 1, borderTopColor: C.gray4 },
  resultFinalLbl:{ fontFamily: 'Helvetica-Bold', fontSize: 10 },
  resultFinalVal:{ fontFamily: 'Helvetica-Bold', fontSize: 10 },

  // Footer
  footer:        { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footerTxt:     { fontSize: 7, color: C.gray3 },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIODO_LABEL: Record<Periodo, string> = {
  mes_actual:   'Mes actual',
  mes_anterior: 'Mes anterior',
  ultimos_3:    'Últimos 3 meses',
  ultimos_6:    'Últimos 6 meses',
  anio_actual:  'Este año',
  todo:         'Todo el historial',
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ResumenContadorPDF({ data }: { data: ResumenContadorData }) {
  const {
    periodo, rango,
    totalFacturado, totalNcEmitido, totalCobrado, pendienteCobro, nFacturas, nNcs,
    totalCompras, nCompras,
    facturadoNeto, resultado,
    poolNeto, socios,
  } = data

  const fechaGen = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const rangoLabel = rango.desde === '2000-01-01'
    ? 'Historial completo'
    : `${fmtFecha(rango.desde)} — ${fmtFecha(rango.hasta)}`

  return (
    <Document title={`Resumen Contador · ${PERIODO_LABEL[periodo]}`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.company}>Limones - Rope Access</Text>
            <Text style={s.periodLabel}>{PERIODO_LABEL[periodo]} · {rangoLabel}</Text>
          </View>
          <View>
            <Text style={s.docTitle}>Resumen Contable</Text>
            <Text style={s.genDate}>Generado: {fechaGen}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* ── VENTAS ── */}
        <Text style={s.sectionTitle}>Ingresos · Ventas</Text>

        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Facturación bruta ({nFacturas} comprobantes)</Text>
          <Text style={s.summaryValue}>${fmt(totalFacturado)}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Notas de crédito emitidas ({nNcs} NC)</Text>
          <Text style={[s.summaryValue, { color: C.red }]}>−${fmt(totalNcEmitido)}</Text>
        </View>
        <View style={s.summaryTotal}>
          <Text style={s.summaryTotalLabel}>Facturación neta</Text>
          <Text style={s.summaryTotalValue}>${fmt(facturadoNeto)}</Text>
        </View>

        <View style={[s.summaryRow, { marginTop: 6 }]}>
          <Text style={s.summaryLabel}>Cobrado</Text>
          <Text style={[s.summaryValue, { color: C.green }]}>${fmt(totalCobrado)}</Text>
        </View>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Pendiente de cobro</Text>
          <Text style={s.summaryValue}>${fmt(pendienteCobro)}</Text>
        </View>

        {/* Ventas por socio */}
        {socios.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 10, fontSize: 7.5 }]}>Detalle ventas por socio</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderTxt, { flex: 3 }]}>Socio</Text>
              <Text style={[s.tableHeaderTxt, { flex: 3 }]}>CUIT</Text>
              <Text style={[s.tableHeaderTxt, { flex: 2, textAlign: 'right' }]}>Ventas netas</Text>
            </View>
            {socios.map((soc, i) => (
              <View key={soc.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 3 }]}>{soc.nombre}</Text>
                <Text style={[s.tableCellMono, { flex: 3 }]}>{soc.cuit ?? 'Sin CUIT'}</Text>
                <Text style={[s.tableCellBold, { flex: 2, textAlign: 'right' }]}>${fmt(soc.ventaNeta)}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── COMPRAS ── */}
        <Text style={s.sectionTitle}>Egresos · Compras del Negocio</Text>

        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Total compras ({nCompras} comprobantes)</Text>
          <Text style={[s.summaryValue, { color: C.red }]}>−${fmt(totalCompras)}</Text>
        </View>

        {/* Compras por socio */}
        {socios.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 10, fontSize: 7.5 }]}>Detalle compras por socio</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderTxt, { flex: 3 }]}>Socio</Text>
              <Text style={[s.tableHeaderTxt, { flex: 3 }]}>CUIT</Text>
              <Text style={[s.tableHeaderTxt, { flex: 2, textAlign: 'right' }]}>Compras netas</Text>
            </View>
            {socios.map((soc, i) => (
              <View key={soc.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 3 }]}>{soc.nombre}</Text>
                <Text style={[s.tableCellMono, { flex: 3 }]}>{soc.cuit ?? 'Sin CUIT'}</Text>
                <Text style={[s.tableCellBold, { flex: 2, textAlign: 'right', color: C.red }]}>−${fmt(soc.compraNeta)}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── RESULTADO ── */}
        <Text style={s.sectionTitle}>Resultado del Período</Text>
        <View style={s.resultBox}>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Facturación neta</Text>
            <Text style={s.resultValue}>${fmt(facturadoNeto)}</Text>
          </View>
          <View style={s.resultRow}>
            <Text style={s.resultLabel}>Compras del negocio</Text>
            <Text style={[s.resultValue, { color: C.red }]}>−${fmt(totalCompras)}</Text>
          </View>
          <View style={s.resultFinal}>
            <Text style={s.resultFinalLbl}>Resultado bruto</Text>
            <Text style={[s.resultFinalVal, { color: resultado >= 0 ? C.green : C.red }]}>
              {resultado >= 0 ? '' : '−'}${fmt(Math.abs(resultado))}
            </Text>
          </View>
        </View>

        {/* ── DISTRIBUCIÓN POR SOCIO ── */}
        {socios.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Distribución por Socio</Text>
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderTxt, { flex: 3 }]}>Socio</Text>
              <Text style={[s.tableHeaderTxt, { flex: 1, textAlign: 'right' }]}>%</Text>
              <Text style={[s.tableHeaderTxt, { flex: 2, textAlign: 'right' }]}>Bruto</Text>
              <Text style={[s.tableHeaderTxt, { flex: 2, textAlign: 'right' }]}>Retiros</Text>
              <Text style={[s.tableHeaderTxt, { flex: 2, textAlign: 'right' }]}>Neto</Text>
            </View>
            {socios.map((soc, i) => (
              <View key={soc.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                <Text style={[s.tableCell, { flex: 3 }]}>{soc.nombre}</Text>
                <Text style={[s.tableCellMono, { flex: 1, textAlign: 'right' }]}>{soc.porcentaje}%</Text>
                <Text style={[s.tableCellBold, { flex: 2, textAlign: 'right' }]}>${fmt(soc.poolBruto)}</Text>
                <Text style={[s.tableCell, { flex: 2, textAlign: 'right', color: C.red }]}>
                  {soc.retiros > 0 ? `−$${fmt(soc.retiros)}` : '—'}
                </Text>
                <Text style={[s.tableCellBold, { flex: 2, textAlign: 'right', color: soc.neto >= 0 ? C.green : C.red }]}>
                  ${fmt(soc.neto)}
                </Text>
              </View>
            ))}
            <View style={[s.summaryRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.gray4 }]}>
              <Text style={[s.summaryLabel, { fontSize: 8 }]}>Pool neto de rentabilidad (base de distribución)</Text>
              <Text style={[s.summaryValue, { color: C.accent }]}>${fmt(poolNeto)}</Text>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>Limones - Rope Access · Sistema de gestión</Text>
          <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
