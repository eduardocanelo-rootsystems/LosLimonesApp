import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Search, FileDown, FileSpreadsheet } from 'lucide-react'
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer'
import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'
import { usePresupuestos } from '@/pages/Presupuestos/usePresupuestos'
import type { Presupuesto } from '@/types/database'
import { cn } from '@/lib/utils'

const ESTADO_COLOR: Record<string, string> = {
  emitido:    'text-warning',
  aprobado:   'text-success',
  finalizado: 'text-ink-400',
  rechazado:  'text-danger',
}

interface ClienteAgregado {
  razon_social:  string
  cuit:          string
  telefono:      string
  email:         string
  direccion:     string
  administrador: string
  presupuestos:  Presupuesto[]
  total_aprobado: number
}

// ─── PDF ──────────────────────────────────────────────────────────────────────

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

  // Header banda negra
  band: {
    backgroundColor: C.black,
    paddingHorizontal: 36, paddingTop: 28, paddingBottom: 22,
    marginBottom: 20,
  },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  company: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.5 },
  companySlug: { fontSize: 7, color: C.gray500, letterSpacing: 2, marginTop: 2 },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.accent },
  docDate:  { fontSize: 8, color: C.gray500, marginTop: 3, textAlign: 'right' },

  // KPI row
  kpiRow: {
    flexDirection: 'row', gap: 10,
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 0.5, borderTopColor: '#2A2A2A',
  },
  kpiBox: {
    flex: 1, backgroundColor: '#1C1C1C',
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 8,
  },
  kpiLabel: { fontSize: 6.5, color: C.gray500, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  kpiValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white },
  kpiAccent: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.accent },

  // Tabla
  tableWrap: { paddingHorizontal: 36 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.gray100,
    paddingVertical: 6, paddingHorizontal: 8,
    borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: C.gray300,
  },
  th: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.gray500, letterSpacing: 0.8 },
  row: {
    flexDirection: 'row',
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderBottomColor: C.gray100,
  },
  rowAlt:    { backgroundColor: C.gray50 },
  td:        { fontSize: 8.5, color: C.black },
  tdSub:     { fontSize: 7, color: C.gray500, marginTop: 1.5 },
  tdBold:    { fontSize: 8.5, color: C.black, fontFamily: 'Helvetica-Bold' },
  colNombre: { flex: 3.2 },
  colCuit:   { flex: 1.8 },
  colTel:    { flex: 1.8 },
  colEmail:  { flex: 2.8 },
  colPresp:  { flex: 0.8, textAlign: 'center' },
  colTotal:  { flex: 2, textAlign: 'right' },

  // Footer
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

function ClientesPDFDoc({ clientes, fecha }: { clientes: ClienteAgregado[]; fecha: string }) {
  const totalAprobado = clientes.reduce((acc, c) => acc + c.total_aprobado, 0)
  const totalPresup   = clientes.reduce((acc, c) => acc + c.presupuestos.length, 0)

  return (
    <Document title="Listado de Clientes" author="Los Limones Creativos">
      <Page size="A4" orientation="landscape" style={ps.page}>

        {/* Banda de header */}
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

        {/* Tabla */}
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

// ─── Exportar Excel ───────────────────────────────────────────────────────────

function exportarExcel(clientes: ClienteAgregado[]) {
  const filas = clientes.map((c) => ({
    'Razón Social':       c.razon_social,
    'CUIT':               c.cuit,
    'Teléfono':           c.telefono,
    'Email':              c.email,
    'Dirección':          c.direccion,
    'Administrador':      c.administrador,
    'Cant. Presupuestos': c.presupuestos.length,
    'Total Aprobado':     c.total_aprobado,
  }))

  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = [
    { wch: 35 }, { wch: 16 }, { wch: 16 }, { wch: 30 },
    { wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 18 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
  XLSX.writeFile(wb, `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const navigate                        = useNavigate()
  const { data: todos = [], isLoading } = usePresupuestos()
  const [busqueda, setBusqueda]         = useState('')
  const [expandido, setExpandido]       = useState<string | null>(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  const clientes = useMemo((): ClienteAgregado[] => {
    const map = new Map<string, ClienteAgregado>()

    for (const p of todos) {
      if (!p.cliente_razon_social?.trim()) continue
      const key = p.cliente_razon_social.trim().toLowerCase()

      if (!map.has(key)) {
        map.set(key, {
          razon_social:   p.cliente_razon_social.trim(),
          cuit:           p.cliente_cuit          ?? '',
          telefono:       p.cliente_telefono      ?? '',
          email:          p.cliente_email         ?? '',
          direccion:      p.cliente_direccion     ?? '',
          administrador:  p.cliente_administrador ?? '',
          presupuestos:   [],
          total_aprobado: 0,
        })
      }

      const c = map.get(key)!
      c.presupuestos.push(p)

      if (p.estado === 'aprobado' || p.estado === 'finalizado') {
        c.total_aprobado += p.importe_total ?? 0
      }

      if (!c.cuit        && p.cliente_cuit)           c.cuit          = p.cliente_cuit
      if (!c.telefono    && p.cliente_telefono)        c.telefono      = p.cliente_telefono
      if (!c.email       && p.cliente_email)           c.email         = p.cliente_email
      if (!c.direccion   && p.cliente_direccion)       c.direccion     = p.cliente_direccion
      if (!c.administrador && p.cliente_administrador) c.administrador = p.cliente_administrador
    }

    return Array.from(map.values()).sort((a, b) =>
      a.razon_social.localeCompare(b.razon_social, 'es')
    )
  }, [todos])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) =>
      c.razon_social.toLowerCase().includes(q) ||
      c.cuit.toLowerCase().includes(q)         ||
      c.email.toLowerCase().includes(q)        ||
      c.telefono.includes(q)
    )
  }, [clientes, busqueda])

  const toggleExpandido = (key: string) =>
    setExpandido((prev) => (prev === key ? null : key))

  const descargarPDF = async () => {
    setGenerandoPDF(true)
    try {
      const fecha = new Date().toLocaleDateString('es-AR')
      const blob  = await pdf(<ClientesPDFDoc clientes={filtrados} fecha={fecha} />).toBlob()
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href      = url
      a.download  = `clientes_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGenerandoPDF(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Clientes" subtitle={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, CUIT, email o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-base w-full pl-9 sm:w-80"
          />
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => exportarExcel(filtrados)}
            disabled={filtrados.length === 0}
            className="btn-secondary disabled:opacity-40"
            title="Descargar Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
          <button
            type="button"
            onClick={descargarPDF}
            disabled={filtrados.length === 0 || generandoPDF}
            className="btn-secondary disabled:opacity-40"
            title="Descargar PDF"
          >
            <FileDown className="h-4 w-4" />
            {generandoPDF ? 'Generando…' : 'PDF'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-500">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-ink-500">
          {busqueda ? 'Sin resultados para esa búsqueda.' : 'Todavía no hay clientes registrados.'}
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-ink-800 bg-ink-900/50">
                  <th className="w-8" />
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Contacto</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-ink-400">Presupuestos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Total aprobado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filtrados.map((c) => {
                  const key      = c.razon_social.toLowerCase()
                  const abierto  = expandido === key
                  const ultPresp = c.presupuestos[0]

                  return (
                    <React.Fragment key={key}>
                      <tr
                        className="cursor-pointer hover:bg-ink-900/40 transition-colors"
                        onClick={() => toggleExpandido(key)}
                      >
                        <td className="pl-4 pr-0 py-3 text-ink-500">
                          {abierto
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink-100">{c.razon_social}</div>
                          {c.cuit      && <div className="text-xs text-ink-500 mt-0.5">CUIT {c.cuit}</div>}
                          {c.direccion && <div className="text-xs text-ink-500 mt-0.5 truncate max-w-[200px]">{c.direccion}</div>}
                        </td>
                        <td className="px-4 py-3">
                          {c.telefono      && <div className="text-ink-300">{c.telefono}</div>}
                          {c.email         && <div className="text-xs text-ink-500 mt-0.5">{c.email}</div>}
                          {c.administrador && <div className="text-xs text-ink-600 mt-0.5">Adm: {c.administrador}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-medium text-ink-200">{c.presupuestos.length}</span>
                          {ultPresp && (
                            <div className="text-xs text-ink-500 mt-0.5">último: #{ultPresp.numero ?? '—'}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {c.total_aprobado > 0
                            ? <span className="font-medium text-ink-100">{formatCurrency(c.total_aprobado)}</span>
                            : <span className="text-ink-600">—</span>}
                        </td>
                      </tr>

                      {abierto && (
                        <tr className="bg-ink-950/60">
                          <td colSpan={5} className="px-6 pb-4 pt-2">
                            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
                              Presupuestos de {c.razon_social}
                            </div>
                            <div className="space-y-1">
                              {c.presupuestos.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-ink-800/50 cursor-pointer transition-colors"
                                  onClick={(e) => { e.stopPropagation(); navigate(`/presupuestos/${p.id}`) }}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-ink-300 w-10">#{p.numero ?? '—'}</span>
                                    <span className={cn('text-xs font-medium capitalize', ESTADO_COLOR[p.estado] ?? 'text-ink-400')}>
                                      {p.estado}
                                    </span>
                                    {p.edif_m2 && <span className="text-xs text-ink-500">{p.edif_m2} m²</span>}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {p.importe_total && (
                                      <span className="font-mono text-xs text-ink-300">{formatCurrency(p.importe_total)}</span>
                                    )}
                                    <span className="text-xs text-ink-600">
                                      {new Date(p.fecha_creacion).toLocaleDateString('es-AR')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
