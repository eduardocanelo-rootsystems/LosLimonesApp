import type { Contrato, PresupuestoCompleto } from '@/types/database'

export type PlanPago = 'contado' | '60dias' | '90dias' | ''

export interface ContratoFormValues {
  nombre_comitente: string
  direccion_obra: string
  nombre_administrador: string
  administrador_dni: string
  sector_obra: string
  plan_pago: PlanPago
  adelanto: string
  num_cuotas: string
  monto_cuota: string
  fecha_cuota_1: string
  fecha_cuota_2: string
  monto_multa: string
  direccion_legal: string
  fecha_inicio_obra: string
  fecha_firma: string
}

export const PLANES_PAGO = {
  contado:  { label: 'Contado (50/50)',        recargo: 0,    cuotasLabel: '' },
  '60dias': { label: 'Financiado a 60 días',   recargo: 0.10, cuotasLabel: '+10%' },
  '90dias': { label: 'Financiado a 90 días',   recargo: 0.20, cuotasLabel: '+20%' },
} as const

export function contratoToFormValues(
  contrato: Contrato | null,
  presupuesto: PresupuestoCompleto
): ContratoFormValues {
  const fechaFirmaDefault = presupuesto.fecha_aprobacion
    ? presupuesto.fecha_aprobacion.substring(0, 10)
    : ''
  return {
    nombre_comitente:      contrato?.nombre_comitente      ?? presupuesto.cliente_razon_social  ?? '',
    direccion_obra:        contrato?.direccion_obra        ?? presupuesto.cliente_direccion      ?? '',
    nombre_administrador:  contrato?.nombre_administrador  ?? presupuesto.cliente_administrador ?? '',
    administrador_dni:     contrato?.administrador_dni     ?? presupuesto.cliente_administrador_cuit ?? '',
    sector_obra:           contrato?.sector_obra           ?? '',
    plan_pago:             (contrato?.plan_pago as PlanPago) ?? '',
    adelanto:              contrato?.adelanto?.toString()  ?? '',
    num_cuotas:            contrato?.num_cuotas?.toString() ?? '',
    monto_cuota:           contrato?.monto_cuota?.toString() ?? '',
    fecha_cuota_1:         contrato?.fecha_cuota_1         ?? '',
    fecha_cuota_2:         contrato?.fecha_cuota_2         ?? '',
    monto_multa:           contrato?.monto_multa?.toString() ?? '',
    direccion_legal:       contrato?.direccion_legal       ?? presupuesto.cliente_direccion ?? '',
    fecha_inicio_obra:     contrato?.fecha_inicio_obra     ?? '',
    fecha_firma:           contrato?.fecha_firma           ?? fechaFirmaDefault,
  }
}

export function calcTotalPresupuesto(p: PresupuestoCompleto): number {
  const ss = p.servicios.reduce((a, s) => a + Number(s.subtotal), 0)
  const sm = p.materiales.reduce((a, m) => a + Number(m.subtotal), 0)
  const bruto = ss + sm
  const desc =
    p.descuento_tipo === 'fijo'
      ? Number(p.descuento_valor ?? 0)
      : p.descuento_tipo === 'porcentaje'
        ? (bruto * Number(p.descuento_valor ?? 0)) / 100
        : 0
  const neto = bruto - desc
  return neto + (neto * Number(p.iva_pct)) / 100
}

export function calcFinanciamiento(baseTotal: number, plan: PlanPago) {
  const recargo         = plan === '60dias' ? 0.10 : plan === '90dias' ? 0.20 : 0
  const anticipo        = baseTotal * 0.5
  const saldo           = anticipo * (1 + recargo)   // recargo solo sobre el 50% financiado
  const totalFinal      = anticipo + saldo
  const numInstallments = plan === '60dias' || plan === '90dias' ? 2 : 0
  const montoCuota      = numInstallments > 0 ? saldo / numInstallments : saldo
  return { totalFinal, anticipo, saldo, numInstallments, montoCuota }
}

export function addWorkingDays(startIso: string, days: number): string {
  const d = new Date(startIso + 'T12:00:00')
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) added++
  }
  return d.toISOString().substring(0, 10)
}
