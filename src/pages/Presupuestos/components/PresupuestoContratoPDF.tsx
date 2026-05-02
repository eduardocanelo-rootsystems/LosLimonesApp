import { Document } from '@react-pdf/renderer'
import { PaginaFotos, PresupuestoPDFPage } from './PresupuestoPDF'
import { ContratoPDFPage } from '@/pages/Contratos/components/ContratoPDF'
import type { PresupuestoCompleto } from '@/types/database'
import type { ContratoFormValues } from '@/pages/Contratos/components/ContratoPDF'

export function PresupuestoContratoPDFDocument({
  presupuesto,
  form,
  firmaContratista,
  firmaCliente,
  firmaUrl,
}: {
  presupuesto: PresupuestoCompleto
  form: ContratoFormValues
  firmaContratista?: string | null
  firmaCliente?: string | null
  firmaUrl?: string
}) {
  return (
    <Document
      title={`${presupuesto.numero ?? 'Presupuesto'} · Contrato`}
      author="Los Limones Creativos"
    >
      <PresupuestoPDFPage presupuesto={presupuesto} />
      {presupuesto.fotos?.length > 0 && (
        <PaginaFotos presupuesto={presupuesto} fotos={presupuesto.fotos} />
      )}
      <ContratoPDFPage
        presupuesto={presupuesto}
        form={form}
        firmaContratista={firmaContratista}
        firmaCliente={firmaCliente}
        firmaUrl={firmaUrl}
      />
    </Document>
  )
}
