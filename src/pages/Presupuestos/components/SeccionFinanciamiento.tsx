import { cn, formatCurrency } from '@/lib/utils'

export type PlanFinanciamiento = 'contado' | '60dias' | '90dias' | null

interface SeccionFinanciamientoProps {
  total: number
  planSeleccionado: PlanFinanciamiento
  onChange: (plan: PlanFinanciamiento) => void
}

const PLANES = [
  { value: 'contado' as const, label: 'Contado (50/50)', recargo: 0 },
  { value: '60dias' as const, label: 'Financiado a 60 días', recargo: 0.10 },
  { value: '90dias' as const, label: 'Financiado a 90 días', recargo: 0.20 },
]

export function SeccionFinanciamiento({ total, planSeleccionado, onChange }: SeccionFinanciamientoProps) {
  if (total <= 0) return null

  const anticipo = total * 0.5

  const handleClick = (value: PlanFinanciamiento) => {
    onChange(planSeleccionado === value ? null : value)
  }

  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">
          Opciones de financiamiento
        </h2>
        {planSeleccionado && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-ink-500 hover:text-ink-300 transition-colors"
          >
            Quitar selección
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-ink-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900/50">
              <th className="w-8" />
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Plan</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Recargo</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Anticipo</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Cuotas / Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {PLANES.map(({ value, label, recargo }) => {
              const saldo = anticipo * (1 + recargo)  // recargo solo sobre el 50% financiado
              const totalFinal = anticipo + saldo
              const cuotasLabel = recargo === 0
                ? formatCurrency(saldo)
                : `2 × ${formatCurrency(saldo / 2)}`
              const isSelected = planSeleccionado === value

              return (
                <tr
                  key={value}
                  onClick={() => handleClick(value)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-accent-500/10 ring-inset ring-1 ring-accent-500/30'
                      : 'hover:bg-ink-900/40'
                  )}
                >
                  <td className="pl-3 pr-0 py-3 text-center">
                    <div className={cn(
                      'mx-auto h-4 w-4 rounded-full border-2 transition-colors',
                      isSelected ? 'border-accent-400 bg-accent-400' : 'border-ink-600'
                    )} />
                  </td>
                  <td className={cn('px-4 py-3 font-medium', isSelected ? 'text-accent-300' : 'text-ink-100')}>
                    {label}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-400">
                    {recargo === 0 ? '—' : `+${(recargo * 100).toFixed(0)}%`}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-mono font-semibold', isSelected ? 'text-accent-300' : 'text-ink-100')}>
                    {formatCurrency(totalFinal)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-300">
                    {formatCurrency(anticipo)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ink-300">
                    {cuotasLabel}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-2.5 text-xs text-ink-500">
        El anticipo es el 50% del valor de contado en todos los planes. El recargo aplica solo sobre el 50% financiado.
        {planSeleccionado && (
          <span className="ml-1 font-medium text-accent-400">
            · Plan seleccionado aparecerá en el PDF.
          </span>
        )}
      </p>
    </section>
  )
}
