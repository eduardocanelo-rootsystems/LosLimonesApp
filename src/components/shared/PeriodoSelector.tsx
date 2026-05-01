export type Periodo = 'mes_actual' | 'mes_anterior' | 'ultimos_3' | 'ultimos_6' | 'anio_actual'

export interface RangoFechas {
  desde: string
  hasta: string
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function getRangoFechas(periodo: Periodo): RangoFechas {
  const hoy  = new Date()
  const y    = hoy.getFullYear()
  const m    = hoy.getMonth()        // 0-indexed

  switch (periodo) {
    case 'mes_actual':
      return { desde: toISO(new Date(y, m, 1)),     hasta: toISO(new Date(y, m + 1, 0)) }
    case 'mes_anterior':
      return { desde: toISO(new Date(y, m - 1, 1)), hasta: toISO(new Date(y, m, 0)) }
    case 'ultimos_3':
      return { desde: toISO(new Date(y, m - 2, 1)), hasta: toISO(new Date(y, m + 1, 0)) }
    case 'ultimos_6':
      return { desde: toISO(new Date(y, m - 5, 1)), hasta: toISO(new Date(y, m + 1, 0)) }
    case 'anio_actual':
      return { desde: `${y}-01-01`, hasta: `${y}-12-31` }
  }
}

const OPCIONES: { value: Periodo; label: string }[] = [
  { value: 'mes_anterior', label: 'Mes anterior' },
  { value: 'mes_actual',   label: 'Este mes'     },
  { value: 'ultimos_3',    label: 'Últ. 3 meses' },
  { value: 'ultimos_6',    label: 'Últ. 6 meses' },
  { value: 'anio_actual',  label: 'Este año'     },
]

interface Props {
  value:    Periodo
  onChange: (periodo: Periodo, rango: RangoFechas) => void
}

export function PeriodoSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {OPCIONES.map((op) => (
        <button
          key={op.value}
          onClick={() => onChange(op.value, getRangoFechas(op.value))}
          className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
            value === op.value
              ? 'bg-accent-600 text-white'
              : 'bg-ink-800 text-ink-400 hover:bg-ink-700 hover:text-ink-200'
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  )
}
