import { useRef, useState } from 'react'
import { Upload, X, AlertTriangle, CheckCircle, FileSpreadsheet, ShieldCheck } from 'lucide-react'
import {
  parsearExcelArca,
  labelTipo,
  esNotaCredito,
  type FilaEmitida,
  type FilaRecibida,
  type TipoImport,
} from '@/lib/arcaParser'
import type { CuentaArca } from '@/hooks/useVentas'

export type FilaAny = FilaEmitida | FilaRecibida

export interface ResultadoImport {
  autoMatch: number
}

interface Props {
  tipo:       TipoImport
  cuentas:    CuentaArca[]
  onImportar: (filas: FilaAny[], cuenta: CuentaArca, cuitDelExcel: string) => Promise<ResultadoImport | void>
  onClose:    () => void
}

function fmtImporte(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ImportarExcelModal({ tipo, cuentas, onImportar, onClose }: Props) {
  const inputRef                       = useRef<HTMLInputElement>(null)
  const [filas, setFilas]              = useState<FilaAny[] | null>(null)
  const [errores, setErrores]          = useState<string[]>([])
  const [fileName, setFileName]        = useState('')
  const [loading, setLoading]          = useState(false)
  const [importOk, setImportOk]        = useState(false)
  const [importCount, setImportCount]  = useState(0)
  const [autoMatch, setAutoMatch]      = useState(0)
  const [importError, setImportError]  = useState('')
  const [cuitDetectado, setCuitDetectado] = useState<string | null>(null)

  // Cuenta que coincide con el CUIT del Excel
  const cuentaMatcheada = cuitDetectado
    ? cuentas.find((c) => c.cuit.replace(/-/g, '') === cuitDetectado)
    : null

  // Si no hay match automático, el usuario elige manualmente
  const [cuentaIdManual, setCuentaIdManual] = useState('')
  const cuentaManual = cuentas.find((c) => c.id === cuentaIdManual)

  // La cuenta efectiva: primero la que matchea por CUIT, si no la manual
  const cuentaEfectiva = cuentaMatcheada ?? cuentaManual

  async function handleFile(file: File) {
    setFilas(null)
    setErrores([])
    setImportError('')
    setImportOk(false)
    setCuitDetectado(null)
    setCuentaIdManual('')
    setFileName(file.name)
    try {
      const resultado = await parsearExcelArca(file, tipo)
      setFilas(resultado.filas as FilaAny[])
      setErrores(resultado.errores)
      setCuitDetectado(resultado.cuitDetectado)
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Error al leer el archivo.')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleImportar() {
    if (!filas || !cuentaEfectiva) return
    const cuitFinal = cuitDetectado ?? cuentaEfectiva.cuit.replace(/-/g, '')
    setLoading(true)
    setImportError('')
    try {
      const result = await onImportar(filas, cuentaEfectiva, cuitFinal)
      setImportCount(filas.length)
      setAutoMatch(result?.autoMatch ?? 0)
      setImportOk(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      setImportError(`Error al importar: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const titulo     = tipo === 'emitidos' ? 'Importar Comprobantes Emitidos' : 'Importar Comprobantes Recibidos'
  const ncs        = filas?.filter((f) => esNotaCredito(f.tipo_comprobante)) ?? []
  const totalBruto = filas?.reduce((s, f) => s + f.imp_total, 0) ?? 0
  const sinCuentas = cuentas.length === 0

  // Hay mismatch si detectamos CUIT pero no hay cuenta registrada para ese CUIT
  const cuitSinCuenta = cuitDetectado && !cuentaMatcheada

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-ink-700 bg-ink-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-700 px-6 py-4">
          <h2 className="text-base font-semibold text-ink-100">{titulo}</h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {importOk ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle className="h-12 w-12 text-accent-400" />
              <p className="text-lg font-medium text-ink-100">
                {importCount} comprobante{importCount !== 1 ? 's' : ''} importado{importCount !== 1 ? 's' : ''}
              </p>
              {autoMatch > 0 && (
                <p className="text-sm text-accent-400">
                  {autoMatch} nota{autoMatch !== 1 ? 's' : ''} de crédito asociada{autoMatch !== 1 ? 's' : ''} automáticamente.
                </p>
              )}
              <p className="text-sm text-ink-400">Los registros duplicados se actualizaron automáticamente.</p>
              <button onClick={onClose} className="btn-primary mt-2">Cerrar</button>
            </div>
          ) : (
            <>
              {/* Sin cuentas */}
              {sinCuentas && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-950/40 border border-amber-800 px-4 py-3 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  No hay cuentas ARCA configuradas. Andá a <strong className="mx-1">Configuración → Cuentas ARCA</strong> y agregá una primero.
                </div>
              )}

              {/* Drop zone */}
              <div
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-600 py-8 transition-colors hover:border-accent-500 hover:bg-ink-800/30"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-ink-500" />
                <p className="text-sm text-ink-300">
                  {fileName ? fileName : 'Arrastrá el archivo Excel o hacé click para seleccionarlo'}
                </p>
                <p className="text-xs text-ink-500">Excel exportado desde el portal ARCA (.xlsx)</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                    e.target.value = ''
                  }}
                />
              </div>

              {/* CUIT detectado del Excel */}
              {cuitDetectado && (
                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  cuentaMatcheada
                    ? 'border-green-800 bg-green-950/30 text-green-300'
                    : 'border-amber-800 bg-amber-950/30 text-amber-300'
                }`}>
                  <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-mono font-medium">{cuitDetectado}</span>
                    {cuentaMatcheada
                      ? <span className="ml-2 text-green-400">→ {cuentaMatcheada.nombre}</span>
                      : <span className="ml-2">— no hay cuenta registrada para este CUIT</span>
                    }
                  </div>
                </div>
              )}

              {/* Si el CUIT del Excel no tiene cuenta, dejar elegir manualmente */}
              {cuitSinCuenta && cuentas.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="min-w-[100px] text-sm text-ink-400">Asignar a</label>
                  <select
                    aria-label="Asignar a cuenta"
                    className="input flex-1"
                    value={cuentaIdManual}
                    onChange={(e) => setCuentaIdManual(e.target.value)}
                  >
                    <option value="">— elegir cuenta —</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.cuit}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Si hay más de una cuenta y no hay CUIT detectado */}
              {!cuitDetectado && cuentas.length > 1 && (
                <div className="flex items-center gap-3">
                  <label className="min-w-[100px] text-sm text-ink-400">Cuenta</label>
                  <select
                    aria-label="Cuenta"
                    className="input flex-1"
                    value={cuentaIdManual}
                    onChange={(e) => setCuentaIdManual(e.target.value)}
                  >
                    <option value="">— elegir cuenta —</option>
                    {cuentas.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} — {c.cuit}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cuenta única sin CUIT detectado */}
              {!cuitDetectado && cuentas.length === 1 && (
                <p className="text-xs text-ink-500">
                  Cuenta: <span className="text-ink-300">{cuentas[0].nombre} — {cuentas[0].cuit}</span>
                </p>
              )}

              {/* Errores */}
              {importError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-950/40 border border-red-800 px-4 py-3 text-sm text-red-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {importError}
                </div>
              )}
              {errores.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-950/40 border border-amber-800 px-4 py-3 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="space-y-1">
                    {errores.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                </div>
              )}

              {/* Preview */}
              {filas && filas.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">
                      {filas.length} comprobante{filas.length !== 1 ? 's' : ''}
                      {ncs.length > 0 && ` (${ncs.length} NC)`}
                    </span>
                    <span className="font-mono text-ink-200">Total: ${fmtImporte(totalBruto)}</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-ink-700">
                    <table className="w-full text-xs">
                      <thead className="bg-ink-800 text-ink-400">
                        <tr>
                          <th className="px-3 py-2 text-left">Fecha</th>
                          <th className="px-3 py-2 text-left">Tipo</th>
                          <th className="px-3 py-2 text-left">PV</th>
                          <th className="px-3 py-2 text-left">Número</th>
                          <th className="px-3 py-2 text-left">{tipo === 'emitidos' ? 'Cliente' : 'Proveedor'}</th>
                          <th className="px-3 py-2 text-right">Importe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-800">
                        {filas.slice(0, 50).map((f, i) => {
                          const isNC = esNotaCredito(f.tipo_comprobante)
                          return (
                            <tr key={i} className={isNC ? 'bg-amber-950/20 text-amber-300' : 'text-ink-300'}>
                              <td className="px-3 py-1.5 font-mono">{f.fecha_emision}</td>
                              <td className="px-3 py-1.5">{labelTipo(f.tipo_comprobante)}</td>
                              <td className="px-3 py-1.5 font-mono">{f.punto_venta}</td>
                              <td className="px-3 py-1.5 font-mono">{f.numero}</td>
                              <td className="px-3 py-1.5 max-w-[180px] truncate">{f.denominacion}</td>
                              <td className="px-3 py-1.5 text-right font-mono">
                                {isNC ? '−' : ''}${fmtImporte(f.imp_total)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filas.length > 50 && (
                      <p className="px-3 py-2 text-center text-xs text-ink-500">
                        Mostrando 50 de {filas.length} filas
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!importOk && (
          <div className="flex items-center justify-end gap-3 border-t border-ink-700 px-6 py-4">
            <button onClick={onClose} className="btn-ghost">Cancelar</button>
            <button
              onClick={handleImportar}
              disabled={!filas || filas.length === 0 || loading || !cuentaEfectiva}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Importando…' : `Importar${filas ? ` ${filas.length}` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
