import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Loader2, Plus, ArrowRight, Building2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'
import { useRelevamientos, useExportarRelevamiento } from './useRelevamientos'

function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(iso))
}

export default function RelevamientosPage() {
  const navigate   = useNavigate()
  const { data: relevamientos = [], isLoading } = useRelevamientos()
  const exportar   = useExportarRelevamiento()
  const [exportandoId, setExportandoId] = useState<string | null>(null)

  const handleExportar = async (id: string, razonSocial: string | null) => {
    setExportandoId(id)
    try {
      await exportar.mutateAsync(id)
      toast.success(`Relevamiento de ${razonSocial ?? 'cliente'} exportado como presupuesto.`)
      navigate(`/presupuestos/${id}`)
    } catch {
      toast.error('Error al exportar el relevamiento.')
    } finally {
      setExportandoId(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Relevamientos"
        subtitle="Datos de obra cargados en campo, listos para convertir en presupuesto"
        actions={
          <button
            type="button"
            onClick={() => navigate('/relevamientos/nuevo')}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Nuevo relevamiento
          </button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
        </div>
      ) : relevamientos.length === 0 ? (
        <div>
          <EmptyState
            icon={ClipboardList}
            title="Sin relevamientos"
            description="Creá un nuevo relevamiento desde obra para que el equipo pueda armar el presupuesto."
          />
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={() => navigate('/relevamientos/nuevo')} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nuevo relevamiento
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {relevamientos.map((r) => (
            <div
              key={r.id}
              className="card flex flex-col gap-3 p-4 cursor-pointer hover:border-ink-600 transition-colors"
              onClick={() => navigate(`/relevamientos/${r.id}`)}
            >
              {/* Cliente */}
              <div>
                <p className="font-medium text-ink-100 truncate">
                  {r.cliente_razon_social ?? <span className="text-ink-500 italic">Sin nombre</span>}
                </p>
                {r.cliente_direccion && (
                  <p className="mt-0.5 text-xs text-ink-500 truncate">{r.cliente_direccion}</p>
                )}
              </div>

              {/* Edificio */}
              <div className="flex items-center gap-3 text-xs text-ink-400">
                {r.edif_m2 && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {r.edif_m2} m²
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fmtFecha(r.fecha_creacion)}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 pt-1 border-t border-ink-800">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); navigate(`/relevamientos/${r.id}`) }}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleExportar(r.id, r.cliente_razon_social) }}
                  disabled={exportandoId === r.id}
                  className={cn(
                    'ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    'bg-accent-500/10 text-accent-400 hover:bg-accent-500/20 border border-accent-500/30'
                  )}
                >
                  {exportandoId === r.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <ArrowRight className="h-3 w-3" />
                  }
                  Exportar a presupuesto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
