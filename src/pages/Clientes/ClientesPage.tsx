import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Search, FileDown, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { formatCurrency } from '@/lib/utils'
import { reloadOnStaleChunk } from '@/lib/chunkReload'
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
      const [{ pdf }, { ClientesPDFDoc }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ClientesPDF'),
      ])
      const blob  = await pdf(<ClientesPDFDoc clientes={filtrados} fecha={fecha} />).toBlob()
      const url   = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href      = url
      a.download  = `clientes_${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      reloadOnStaleChunk(err)
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
