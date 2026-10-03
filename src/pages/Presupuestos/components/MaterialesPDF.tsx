import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { PresupuestoCompleto } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function fmt(v: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(v)
}

// ─── Paleta ───────────────────────────────────────────────────────────────────

const C = {
  black:   '#111111',
  gray700: '#374151',
  gray500: '#6B7280',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  white:   '#FFFFFF',
  accent:  '#B7FF00',
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    color:           C.black,
    paddingTop:      48,
    paddingBottom:   56,
    paddingHorizontal: 52,
    backgroundColor: C.white,
  },

  header: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'flex-end',
    paddingBottom:    10,
    marginBottom:     12,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLabel: { fontSize: 7, color: C.gray500, letterSpacing: 1.4, textTransform: 'uppercase' },
  logoImg: { height: 24, width: 72, objectFit: 'contain' },

  title: {
    fontSize:     14,
    fontFamily:   'Helvetica-Bold',
    textAlign:    'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  subtitle: { fontSize: 9, color: C.gray500, textAlign: 'center', marginBottom: 12 },

  infoBox: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    backgroundColor: C.gray100,
    borderRadius:    4,
    paddingHorizontal: 12,
    paddingVertical:   8,
    marginBottom:    16,
  },
  infoLabel: { fontSize: 7.5, color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: C.black, marginTop: 2 },

  sectionTitle: {
    fontSize:     8,
    fontFamily:   'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color:        C.gray500,
    marginBottom: 5,
    marginTop:    12,
  },

  table: {
    borderWidth:  0.5,
    borderColor:  C.gray200,
    borderRadius: 3,
    overflow:     'hidden',
  },
  thead: {
    flexDirection:   'row',
    backgroundColor: C.black,
  },
  theadCell: {
    fontSize:     7.5,
    fontFamily:   'Helvetica-Bold',
    color:        C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingVertical:   5,
    paddingHorizontal: 7,
  },
  trow: {
    flexDirection:   'row',
    borderTopWidth:  0.5,
    borderTopColor:  C.gray200,
  },
  trowAlt: { backgroundColor: C.gray100 },
  tcell: {
    fontSize:         9.5,
    paddingVertical:   5,
    paddingHorizontal: 7,
    color:            C.black,
  },
  tcellRight: { textAlign: 'right', fontFamily: 'Helvetica' },

  totalRow: {
    flexDirection:   'row',
    backgroundColor: C.black,
    marginTop:       2,
    borderRadius:    3,
    paddingVertical:   6,
    paddingHorizontal: 7,
  },
  totalLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.accent },

  footer: {
    position:         'absolute',
    bottom:           20,
    left:             52,
    right:            52,
    borderTopWidth:   0.5,
    borderTopColor:   C.gray200,
    paddingTop:       5,
    flexDirection:    'row',
    justifyContent:   'space-between',
  },
  footerText:   { fontSize: 7, color: C.gray500 },
  pageNumber:   { fontSize: 7, color: C.gray500 },

  b: { fontFamily: 'Helvetica-Bold' },
})

// ─── Columnas ─────────────────────────────────────────────────────────────────

const COL = {
  num:      { width: 24  },
  nombre:   { flex: 1    },
  unidad:   { width: 44  },
  cantidad: { width: 52  },
  precio:   { width: 80  },
  subtotal: { width: 88  },
}

function TableHeader() {
  return (
    <View style={s.thead}>
      <Text style={[s.theadCell, COL.num]}>#</Text>
      <Text style={[s.theadCell, COL.nombre]}>Material</Text>
      <Text style={[s.theadCell, COL.unidad]}>Unidad</Text>
      <Text style={[s.theadCell, COL.cantidad, { textAlign: 'right' }]}>Cant.</Text>
      <Text style={[s.theadCell, COL.precio, { textAlign: 'right' }]}>P. unitario</Text>
      <Text style={[s.theadCell, COL.subtotal, { textAlign: 'right' }]}>Subtotal</Text>
    </View>
  )
}

function TableRow({
  index,
  nombre,
  unidad,
  cantidad,
  precio,
  subtotal,
}: {
  index: number
  nombre: string
  unidad: string
  cantidad: number
  precio: number
  subtotal: number
}) {
  const isAlt = index % 2 === 1
  return (
    <View style={isAlt ? [s.trow, s.trowAlt] : s.trow}>
      <Text style={[s.tcell, COL.num, { color: C.gray500, fontSize: 8 }]}>{index + 1}</Text>
      <Text style={[s.tcell, COL.nombre]}>{nombre}</Text>
      <Text style={[s.tcell, COL.unidad, { color: C.gray700 }]}>{unidad}</Text>
      <Text style={[s.tcell, COL.cantidad, s.tcellRight]}>{cantidad % 1 === 0 ? cantidad.toFixed(0) : cantidad.toFixed(2)}</Text>
      <Text style={[s.tcell, COL.precio, s.tcellRight]}>{fmt(precio)}</Text>
      <Text style={[s.tcell, COL.subtotal, s.tcellRight, s.b]}>{fmt(subtotal)}</Text>
    </View>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function MaterialesPDFPage({
  presupuesto,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
}) {
  const normales   = presupuesto.materiales.filter((m) => !m.es_adicional)
  const adicionales = presupuesto.materiales.filter((m) => m.es_adicional)

  const totalNormales    = normales.reduce((s, m) => s + Number(m.subtotal), 0)
  const totalAdicionales = adicionales.reduce((s, m) => s + Number(m.subtotal), 0)
  const totalGeneral     = totalNormales + totalAdicionales

  return (
    <Page size="A4" style={s.page}>

      {/* Encabezado */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {logoUrl && <Image src={logoUrl} style={s.logoImg} />}
          <Text style={s.headerLabel}>Limones - Rope Access · Lista de materiales</Text>
        </View>
        <Text style={s.headerLabel}>Ref. {presupuesto.numero ?? '—'}</Text>
      </View>

      {/* Título */}
      <Text style={s.title}>Lista de Materiales</Text>
      <Text style={s.subtitle}>
        Detalle de materiales incluidos en el Presupuesto N.º {presupuesto.numero ?? '—'}
      </Text>

      {/* Info del presupuesto */}
      <View style={s.infoBox}>
        <View>
          <Text style={s.infoLabel}>Cliente</Text>
          <Text style={s.infoValue}>{presupuesto.cliente_razon_social || '—'}</Text>
        </View>
        <View>
          <Text style={s.infoLabel}>Dirección</Text>
          <Text style={s.infoValue}>{presupuesto.cliente_direccion || '—'}</Text>
        </View>
        <View>
          <Text style={s.infoLabel}>Fecha</Text>
          <Text style={s.infoValue}>{fmtShort(presupuesto.fecha_creacion)}</Text>
        </View>
        <View>
          <Text style={s.infoLabel}>Total materiales</Text>
          <Text style={[s.infoValue, { color: '#1a1a1a' }]}>{fmt(totalGeneral)}</Text>
        </View>
      </View>

      {/* Tabla — materiales normales */}
      {normales.length > 0 && (
        <>
          {adicionales.length > 0 && (
            <Text style={s.sectionTitle}>Materiales incluidos</Text>
          )}
          <View style={s.table}>
            <TableHeader />
            {normales.map((m, i) => (
              <TableRow
                key={m.id}
                index={i}
                nombre={m.nombre_snapshot}
                unidad={m.unidad_snapshot}
                cantidad={Number(m.cantidad)}
                precio={Number(m.precio_snapshot)}
                subtotal={Number(m.subtotal)}
              />
            ))}
          </View>
          {adicionales.length === 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total materiales</Text>
              <Text style={s.totalValue}>{fmt(totalNormales)}</Text>
            </View>
          )}
        </>
      )}

      {/* Tabla — adicionales */}
      {adicionales.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Materiales adicionales</Text>
          <View style={s.table}>
            <TableHeader />
            {adicionales.map((m, i) => (
              <TableRow
                key={m.id}
                index={i}
                nombre={m.nombre_snapshot}
                unidad={m.unidad_snapshot}
                cantidad={Number(m.cantidad)}
                precio={Number(m.precio_snapshot)}
                subtotal={Number(m.subtotal)}
              />
            ))}
          </View>

          {/* Subtotales cuando hay ambos */}
          {normales.length > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 24, marginTop: 6, paddingHorizontal: 7 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: C.gray500 }}>Materiales</Text>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{fmt(totalNormales)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 8, color: C.gray500 }}>Adicionales</Text>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{fmt(totalAdicionales)}</Text>
              </View>
            </View>
          )}

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total materiales</Text>
            <Text style={s.totalValue}>{fmt(totalGeneral)}</Text>
          </View>
        </>
      )}

      {presupuesto.materiales.length === 0 && (
        <Text style={{ fontSize: 10, color: C.gray500, textAlign: 'center', marginTop: 24 }}>
          Este presupuesto no tiene materiales cargados.
        </Text>
      )}

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          Limones - Rope Access · Lista de materiales · Ref. {presupuesto.numero ?? '—'}
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

export function MaterialesPDFDocument({
  presupuesto,
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  logoUrl?: string | null
}) {
  return (
    <Document
      title={`Materiales · ${presupuesto.numero ?? ''}`}
      author="Limones - Rope Access"
    >
      <MaterialesPDFPage presupuesto={presupuesto} logoUrl={logoUrl} />
    </Document>
  )
}
