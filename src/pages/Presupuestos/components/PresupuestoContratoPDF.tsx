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
  logoUrl,
}: {
  presupuesto: PresupuestoCompleto
  form: ContratoFormValues
  firmaContratista?: string | null
  firmaCliente?: string | null
  firmaUrl?: string
  logoUrl?: string | null
}) {
  return (
    <Document
      title={`${presupuesto.numero ?? 'Presupuesto'} · Contrato`}
      author="Limones - Rope Access"
    >
      <PresupuestoPDFPage presupuesto={presupuesto} logoUrl={logoUrl} />
      {presupuesto.fotos?.length > 0 && (
        <PaginaFotos presupuesto={presupuesto} fotos={presupuesto.fotos} logoUrl={logoUrl} />
      )}
      <ContratoPDFPage
        presupuesto={presupuesto}
        form={form}
        firmaContratista={firmaContratista}
        firmaCliente={firmaCliente}
        firmaUrl={firmaUrl}
        logoUrl={logoUrl}
      />
    </Document>
  )
}
