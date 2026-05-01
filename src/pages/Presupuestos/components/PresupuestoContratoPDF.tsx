import { Document } from '@react-pdf/renderer'
import { PresupuestoPDFPage } from './PresupuestoPDF'
import { ContratoPDFPage } from '@/pages/Contratos/components/ContratoPDF'
import type { PresupuestoCompleto } from '@/types/database'
import type { ContratoFormValues } from '@/pages/Contratos/components/ContratoPDF'

export function PresupuestoContratoPDFDocument({
  presupuesto,
  form,
  firmaContratista,
  firmaCliente,
}: {
  presupuesto: PresupuestoCompleto
  form: ContratoFormValues
  firmaContratista?: string | null
  firmaCliente?: string | null
}) {
  return (
    <Document
      title={`${presupuesto.numero ?? 'Presupuesto'} · Contrato`}
      author="Los Limones Creativos"
    >
      <PresupuestoPDFPage presupuesto={presupuesto} />
      <ContratoPDFPage
        presupuesto={presupuesto}
        form={form}
        firmaContratista={firmaContratista}
        firmaCliente={firmaCliente}
      />
    </Document>
  )
}
