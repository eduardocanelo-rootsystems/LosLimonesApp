import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PresupuestoCompleto } from '@/types/database'

function fmt(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
  }).format(value)
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString()
}

const C = {
  black: '#111111', gray700: '#374151', gray500: '#6B7280',
  gray300: '#D1D5DB', gray100: '#F3F4F6', gray50: '#F9FAFB',
  accent: '#B7FF00', white: '#FFFFFF', warning: '#F59E0B', warningBg: '#FFFBEB',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', fontSize: 9, color: C.black,
    paddingTop: 40, paddingBottom: 50, paddingHorizontal: 45, backgroundColor: C.white,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 20, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: C.accent,
  },
  headerLeft: { flexDirection: 'column', gap: 2 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.5 },
  companySlug: { fontSize: 8, color: C.gray500, letterSpacing: 2 },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  presupNumero: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.accent },
  presupFecha: { fontSize: 8, color: C.gray500 },
  badge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  logoImg: { height: 40, width: 120, objectFit: 'contain' },

  vigenciaBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 14, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: C.warningBg, borderWidth: 0.5, borderColor: C.warning, borderRadius: 4,
  },
  vigenciaText: { fontSize: 8, color: '#92400E' },
  vigenciaBold: { fontSize: 8, color: '#92400E', fontFamily: 'Helvetica-Bold' },

  obraMenorBadge: {
    marginBottom: 14, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: '#F0FFF4', borderWidth: 0.5, borderColor: C.accent, borderRadius: 4,
    alignSelf: 'flex-start',
  },
  obraMenorBadgeText: { fontSize: 7.5, color: '#166534', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray500,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 6, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: C.gray300,
  },
  twoCol: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },
  fieldRow: { flexDirection: 'row', marginBottom: 3 },
  fieldLabel: { width: 90, color: C.gray500, fontSize: 8 },
  fieldValue: { flex: 1, color: C.black, fontSize: 8.5 },

  descBox: {
    backgroundColor: C.gray50, borderWidth: 0.5, borderColor: C.gray300,
    borderRadius: 4, padding: 10,
  },
  descText: { fontSize: 8.5, color: C.gray700, lineHeight: 1.5 },

  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: C.gray100,
    paddingVertical: 5, paddingHorizontal: 8,
    borderTopWidth: 0.5, borderTopColor: C.gray300,
    borderBottomWidth: 0.5, borderBottomColor: C.gray300,
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderBottomColor: C.gray100,
  },
  tableRowAlt: { backgroundColor: C.gray50 },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.5 },
  tdText: { fontSize: 8.5, color: C.black },
  tdMono: { fontSize: 8.5, color: C.gray700 },
  tdRight: { textAlign: 'right' },
  tdBold: { fontFamily: 'Helvetica-Bold' },
  colDesc: { flex: 5 },
  colPrecio: { flex: 2, textAlign: 'right' },
  colCant: { flex: 1.5, textAlign: 'right' },
  colSubtotal: { flex: 2, textAlign: 'right' },

  totalesBox: {
    marginTop: 12, marginLeft: 'auto', width: 260,
    borderWidth: 0.5, borderColor: C.gray300, borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: C.gray100,
  },
  totalRowFinal: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.accent,
  },
  totalLabel: { fontSize: 8.5, color: C.gray700 },
  totalValue: { fontSize: 8.5, color: C.black, fontFamily: 'Helvetica-Bold' },
  totalLabelFinal: { fontSize: 10, color: C.black, fontFamily: 'Helvetica-Bold' },
  totalValueFinal: { fontSize: 10, color: C.black, fontFamily: 'Helvetica-Bold' },
  descuentoValue: { fontSize: 8.5, color: C.warning, fontFamily: 'Helvetica-Bold' },

  finTable: {
    borderWidth: 0.5, borderColor: C.gray300, borderRadius: 3,
    overflow: 'hidden', marginTop: 4,
  },
  finHeader: {
    flexDirection: 'row', backgroundColor: C.gray100,
    paddingHorizontal: 10, paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: C.gray300,
  },
  finRow: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: C.gray100,
  },
  finThText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.5 },
  finTdText: { fontSize: 8.5, color: C.black },
  finTdMono: { fontSize: 8.5, color: C.gray700 },
  finTdBold: { fontFamily: 'Helvetica-Bold', color: C.black },
  finColPlan: { flex: 2.2 }, finColTotal: { flex: 1.5, textAlign: 'right' },
  finColAnticipo: { flex: 1.5, textAlign: 'right' }, finColCuotas: { flex: 2, textAlign: 'right' },
  finNote: { fontSize: 7.5, color: C.gray500, marginTop: 5 },

  obsBox: {
    backgroundColor: C.gray50, borderWidth: 0.5, borderColor: C.gray300,
    borderRadius: 4, padding: 10,
  },
  obsText: { fontSize: 8.5, color: C.gray700, lineHeight: 1.5 },

  footer: {
    position: 'absolute', bottom: 20, left: 45, right: 45,
    borderTopWidth: 0.5, borderTopColor: C.gray300,
    paddingTop: 8, flexDirection: 'column', gap: 3,
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.gray500 },
  pageNumber: { fontSize: 7, color: C.gray500 },
  footerCredit: { fontSize: 6.5, color: C.gray300, textAlign: 'center' },
})

const PLANES_FIN = [
  { value: 'contado', label: 'Contado (50/50)', recargo: 0 },
  { value: '60dias', label: 'Financiado a 60 días', recargo: 0.10 },
  { value: '90dias', label: 'Financiado a 90 días', recargo: 0.20 },
]

export function ObraMenorPDFPage({
  presupuesto,
  logoUrl,
  montoMinimo,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
  montoMinimo: number | null
}) {
  const diasGlobales = Number(presupuesto.dias_estimados_obra ?? 0)
  const subtotalManoObra = presupuesto.mano_obra.reduce(
    (acc, mo) => acc + mo.costo_diario_snapshot * mo.cantidad_empleados * (mo.dias ?? diasGlobales),
    0,
  )
  const subtotalMateriales = presupuesto.materiales
    .filter((m) => !m.es_adicional)
    .reduce((acc, m) => acc + Number(m.subtotal), 0)
  const subtotalItems = presupuesto.items
    .filter((i) => !i.es_adicional)
    .reduce((acc, i) => acc + Number(i.subtotal), 0)
  const subtotalItemsExtra = presupuesto.items
    .filter((i) => i.es_adicional)
    .reduce((acc, i) => acc + Number(i.subtotal), 0)

  const bruto = subtotalItems + subtotalMateriales
  const descuentoMonto = presupuesto.descuento_tipo
    ? presupuesto.descuento_tipo === 'fijo'
      ? Number(presupuesto.descuento_valor ?? 0)
      : (bruto * Number(presupuesto.descuento_valor ?? 0)) / 100
    : 0
  const neto = bruto - descuentoMonto
  const ivaMonto = (neto * Number(presupuesto.iva_pct)) / 100
  const totalCalculado = neto + ivaMonto + subtotalManoObra
  const total = montoMinimo != null ? Math.max(totalCalculado, montoMinimo) : totalCalculado

  const tieneDescuento = !!presupuesto.descuento_tipo && descuentoMonto > 0
  const tieneIva = Number(presupuesto.iva_pct) > 0
  const tieneExtras = subtotalItemsExtra > 0
  const mostrarVigencia = presupuesto.estado === 'emitido' && !!presupuesto.fecha_creacion
  const mostrarMarcaAgua = ['aprobado', 'finalizado', 'rechazado'].includes(presupuesto.estado)
  const garantiaLabel = presupuesto.tiene_garantia === true
    ? `Con garantía · Vence el ${fmtDate(presupuesto.garantia_vencimiento)}`
    : presupuesto.tiene_garantia === false ? 'Sin garantía' : null

  // Distribución proporcional de MO y materiales en ítems
  const totalSubtotalItems = subtotalItems || 1
  const itemsConDistribucion = presupuesto.items.filter((i) => !i.es_adicional).map((i) => {
    const proporcion = Number(i.subtotal) / totalSubtotalItems
    return {
      ...i,
      subtotalDisplay: Number(i.subtotal) + proporcion * (subtotalManoObra + subtotalMateriales),
    }
  })

  const itemsExtra = presupuesto.items.filter((i) => i.es_adicional)

  return (
    <Page size="A4" style={s.page}>
      {mostrarMarcaAgua && (
        <Text style={{
          position: 'absolute', top: 260, left: 0, right: 0,
          textAlign: 'center', fontSize: 88, fontFamily: 'Helvetica-Bold',
          color: '#E8E8E8', transform: 'rotate(-40deg)',
        }} fixed>
          {presupuesto.estado === 'aprobado' ? 'APROBADO' : presupuesto.estado === 'rechazado' ? 'RECHAZADO' : 'FINALIZADO'}
        </Text>
      )}

      <View style={s.header}>
        <View style={s.headerLeft}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoImg} />
            : <Text style={s.companyName}>Limones - Rope Access</Text>}
          <Text style={s.companySlug}>Trabajos en altura - Fachadas - Impermeabilizaciones</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.presupNumero}>{presupuesto.numero ?? 'NUEVO'}</Text>
          <Text style={s.presupFecha}>Emisión: {fmtDate(presupuesto.fecha_creacion)}</Text>
          {presupuesto.fecha_aprobacion && (
            <Text style={s.presupFecha}>Aprobación: {fmtDate(presupuesto.fecha_aprobacion)}</Text>
          )}
          <View style={[s.badge, {
            backgroundColor: presupuesto.estado === 'aprobado' ? '#10B981'
              : presupuesto.estado === 'finalizado' ? C.gray500 : C.warning
          }]}>
            <Text style={{ color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1 }}>
              {presupuesto.estado === 'aprobado' ? 'APROBADO' : presupuesto.estado === 'finalizado' ? 'FINALIZADO' : 'EMITIDO'}
            </Text>
          </View>
        </View>
      </View>

      <View style={s.obraMenorBadge}>
        <Text style={s.obraMenorBadgeText}>OBRA MENOR</Text>
      </View>

      {mostrarVigencia && (
        <View style={s.vigenciaBox}>
          <Text style={s.vigenciaText}>Válido hasta el </Text>
          <Text style={s.vigenciaBold}>{fmtDate(addDays(presupuesto.fecha_creacion, 15))}</Text>
          <Text style={s.vigenciaText}> (15 días desde la emisión)</Text>
        </View>
      )}

      {/* Cliente */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Datos del cliente</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            {presupuesto.cliente_razon_social && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Razón social</Text>
                <Text style={s.fieldValue}>{presupuesto.cliente_razon_social}</Text>
              </View>
            )}
            {presupuesto.cliente_cuit && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>CUIT</Text>
                <Text style={s.fieldValue}>{presupuesto.cliente_cuit}</Text>
              </View>
            )}
            {presupuesto.cliente_telefono && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Teléfono</Text>
                <Text style={s.fieldValue}>{presupuesto.cliente_telefono}</Text>
              </View>
            )}
          </View>
          <View style={s.col}>
            {presupuesto.cliente_direccion && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Dirección</Text>
                <Text style={s.fieldValue}>{presupuesto.cliente_direccion}</Text>
              </View>
            )}
            {presupuesto.cliente_administrador && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Administrador</Text>
                <Text style={s.fieldValue}>{presupuesto.cliente_administrador}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Descripción */}
      {presupuesto.diagnostico_tecnico && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descripción del trabajo</Text>
          <View style={s.descBox}>
            <Text style={s.descText}>{presupuesto.diagnostico_tecnico}</Text>
          </View>
        </View>
      )}

      {/* Servicios */}
      {itemsConDistribucion.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Servicios</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.thText, s.colDesc]}>DESCRIPCIÓN</Text>
              <Text style={[s.thText, s.colCant]}>CANT.</Text>
              <Text style={[s.thText, s.colSubtotal]}>SUBTOTAL</Text>
            </View>
            {itemsConDistribucion.map((item, i) => (
              <View key={item.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tdText, s.colDesc]}>{item.nombre_snapshot}</Text>
                <Text style={[s.tdMono, s.colCant, s.tdRight]}>{item.cantidad}</Text>
                <Text style={[s.tdMono, s.colSubtotal, s.tdRight, s.tdBold]}>{fmt(item.subtotalDisplay)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Adicionales */}
      {tieneExtras && itemsExtra.length > 0 && (
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: C.warning, borderBottomColor: C.warning }]}>Trabajos adicionales</Text>
          <View style={s.table}>
            <View style={[s.tableHeader, { backgroundColor: C.warningBg, borderColor: C.warning }]}>
              <Text style={[s.thText, s.colDesc, { color: C.warning }]}>DESCRIPCIÓN</Text>
              <Text style={[s.thText, s.colCant, { color: C.warning }]}>CANT.</Text>
              <Text style={[s.thText, s.colSubtotal, { color: C.warning }]}>SUBTOTAL</Text>
            </View>
            {itemsExtra.map((item, i) => (
              <View key={item.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <Text style={[s.tdText, s.colDesc]}>{item.nombre_snapshot}</Text>
                <Text style={[s.tdMono, s.colCant, s.tdRight]}>{item.cantidad}</Text>
                <Text style={[s.tdMono, s.colSubtotal, s.tdRight, s.tdBold]}>{fmt(Number(item.subtotal))}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Totales */}
      <View style={s.totalesBox} wrap={false}>
        {itemsConDistribucion.length > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal servicios</Text>
            <Text style={s.totalValue}>{fmt(subtotalItems + subtotalManoObra + subtotalMateriales)}</Text>
          </View>
        )}
        {tieneExtras && (
          <View style={s.totalRow}>
            <Text style={[s.totalLabel, { color: '#92400E', fontFamily: 'Helvetica-Bold' }]}>Adicionales</Text>
            <Text style={[s.totalValue, { color: '#92400E' }]}>{fmt(subtotalItemsExtra)}</Text>
          </View>
        )}
        {tieneDescuento && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>
              Descuento{presupuesto.descuento_tipo === 'porcentaje' ? ` (${presupuesto.descuento_valor}%)` : ''}
            </Text>
            <Text style={s.descuentoValue}>− {fmt(descuentoMonto)}</Text>
          </View>
        )}
        {(tieneDescuento || tieneExtras) && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Neto</Text>
            <Text style={s.totalValue}>{fmt(neto)}</Text>
          </View>
        )}
        {tieneIva && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA ({presupuesto.iva_pct}%)</Text>
            <Text style={s.totalValue}>{fmt(ivaMonto)}</Text>
          </View>
        )}
        <View style={s.totalRowFinal}>
          <Text style={s.totalLabelFinal}>TOTAL</Text>
          <Text style={s.totalValueFinal}>{fmt(total)}</Text>
        </View>
      </View>

      {/* Financiamiento */}
      {total > 0 && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Opciones de financiamiento</Text>
          <View style={s.finTable} wrap={false}>
            <View style={s.finHeader}>
              <Text style={[s.finThText, s.finColPlan]}>PLAN</Text>
              <Text style={[s.finThText, s.finColTotal]}>TOTAL</Text>
              <Text style={[s.finThText, s.finColAnticipo]}>ANTICIPO</Text>
              <Text style={[s.finThText, s.finColCuotas]}>CUOTAS / SALDO</Text>
            </View>
            {PLANES_FIN.filter(({ value }) => value === 'contado' || value === presupuesto.plan_pago).map(({ label, recargo, value }) => {
              const anticipo = total * 0.5
              const saldo = anticipo * (1 + recargo)
              const totalFin = anticipo + saldo
              const isSelected = presupuesto.plan_pago === value
              return (
                <View key={value} style={[s.finRow, isSelected ? { backgroundColor: '#F5FFD6', borderLeftWidth: 3, borderLeftColor: '#5A7D00' } : {}]}>
                  <Text style={[s.finTdText, s.finColPlan, isSelected ? { fontFamily: 'Helvetica-Bold' } : {}]}>
                    {label}{isSelected ? ' ✓' : ''}
                  </Text>
                  <Text style={[s.finTdMono, s.finTdBold, s.finColTotal]}>{fmt(totalFin)}</Text>
                  <Text style={[s.finTdMono, s.finColAnticipo]}>{fmt(anticipo)}</Text>
                  <Text style={[s.finTdMono, s.finColCuotas]}>
                    {recargo === 0 ? fmt(saldo) : `2 × ${fmt(saldo / 2)}`}
                  </Text>
                </View>
              )
            })}
            <Text style={s.finNote}>* Anticipo: 50% del valor de contado en todos los planes.</Text>
          </View>
        </View>
      )}

      {/* Garantía */}
      {garantiaLabel && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Garantía</Text>
          <View style={s.obsBox}><Text style={s.obsText}>{garantiaLabel}</Text></View>
        </View>
      )}

      {/* Observaciones */}
      {presupuesto.observaciones && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Observaciones</Text>
          <View style={s.obsBox}><Text style={s.obsText}>{presupuesto.observaciones}</Text></View>
        </View>
      )}

      <View style={s.footer} fixed>
        <View style={s.footerTop}>
          <Text style={s.footerText}>Limones - Rope Access · Trabajos en altura - Fachadas - Impermeabilizaciones</Text>
          <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
        <Text style={s.footerCredit}>Generado con Root Systems · Desarrollado por Eduardo Canelo</Text>
      </View>
    </Page>
  )
}

export function ObraMenorPDFDocument({
  presupuesto, logoUrl, montoMinimo,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
  montoMinimo: number | null
}) {
  return (
    <Document title={`Presupuesto Obra Menor ${presupuesto.numero ?? ''}`} author="Limones - Rope Access">
      <ObraMenorPDFPage presupuesto={presupuesto} logoUrl={logoUrl} montoMinimo={montoMinimo} />
    </Document>
  )
}
