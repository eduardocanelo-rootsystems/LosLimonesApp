import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

interface Props {
  label:     string
  field:     string
  activeCol: string | null
  dir:       'asc' | 'desc'
  onToggle:  (field: string) => void
  align?:    'left' | 'right'
}

export function SortTh({ label, field, activeCol, dir, onToggle, align = 'left' }: Props) {
  const active = activeCol === field
  return (
    <th className="px-4 py-3">
      <button
        onClick={() => onToggle(field)}
        className={`flex items-center gap-1 text-xs uppercase tracking-wider font-medium transition-colors whitespace-nowrap ${
          active ? 'text-accent-400' : 'text-ink-400 hover:text-ink-200'
        } ${align === 'right' ? 'ml-auto' : ''}`}
      >
        {label}
        {active
          ? dir === 'asc'
            ? <ArrowUp className="h-3 w-3" />
            : <ArrowDown className="h-3 w-3" />
          : <ArrowUpDown className="h-3 w-3 opacity-40" />
        }
      </button>
    </th>
  )
}
