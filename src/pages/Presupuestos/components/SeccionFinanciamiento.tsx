import { formatCurrency } from '@/lib/utils'

interface SeccionFinanciamientoProps {
  total: number
}

const PLANES = [
  { label: 'Contado (50/50)', recargo: 0 },
  { label: 'Financiado a 60 días', recargo: 0.10 },
  { label: 'Financiado a 90 días', recargo: 0.35 },
]

export function SeccionFinanciamiento({ total }: SeccionFinanciamientoProps) {
  if (total <= 0) return null

  const anticipo = total * 0.5

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Opciones de financiamiento
      </h2>

      <div className="overflow-hidden rounded-lg border border-ink-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-800 bg-ink-900/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-ink-400">Plan</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Recargo</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Total</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Anticipo</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-ink-400">Cuotas / Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-800">
            {PLANES.map(({ label, recargo }, i) => {
              const totalFinal = total * (1 + recargo)
              const saldo = totalFinal - anticipo
              const cuotasLabel =
                recargo === 0
                  ? formatCurrency(saldo)
                  : `2 × ${formatCurrency(saldo / 2)}`

              return (
                <tr key={label} className={i === 0 ? 'bg-ink-900/40' : 'hover:bg-ink-900/20'}>
                  <td className="px-4 py-3 font-medium text-ink-100">{label}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-400">
                    {recargo === 0 ? '—' : `+${(recargo * 100).toFixed(0)}%`}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-ink-100">
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
        El anticipo es el 50% del valor de contado en todos los planes. Los recargos aplican sobre el total.
      </p>
    </section>
  )
}
