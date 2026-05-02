import { cn } from '@/lib/utils'

const ACABADOS = ['Mampostería', 'Vidrio', 'Ladrillo', 'Concreto', 'Texturizado']

const CONDICIONES_ESTRUCTURALES = [
  { value: 'sin_riesgo',       label: 'Sin Riesgo',        desc: 'Estado bueno/muy bueno. Sin fisuras, revoques firmes.' },
  { value: 'deterioros_leves', label: 'Deterioros Leves',  desc: 'Fisuras capilares (<1mm), manchas de humedad.' },
  { value: 'riesgo_potencial', label: 'Riesgo Potencial',  desc: 'Grietas con profundidad, carbonatación.' },
  { value: 'peligro_inminente',label: 'Peligro Inminente', desc: 'Desprendimientos visibles, fallas estructurales.' },
]

const TIPOLOGIAS = [
  { value: 'perimetro_libre',   label: 'Edificio de Perímetro Libre (Torre)' },
  { value: 'entre_medianeras',  label: 'Edificio entre Medianeras' },
  { value: 'ph',                label: 'PH (Propiedad Horizontal)' },
  { value: 'petit_hotel',       label: 'Petit Hôtel' },
]

const CLASES_INCENDIO = [
  { value: 'e1', label: 'E1', desc: 'menos de 12 m' },
  { value: 'e2', label: 'E2', desc: 'entre 12 m y 47 m' },
  { value: 'e3', label: 'E3', desc: 'más de 47 m' },
]

const PROTECCIONES = [
  { value: 'integral',    label: 'Protección Integral' },
  { value: 'estructural', label: 'Protección Estructural' },
  { value: 'cautelar',    label: 'Protección Cautelar' },
]

export const COEF_K = [
  { value: 1.0,  label: 'K1 — Plano',         desc: 'Fachada lisa, sin salientes, menos de 1 AC por piso' },
  { value: 1.25, label: 'K2 — Semi-Saturado',  desc: 'Balcones corridos, 1-2 AC por paño, molduras simples' },
  { value: 1.5,  label: 'K3 — Saturado',       desc: 'Celosías, múltiples AC, antenas, redes de protección' },
  { value: 1.8,  label: 'K4 — Crítico',        desc: 'Ángulos negativos, gárgolas, fragilidad estructural' },
]

interface SeccionEdificacionProps {
  anios: string
  altura: string
  color: string
  acabado: string[]
  m2: string
  condicionEstructural: string
  tipologia: string
  valorPatrimonial: boolean
  proteccion: string
  coefK: string
  onChange: (field: string, value: unknown) => void
}

function claseDeAltura(alturaStr: string): string {
  const h = parseFloat(alturaStr)
  if (isNaN(h) || h <= 0) return ''
  if (h < 12)  return 'e1'
  if (h <= 47) return 'e2'
  return 'e3'
}

export function SeccionEdificacion({
  anios, altura, color, acabado, m2,
  condicionEstructural, tipologia,
  valorPatrimonial, proteccion, coefK,
  onChange,
}: SeccionEdificacionProps) {

  const claseAuto = claseDeAltura(altura)

  const handleAltura = (val: string) => {
    onChange('edif_altura', val)
    onChange('edif_clase_incendio', claseDeAltura(val))
  }

  const toggleAcabado = (item: string) => {
    const next = acabado.includes(item)
      ? acabado.filter((a) => a !== item)
      : [...acabado, item]
    onChange('edif_acabado', next)
  }

  const claseInfo = CLASES_INCENDIO.find((c) => c.value === claseAuto)

  return (
    <section className="card p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-ink-400">
        Características de la edificación
      </h2>

      {/* Métricas principales */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Años de la edificación
          </label>
          <input
            type="number" min="0"
            value={anios}
            onChange={(e) => onChange('edif_anios', e.target.value)}
            className="input-base font-mono"
            placeholder="Ej: 30"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Altura (m)
          </label>
          <input
            type="number" min="0" step="0.1"
            value={altura}
            onChange={(e) => handleAltura(e.target.value)}
            className="input-base font-mono"
            placeholder="Ej: 24.5"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Metros cuadrados (m²)
          </label>
          <input
            type="number" min="0" step="0.1"
            value={m2}
            onChange={(e) => onChange('edif_m2', e.target.value)}
            className="input-base font-mono"
            placeholder="Ej: 850"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Color al momento del levantamiento
          </label>
          <input
            type="text"
            value={color}
            onChange={(e) => onChange('edif_color', e.target.value)}
            className="input-base"
            placeholder="Ej: Blanco hueso"
          />
        </div>
      </div>

      {/* Acabado */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-400">
          Acabado
        </label>
        <div className="flex flex-wrap gap-2">
          {ACABADOS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAcabado(a)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                acabado.includes(a)
                  ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                  : 'border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Condición + Tipología */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Condición estructural <span className="text-danger">*</span>
          </label>
          <select
            value={condicionEstructural}
            onChange={(e) => onChange('edif_condicion_estructural', e.target.value)}
            className="input-base"
          >
            <option value="">Seleccionar…</option>
            {CONDICIONES_ESTRUCTURALES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {condicionEstructural && (
            <p className="mt-1 text-xs text-ink-500">
              {CONDICIONES_ESTRUCTURALES.find((c) => c.value === condicionEstructural)?.desc}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
            Tipología arquitectónica
          </label>
          <select
            value={tipologia}
            onChange={(e) => onChange('edif_tipologia', e.target.value)}
            className="input-base"
          >
            <option value="">Seleccionar…</option>
            {TIPOLOGIAS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clasificación de incendio — derivada de altura */}
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-400">
          Clasificación técnica de incendio
        </label>
        {claseAuto ? (
          <div className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-900/60 px-4 py-2.5">
            <span className="font-mono text-base font-bold text-accent-400">{claseInfo?.label}</span>
            <span className="text-sm text-ink-300">{claseInfo?.desc}</span>
            <span className="ml-auto text-xs text-ink-600">calculado por altura</span>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-800 px-4 py-2.5 text-xs text-ink-500">
            Completar la altura para determinar la clase
          </div>
        )}
      </div>

      {/* Coeficiente K — tarjetas */}
      <div className="mt-4">
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-ink-400">
          Coeficiente de complejidad K <span className="text-danger">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {COEF_K.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => onChange('coef_k', String(k.value))}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                coefK === String(k.value)
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-ink-700 hover:border-ink-600 hover:bg-ink-900/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-sm font-semibold',
                  coefK === String(k.value) ? 'text-accent-400' : 'text-ink-200'
                )}>
                  {k.label}
                </span>
                <span className={cn(
                  'font-mono text-xs font-bold',
                  coefK === String(k.value) ? 'text-accent-400' : 'text-ink-500'
                )}>
                  ×{k.value}
                </span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-ink-500">{k.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Valor patrimonial */}
      <div className="mt-4 flex items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={valorPatrimonial}
            onChange={(e) => {
              onChange('edif_valor_patrimonial', e.target.checked)
              if (!e.target.checked) onChange('edif_proteccion', '')
            }}
            className="h-4 w-4 rounded border-ink-600 bg-ink-800 accent-accent-500"
          />
          Edificio con valor patrimonial
        </label>
        {valorPatrimonial && (
          <select
            value={proteccion}
            onChange={(e) => onChange('edif_proteccion', e.target.value)}
            className="input-base sm:w-64"
          >
            <option value="">Tipo de protección…</option>
            {PROTECCIONES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        )}
      </div>
    </section>
  )
}
