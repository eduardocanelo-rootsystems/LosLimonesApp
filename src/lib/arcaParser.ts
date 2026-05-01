import * as XLSX from 'xlsx'

// ─── Tipos de NC (notas de crédito) ──────────────────────────────────────────
export const TIPOS_NC = ['3', '8', '13', '53']

// Mapeo de descripciones de texto que usa ARCA en los Excel exportados → código AFIP
const TIPO_CODES: Record<string, string> = {
  'factura a': '1',          'nota de debito a': '2',  'nota de credito a': '3',
  'factura b': '6',          'nota de debito b': '7',  'nota de credito b': '8',
  'factura c': '11',         'nota de debito c': '12', 'nota de credito c': '13',
  'factura m': '51',         'nota de debito m': '52', 'nota de credito m': '53',
  'factura e': '19',         'nota de debito e': '20', 'nota de credito e': '21',
  'recibo a': '4',           'recibo b': '9',
  'liquidacion a': '63',     'liquidacion b': '64',    'liquidacion c': '65',
  'comprobante a': '201',    'comprobante b': '206',   'comprobante c': '211',
}

function normalizarTipoTexto(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

// ─── Columnas requeridas por ARCA ─────────────────────────────────────────────

// Nombres reales de columnas en el Excel exportado por ARCA.
// El archivo tiene una fila de título ("Mis Comprobantes...") antes de los headers.
const COLS_EMITIDOS: Record<string, string> = {
  'Fecha':                  'fecha_emision',
  'Tipo':                   'tipo_comprobante',
  'Punto de Venta':         'punto_venta',
  'Número Desde':           'numero',
  'Cód. Autorización':      'cae',
  'Denominación Receptor':  'denominacion',
  'Nro. Doc. Receptor':     'cuit_receptor',
  'Imp. Total':             'imp_total',
}

const COLS_RECIBIDOS: Record<string, string> = {
  'Fecha':                  'fecha_emision',
  'Tipo':                   'tipo_comprobante',
  'Punto de Venta':         'punto_venta',
  'Número Desde':           'numero',
  'Denominación Emisor':    'denominacion',
  'Nro. Doc. Emisor':       'cuit_emisor',
  'Imp. Total':             'imp_total',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Normaliza un nombre de columna: quita tildes, espacios extra, lowercase
function normalizarCol(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // quita tildes
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// Construye mapa normalizado → clave original
function buildNormalizedMap(cols: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const original of Object.keys(cols)) {
    map[normalizarCol(original)] = original
  }
  return map
}

// Parsea importe argentino: "1.234.567,89" → 1234567.89
function parseImporte(raw: unknown): number {
  if (typeof raw === 'number') return raw
  const s = String(raw ?? '').trim()
  // Formato argentino: puntos como miles, coma como decimal
  const limpio = s.replace(/\./g, '').replace(',', '.')
  return parseFloat(limpio) || 0
}

// Parsea fecha DD/MM/YYYY o número de serie de Excel → YYYY-MM-DD
function parseFecha(raw: unknown): string {
  if (!raw) return ''
  // Número de serie de Excel
  if (typeof raw === 'number') {
    const date = XLSX.SSF.parse_date_code(raw)
    const y = date.y
    const m = String(date.m).padStart(2, '0')
    const d = String(date.d).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const s = String(raw).trim()
  // DD/MM/YYYY
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  // Ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return s
}

function parseCuit(raw: unknown): string {
  return String(raw ?? '').replace(/[-\s]/g, '').trim()
}

function parseTipo(raw: unknown): string {
  const s = String(raw ?? '').trim()
  // Formato solo numérico: "3" o "013" → normalizar sin ceros
  if (/^\d+$/.test(s)) return String(parseInt(s, 10))
  // Formato ARCA "11 - Factura C" o "013 - Nota de Crédito C" → extraer código
  const codigoMatch = s.match(/^(\d+)\s*-\s*/)
  if (codigoMatch) return String(parseInt(codigoMatch[1], 10))
  // Formato solo texto "Nota de Crédito C" → mapear a código AFIP
  const norm = normalizarTipoTexto(s)
  return TIPO_CODES[norm] ?? s
}

function parsePV(raw: unknown): string {
  return String(raw ?? '').trim().padStart(5, '0')
}

function parseNumero(raw: unknown): string {
  return String(raw ?? '').trim().padStart(8, '0')
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export interface FilaEmitida {
  fecha_emision:    string
  tipo_comprobante: string
  punto_venta:      string
  numero:           string
  cae:              string
  denominacion:     string
  cuit_receptor:    string
  imp_total:        number
}

export interface FilaRecibida {
  fecha_emision:    string
  tipo_comprobante: string
  punto_venta:      string
  numero:           string
  denominacion:     string
  cuit_emisor:      string
  imp_total:        number
}

export type TipoImport = 'emitidos' | 'recibidos'

export interface ResultadoParser {
  filas:          FilaEmitida[] | FilaRecibida[]
  tipo:           TipoImport
  errores:        string[]
  cuitDetectado:  string | null  // CUIT extraído del título del Excel
}

export function parsearExcelArca(file: File, tipo: TipoImport): Promise<ResultadoParser> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb   = XLSX.read(data, { type: 'array', cellDates: false })
        const ws   = wb.Sheets[wb.SheetNames[0]]

        // El Excel de ARCA tiene una fila de título antes de los headers reales.
        // Leemos como arrays y buscamos la fila que contiene los encabezados.
        const allRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (!allRows.length) {
          resolve({ filas: [], tipo, errores: ['El archivo está vacío o no tiene datos.'], cuitDetectado: null })
          return
        }

        // Extraer CUIT del título: "Mis Comprobantes Emitidos - CUIT 20960226802"
        const titulo = String(allRows[0]?.[0] ?? '')
        const cuitMatch = titulo.match(/CUIT\s+([\d-]{11,13})/i)
        const cuitDetectado = cuitMatch ? cuitMatch[1].replace(/-/g, '') : null

        const cols    = tipo === 'emitidos' ? COLS_EMITIDOS : COLS_RECIBIDOS
        const normMap = buildNormalizedMap(cols)

        // Encontrar la fila de headers: la primera que tenga al menos una columna reconocida
        let headerRowIdx = -1
        let headers: string[] = []
        for (let i = 0; i < Math.min(allRows.length, 10); i++) {
          const row = allRows[i].map((c) => String(c ?? ''))
          const hits = row.filter((h) => normMap[normalizarCol(h)])
          if (hits.length >= 2) {
            headerRowIdx = i
            headers = row
            break
          }
        }

        if (headerRowIdx === -1) {
          const sample = allRows.slice(0, 3).map((r) => r.join(' | ')).join('\n')
          resolve({ filas: [], tipo, cuitDetectado, errores: [`No se encontraron los encabezados esperados. Primeras filas:\n${sample}`] })
          return
        }

        // Reconstruir filas como objetos usando los headers encontrados
        const raw: Record<string, unknown>[] = allRows
          .slice(headerRowIdx + 1)
          .filter((r) => r.some((c) => c !== ''))
          .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))

        // Construir mapa: clave_excel_real → nombre_interno
        const headerMap: Record<string, string> = {}
        for (const excelHeader of headers) {
          const norm = normalizarCol(excelHeader)
          if (normMap[norm]) {
            headerMap[excelHeader] = cols[normMap[norm]]
          }
        }

        // Verificar columnas faltantes
        const encontradas  = new Set(Object.values(headerMap))
        const requeridas   = Object.values(cols)
        const faltantes    = requeridas.filter((c) => !encontradas.has(c))
        const errores: string[] = []

        if (faltantes.length) {
          errores.push(`Columnas no encontradas: ${faltantes.join(', ')}`)
          errores.push(`Headers detectados: ${headers.filter(Boolean).join(' | ')}`)
        }

        if (tipo === 'emitidos') {
          const filas: FilaEmitida[] = raw.map((row) => {
            const get = (campo: string) => {
              const header = Object.keys(headerMap).find((h) => headerMap[h] === campo)
              return header ? row[header] : ''
            }
            return {
              fecha_emision:    parseFecha(get('fecha_emision')),
              tipo_comprobante: parseTipo(get('tipo_comprobante')),
              punto_venta:      parsePV(get('punto_venta')),
              numero:           parseNumero(get('numero')),
              cae:              String(get('cae') ?? '').trim(),
              denominacion:     String(get('denominacion') ?? '').trim(),
              cuit_receptor:    parseCuit(get('cuit_receptor')),
              imp_total:        parseImporte(get('imp_total')),
            }
          }).filter((f) => f.fecha_emision && f.numero)

          resolve({ filas, tipo, errores, cuitDetectado })
        } else {
          const filas: FilaRecibida[] = raw.map((row) => {
            const get = (campo: string) => {
              const header = Object.keys(headerMap).find((h) => headerMap[h] === campo)
              return header ? row[header] : ''
            }
            return {
              fecha_emision:    parseFecha(get('fecha_emision')),
              tipo_comprobante: parseTipo(get('tipo_comprobante')),
              punto_venta:      parsePV(get('punto_venta')),
              numero:           parseNumero(get('numero')),
              denominacion:     String(get('denominacion') ?? '').trim(),
              cuit_emisor:      parseCuit(get('cuit_emisor')),
              imp_total:        parseImporte(get('imp_total')),
            }
          }).filter((f) => f.fecha_emision && f.numero)

          resolve({ filas, tipo, errores, cuitDetectado })
        }
      } catch (err) {
        reject(new Error('No se pudo leer el archivo. Verificá que sea un Excel de ARCA válido.'))
      }
    }

    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── Labels de tipo de comprobante ───────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  '1': 'Factura A', '6': 'Factura B', '11': 'Factura C', '51': 'Factura M',
  '3': 'N. Créd. A', '8': 'N. Créd. B', '13': 'N. Créd. C', '53': 'N. Créd. M',
  '2': 'N. Déb. A',  '7': 'N. Déb. B',  '12': 'N. Déb. C',
}

export function labelTipo(tipo: string): string {
  return TIPO_LABELS[tipo] ?? `Tipo ${tipo}`
}

export function esNotaCredito(tipo: string): boolean {
  if (TIPOS_NC.includes(tipo)) return true
  // Compatibilidad con datos importados antes de la normalización (ej. "13 - Nota de Crédito C")
  const norm = normalizarTipoTexto(tipo)
  return norm.includes('nota de credito')
}
