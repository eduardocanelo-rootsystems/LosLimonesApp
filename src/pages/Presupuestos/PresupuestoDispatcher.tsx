import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { usePresupuesto } from './usePresupuestos'

const PresupuestoFormPage = lazy(() => import('./PresupuestoFormPage'))

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
    </div>
  )
}

export default function PresupuestoDispatcher() {
  const { id } = useParams<{ id: string }>()
  const { isLoading } = usePresupuesto(id)

  if (id && isLoading) return <Spinner />

  return (
    <Suspense fallback={<Spinner />}>
      <PresupuestoFormPage />
    </Suspense>
  )
}
