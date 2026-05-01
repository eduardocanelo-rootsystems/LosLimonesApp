interface SeccionDescuentoProps {
  tieneDescuento: boolean
  tipo: 'fijo' | 'porcentaje'
  valor: string
  onChange: (field: string, value: unknown) => void
}

export function SeccionDescuento({ tieneDescuento, tipo, valor, onChange }: SeccionDescuentoProps) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400">Descuento</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={tieneDescuento}
            onChange={(e) => {
              onChange('tiene_descuento', e.target.checked)
              if (!e.target.checked) {
                onChange('descuento_valor', '')
              }
            }}
            className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent-500"
          />
          Aplicar descuento
        </label>
      </div>

      {tieneDescuento && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex rounded-md border border-ink-700 overflow-hidden">
            <button
              type="button"
              onClick={() => onChange('descuento_tipo', 'fijo')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tipo === 'fijo'
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Monto fijo ($)
            </button>
            <button
              type="button"
              onClick={() => onChange('descuento_tipo', 'porcentaje')}
              className={`border-l border-ink-700 px-4 py-2 text-sm font-medium transition-colors ${
                tipo === 'porcentaje'
                  ? 'bg-accent-500/20 text-accent-400'
                  : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Porcentaje (%)
            </button>
          </div>
          <input
            type="number"
            min="0"
            step={tipo === 'porcentaje' ? '0.1' : '1'}
            max={tipo === 'porcentaje' ? '100' : undefined}
            value={valor}
            onChange={(e) => onChange('descuento_valor', e.target.value)}
            className="input-base w-36 font-mono"
            placeholder={tipo === 'porcentaje' ? '0.0 %' : '0'}
          />
        </div>
      )}
    </section>
  )
}
