import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PresupuestoCompleto, PresupuestoFoto } from '@/types/database'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(value)
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  black: '#111111',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  accent: '#B7FF00',
  white: '#FFFFFF',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  success: '#10B981',
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.black,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 45,
    backgroundColor: C.white,
  },

  watermark: {
    position: 'absolute',
    top: 260,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 88,
    fontFamily: 'Helvetica-Bold',
    color: '#E8E8E8',
    transform: 'rotate(-40deg)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  headerLeft: { flexDirection: 'column', gap: 2 },
  companyName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.5 },
  companySlug: { fontSize: 8, color: C.gray500, letterSpacing: 2 },
  headerRight: { alignItems: 'flex-end', gap: 3 },
  presupNumero: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.accent },
  presupFecha: { fontSize: 8, color: C.gray500 },
  estadoBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  vigenciaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.warningBg,
    borderWidth: 0.5,
    borderColor: C.warning,
    borderRadius: 4,
  },
  vigenciaText: { fontSize: 8, color: '#92400E' },
  vigenciaBold: { fontSize: 8, color: '#92400E', fontFamily: 'Helvetica-Bold' },

  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.gray500,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  sectionTitleExtra: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.warning,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.warning,
  },
  twoCol: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  fieldRow: { flexDirection: 'row', marginBottom: 3 },
  fieldLabel: { width: 90, color: C.gray500, fontSize: 8 },
  fieldValue: { flex: 1, color: C.black, fontSize: 8.5 },
  fieldValueBold: { flex: 1, color: C.black, fontSize: 8.5, fontFamily: 'Helvetica-Bold' },
  fieldMono: { flex: 1, color: C.gray700, fontSize: 8, fontFamily: 'Helvetica' },

  table: { marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.gray300,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  tableHeaderExtra: {
    flexDirection: 'row',
    backgroundColor: C.warningBg,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: C.warning,
    borderBottomWidth: 0.5,
    borderBottomColor: C.warning,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  tableRowAlt: { backgroundColor: C.gray50 },
  thText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.5 },
  thTextExtra: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.warning, letterSpacing: 0.5 },
  tdText: { fontSize: 8.5, color: C.black },
  tdMono: { fontSize: 8.5, color: C.gray700 },
  tdRight: { textAlign: 'right' },
  tdBold: { fontFamily: 'Helvetica-Bold' },

  colNombre: { flex: 4 },
  colPrecioM2: { flex: 2, textAlign: 'right' },
  colM2: { flex: 1.5, textAlign: 'right' },
  colSubtotal: { flex: 2, textAlign: 'right' },
  colMatNombre: { flex: 5 },
  colUnidad: { flex: 2, textAlign: 'right' },
  colPrecio: { flex: 2, textAlign: 'right' },
  colCantidad: { flex: 2, textAlign: 'right' },
  colMatSubtotal: { flex: 2, textAlign: 'right' },

  totalesBox: {
    marginTop: 12,
    marginLeft: 'auto',
    width: 260,
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  totalRowExtra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: C.warningBg,
    borderBottomWidth: 0.5,
    borderBottomColor: C.warning,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.accent,
  },
  totalLabel: { fontSize: 8.5, color: C.gray700 },
  totalLabelExtra: { fontSize: 8.5, color: '#92400E', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 8.5, color: C.black, fontFamily: 'Helvetica-Bold' },
  totalValueExtra: { fontSize: 8.5, color: '#92400E', fontFamily: 'Helvetica-Bold' },
  totalLabelFinal: { fontSize: 10, color: C.black, fontFamily: 'Helvetica-Bold' },
  totalValueFinal: { fontSize: 10, color: C.black, fontFamily: 'Helvetica-Bold' },
  descuentoValue: { fontSize: 8.5, color: C.warning, fontFamily: 'Helvetica-Bold' },

  finTable: {
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  finHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray300,
  },
  finRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray100,
  },
  finRowShaded: { backgroundColor: C.gray50 },
  finThText: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.5 },
  finTdText: { fontSize: 8.5, color: C.black },
  finTdMono: { fontSize: 8.5, color: C.gray700 },
  finTdBold: { fontFamily: 'Helvetica-Bold', color: C.black },
  finColPlan: { flex: 2.2 },
  finColRecargo: { flex: 0.8, textAlign: 'right' },
  finColTotal: { flex: 1.5, textAlign: 'right' },
  finColAnticipo: { flex: 1.5, textAlign: 'right' },
  finColCuotas: { flex: 2, textAlign: 'right' },
  finNote: { fontSize: 7.5, color: C.gray500, marginTop: 5 },

  logoImg: { height: 40, width: 120, objectFit: 'contain' },

  fotoRow: { flexDirection: 'row', marginBottom: 8 },
  fotoCell: { width: 248, height: 172, overflow: 'hidden', borderRadius: 3 },
  fotoCellRight: { marginLeft: 9 },
  fotoImg: { width: 248, height: 172, objectFit: 'cover' },

  obsBox: {
    backgroundColor: C.gray50,
    borderWidth: 0.5,
    borderColor: C.gray300,
    borderRadius: 4,
    padding: 10,
  },
  obsText: { fontSize: 8.5, color: C.gray700, lineHeight: 1.5 },

  firmaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 0.5,
    borderColor: C.accent,
    borderRadius: 4,
  },
  firmaLabel: { fontSize: 8.5, color: C.gray700 },
  firmaLink:  { fontSize: 8.5, color: C.accent, textDecoration: 'underline' },

  footer: {
    position: 'absolute',
    bottom: 20,
    left: 45,
    right: 45,
    borderTopWidth: 0.5,
    borderTopColor: C.gray300,
    paddingTop: 8,
    flexDirection: 'column',
    gap: 3,
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.gray500 },
  pageNumber: { fontSize: 7, color: C.gray500 },
  footerCredit: { fontSize: 6.5, color: C.gray300, textAlign: 'center' },
})

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Campo({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (!value && value !== 0) return null
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={mono ? s.fieldMono : s.fieldValue}>{String(value)}</Text>
    </View>
  )
}

function EstadoBadge({ estado }: { estado: string }) {
  const color = estado === 'aprobado' ? C.success : estado === 'finalizado' ? C.gray500 : C.warning
  const label = estado === 'aprobado' ? 'APROBADO' : estado === 'finalizado' ? 'FINALIZADO' : 'EMITIDO'
  return (
    <View style={[s.estadoBadge, { backgroundColor: color }]}>
      <Text style={{ color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold', letterSpacing: 1 }}>
        {label}
      </Text>
    </View>
  )
}

function TablaServicios({
  items,
  esExtra,
  totalManoObra = 0,
  totalMateriales = 0,
}: {
  items: PresupuestoCompleto['servicios']
  esExtra?: boolean
  totalManoObra?: number
  totalMateriales?: number
}) {
  if (items.length === 0) return null
  const th = esExtra ? s.thTextExtra : s.thText
  const header = esExtra ? s.tableHeaderExtra : s.tableHeader
  const totalSubtotalItems = items.reduce((acc, sv) => acc + Number(sv.subtotal), 0)
  return (
    <View style={s.table}>
      <View style={header}>
        <Text style={[th, s.colNombre]}>DESCRIPCIÓN</Text>
        <Text style={[th, s.colM2]}>m²</Text>
        <Text style={[th, s.colSubtotal]}>SUBTOTAL</Text>
      </View>
      {items.map((sv, i) => {
        const proporcion = totalSubtotalItems > 0 ? Number(sv.subtotal) / totalSubtotalItems : 0
        const subtotalDisplay = Number(sv.subtotal) + proporcion * (totalManoObra + totalMateriales)
        return (
          <View key={sv.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[s.tdText, s.colNombre]}>{sv.nombre_snapshot}</Text>
            <Text style={[s.tdMono, s.colM2, s.tdRight]}>{sv.m2_snapshot}</Text>
            <Text style={[s.tdMono, s.colSubtotal, s.tdRight, s.tdBold]}>{fmt(subtotalDisplay)}</Text>
          </View>
        )
      })}
    </View>
  )
}


const PLANES_FIN = [
  { value: 'contado', label: 'Contado (50/50)', recargo: 0 },
  { value: '60dias', label: 'Financiado a 60 días', recargo: 0.10 },
  { value: '90dias', label: 'Financiado a 90 días', recargo: 0.20 },
]

function TablaFinanciamiento({ total, planSeleccionado }: { total: number; planSeleccionado?: string | null }) {
  if (total <= 0) return null
  const anticipo = total * 0.5
  return (
    <View style={s.finTable} wrap={false}>
      <View style={s.finHeader}>
        <Text style={[s.finThText, s.finColPlan]}>PLAN</Text>
        <Text style={[s.finThText, s.finColTotal]}>TOTAL</Text>
        <Text style={[s.finThText, s.finColAnticipo]}>ANTICIPO</Text>
        <Text style={[s.finThText, s.finColCuotas]}>CUOTAS / SALDO</Text>
      </View>
      {PLANES_FIN.filter(({ value }) =>
        value === 'contado' || value === planSeleccionado
      ).map(({ label, recargo, value }) => {
        const saldo = anticipo * (1 + recargo)   // recargo solo sobre el 50% financiado
        const totalFinal = anticipo + saldo
        const cuotasLabel = recargo === 0 ? fmt(saldo) : `2 × ${fmt(saldo / 2)}`
        const isSelected = planSeleccionado === value
        return (
          <View key={label} style={[
            s.finRow,
            isSelected ? { backgroundColor: '#F5FFD6', borderLeftWidth: 3, borderLeftColor: '#5A7D00' } : {}
          ]}>
            <Text style={[s.finTdText, s.finColPlan, isSelected ? { fontFamily: 'Helvetica-Bold', color: C.black } : {}]}>
              {label}{isSelected ? ' ✓' : ''}
            </Text>
            <Text style={[s.finTdMono, s.finTdBold, s.finColTotal, isSelected ? { color: C.black } : {}]}>
              {fmt(totalFinal)}
            </Text>
            <Text style={[s.finTdMono, s.finColAnticipo]}>{fmt(anticipo)}</Text>
            <Text style={[s.finTdMono, s.finColCuotas]}>{cuotasLabel}</Text>
          </View>
        )
      })}
      <Text style={s.finNote}>
        * Anticipo: 50% del valor de contado en todos los planes.
      </Text>
    </View>
  )
}

// ─── Página del presupuesto (exportada para uso en documento combinado) ───────

export function PresupuestoPDFPage({
  presupuesto,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
}) {
  const serviciosOrig = presupuesto.servicios.filter((s) => !s.es_adicional)
  const serviciosExtra = presupuesto.servicios.filter((s) => s.es_adicional)
  const materialesOrig = presupuesto.materiales.filter((m) => !m.es_adicional)
  const materialesExtra = presupuesto.materiales.filter((m) => m.es_adicional)

  const subtotalServiciosOrig = serviciosOrig.reduce((acc, s) => acc + Number(s.subtotal), 0)
  const subtotalMaterialesOrig = materialesOrig.reduce((acc, m) => acc + Number(m.subtotal), 0)
  const subtotalServiciosExtra = serviciosExtra.reduce((acc, s) => acc + Number(s.subtotal), 0)
  const subtotalMaterialesExtra = materialesExtra.reduce((acc, m) => acc + Number(m.subtotal), 0)
  const extrasMonto = subtotalServiciosExtra + subtotalMaterialesExtra

  const diasGlobales = Number(presupuesto.dias_estimados_obra ?? 0)
  const subtotalManoObra = presupuesto.mano_obra.reduce(
    (acc, mo) => acc + mo.costo_diario_snapshot * mo.cantidad_empleados * (mo.dias ?? diasGlobales),
    0,
  )

  const subtotalBruto =
    subtotalServiciosOrig + subtotalMaterialesOrig + subtotalServiciosExtra + subtotalMaterialesExtra + subtotalManoObra

  const descuentoMonto = presupuesto.descuento_tipo
    ? presupuesto.descuento_tipo === 'fijo'
      ? Number(presupuesto.descuento_valor ?? 0)
      : (subtotalBruto * Number(presupuesto.descuento_valor ?? 0)) / 100
    : 0

  const neto = subtotalBruto - descuentoMonto
  const ivaMonto = (neto * Number(presupuesto.iva_pct)) / 100
  const total = neto + ivaMonto

  const tieneExtras = serviciosExtra.length > 0 || materialesExtra.length > 0
  const tieneDescuento = !!presupuesto.descuento_tipo && descuentoMonto > 0
  const tieneIva = Number(presupuesto.iva_pct) > 0
  const tieneDiagnostico = !!presupuesto.diagnostico_tecnico
  const tieneAlcance = !!presupuesto.alcance_obra
  const tieneExenciones = !!presupuesto.exenciones
  const tieneObs = !!presupuesto.observaciones
  const garantiaLabel = presupuesto.tiene_garantia === true
    ? `Con garantía · Vence el ${fmtDate(presupuesto.garantia_vencimiento)}`
    : presupuesto.tiene_garantia === false
      ? 'Sin garantía'
      : null
  const mostrarVigencia  = presupuesto.estado === 'emitido' && !!presupuesto.fecha_creacion
  const mostrarMarcaAgua = presupuesto.estado === 'aprobado' || presupuesto.estado === 'finalizado' || presupuesto.estado === 'rechazado'

  const edifAcabado = Array.isArray(presupuesto.edif_acabado)
    ? (presupuesto.edif_acabado as string[]).join(', ')
    : ''

  return (
    <Page size="A4" style={s.page}>
      {mostrarMarcaAgua && (
        <Text style={s.watermark} fixed>
          {presupuesto.estado === 'aprobado' ? 'APROBADO' : presupuesto.estado === 'rechazado' ? 'RECHAZADO' : 'FINALIZADO'}
        </Text>
      )}

      <View style={s.header}>
        <View style={s.headerLeft}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoImg} />
            : <Text style={s.companyName}>Limones - Rope Access</Text>
          }
          <Text style={s.companySlug}>Trabajos en altura - Fachadas - Impermeabilizaciones</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.presupNumero}>{presupuesto.numero ?? 'NUEVO'}</Text>
          <Text style={s.presupFecha}>Emisión: {fmtDate(presupuesto.fecha_creacion)}</Text>
          {presupuesto.fecha_aprobacion && (
            <Text style={s.presupFecha}>Aprobación: {fmtDate(presupuesto.fecha_aprobacion)}</Text>
          )}
          <EstadoBadge estado={presupuesto.estado} />
        </View>
      </View>

      {mostrarVigencia && (
        <View style={s.vigenciaBox}>
          <Text style={s.vigenciaText}>Válido hasta el </Text>
          <Text style={s.vigenciaBold}>{fmtDate(addDays(presupuesto.fecha_creacion, 15))}</Text>
          <Text style={s.vigenciaText}> (15 días desde la emisión)</Text>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionTitle}>Datos del cliente</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <Campo label="Razón social" value={presupuesto.cliente_razon_social} />
            <Campo label="CUIT" value={presupuesto.cliente_cuit} mono />
            <Campo label="Teléfono" value={presupuesto.cliente_telefono} />
            <Campo label="Email" value={presupuesto.cliente_email} />
          </View>
          <View style={s.col}>
            <Campo label="Dirección" value={presupuesto.cliente_direccion} />
            <Campo label="Administrador" value={presupuesto.cliente_administrador} />
            <Campo label="CUIT admin." value={presupuesto.cliente_administrador_cuit} mono />
          </View>
        </View>
      </View>

      {(presupuesto.edif_m2 || presupuesto.edif_anios || presupuesto.edif_tipologia) && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Características del edificio</Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              {presupuesto.edif_m2 && (
                <View style={s.fieldRow}>
                  <Text style={s.fieldLabel}>Superficie fachada</Text>
                  <Text style={s.fieldValueBold}>{presupuesto.edif_m2} m²</Text>
                </View>
              )}
              <Campo label="Antigüedad" value={presupuesto.edif_anios ? `${presupuesto.edif_anios} años` : null} />
              <Campo label="Altura" value={presupuesto.edif_altura ? `${presupuesto.edif_altura} m` : null} />
              <Campo label="Color / terminación" value={presupuesto.edif_color} />
              {edifAcabado && <Campo label="Acabados" value={edifAcabado} />}
            </View>
            <View style={s.col}>
              <Campo label="Tipología" value={presupuesto.edif_tipologia} />
              <Campo label="Clase incendio" value={presupuesto.edif_clase_incendio?.toUpperCase()} />
              <Campo label="Condición estr." value={presupuesto.edif_condicion_estructural} />
              {presupuesto.edif_valor_patrimonial && (
                <Campo label="Valor patrimonial" value={presupuesto.edif_proteccion ?? 'Sí'} />
              )}
              {presupuesto.coef_k && presupuesto.coef_k !== 1 && (
                <Campo label="Coef. K (altura)" value={`×${presupuesto.coef_k}`} />
              )}
            </View>
          </View>
        </View>
      )}

      {serviciosOrig.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Servicios</Text>
          <TablaServicios items={serviciosOrig} totalManoObra={subtotalManoObra} totalMateriales={subtotalMaterialesOrig} />
        </View>
      )}

      {tieneExtras && (
        <View style={s.section}>
          <Text style={s.sectionTitleExtra}>Trabajos adicionales</Text>
          {serviciosExtra.length > 0 && (
            <TablaServicios items={serviciosExtra} esExtra totalMateriales={subtotalMaterialesExtra} />
          )}
        </View>
      )}

      <View style={s.totalesBox} wrap={false}>
        {serviciosOrig.length > 0 && (
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal servicios</Text>
            <Text style={s.totalValue}>{fmt(subtotalServiciosOrig + subtotalManoObra + subtotalMaterialesOrig)}</Text>
          </View>
        )}
        {tieneExtras && (
          <View style={s.totalRowExtra}>
            <Text style={s.totalLabelExtra}>Adicionales</Text>
            <Text style={s.totalValueExtra}>{fmt(extrasMonto)}</Text>
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

      {total > 0 && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Opciones de financiamiento</Text>
          <TablaFinanciamiento total={total} planSeleccionado={presupuesto.plan_pago} />
        </View>
      )}

      {garantiaLabel && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={[s.sectionTitle, { textTransform: 'none' }]}>Garantía</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{garantiaLabel}</Text>
          </View>
        </View>
      )}

      {tieneDiagnostico && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={[s.sectionTitle, { textTransform: 'none' }]}>Diagnóstico Técnico - Procedimientos</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{presupuesto.diagnostico_tecnico}</Text>
          </View>
        </View>
      )}

      {tieneAlcance && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={[s.sectionTitle, { textTransform: 'none' }]}>Alcance de la Obra</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{presupuesto.alcance_obra}</Text>
          </View>
        </View>
      )}

      {tieneExenciones && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={[s.sectionTitle, { textTransform: 'none' }]}>Exenciones</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{presupuesto.exenciones}</Text>
          </View>
        </View>
      )}

      {tieneObs && (
        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Observaciones</Text>
          <View style={s.obsBox}>
            <Text style={s.obsText}>{presupuesto.observaciones}</Text>
          </View>
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

// ─── Página de fotos ─────────────────────────────────────────────────────────

export function PaginaFotos({
  presupuesto,
  fotos,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  fotos: PresupuestoFoto[]
  logoUrl?: string | null
}) {
  if (fotos.length === 0) return null

  const rows: PresupuestoFoto[][] = []
  for (let i = 0; i < fotos.length; i += 2) rows.push(fotos.slice(i, i + 2))

  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          {logoUrl
            ? <Image src={logoUrl} style={s.logoImg} />
            : <Text style={s.companyName}>Limones - Rope Access</Text>
          }
          <Text style={s.companySlug}>Trabajos en altura - Fachadas - Impermeabilizaciones</Text>
        </View>
        <View style={s.headerRight}>
          <Text style={s.presupNumero}>{presupuesto.numero ?? '—'}</Text>
        </View>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Memoria fotográfica</Text>
        {rows.map((row, ri) => (
          <View key={ri} style={s.fotoRow}>
            {row.map((foto, fi) => (
              <View key={foto.id} style={[s.fotoCell, fi > 0 ? s.fotoCellRight : {}]}>
                <Image src={foto.imagen_base64} style={s.fotoImg} />
              </View>
            ))}
          </View>
        ))}
      </View>

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

// ─── Documento standalone ────────────────────────────────────────────────────

export function PresupuestoPDFDocument({
  presupuesto,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
}) {
  return (
    <Document title={`Presupuesto ${presupuesto.numero ?? ''}`} author="Limones - Rope Access">
      <PresupuestoPDFPage presupuesto={presupuesto} logoUrl={logoUrl} />
      {presupuesto.fotos?.length > 0 && (
        <PaginaFotos presupuesto={presupuesto} fotos={presupuesto.fotos} logoUrl={logoUrl} />
      )}
    </Document>
  )
}
