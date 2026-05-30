import { lazy, Suspense } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePresupuesto } from './usePresupuestos'

const ObraMenorFormPage  = lazy(() => import('./ObraMenorFormPage'))
const ObraMayorFormPage  = lazy(() => import('./PresupuestoFormPage'))

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
    </div>
  )
}

export default function PresupuestoDispatcher() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const { data: presupuesto, isLoading } = usePresupuesto(id)

  if (id && isLoading) return <Spinner />

  const tipo = presupuesto?.tipo
    ?? (searchParams.get('tipo') === 'obra_menor' ? 'obra_menor' : 'obra_mayor')

  return (
    <Suspense fallback={<Spinner />}>
      {tipo === 'obra_menor'
        ? <ObraMenorFormPage />
        : <ObraMayorFormPage />
      }
    </Suspense>
  )
}
