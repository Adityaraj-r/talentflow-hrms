import type { IPayrollCompanySettings } from "../models/payrollCompanySettings.model"
import { getActivePolicy, calculateSlabTax } from "./payrollPolicy.service"
import type { ISlab } from "../models/payrollPolicy.model"

export type StatutoryInput = {
  basic: number
  gross: number
  fixedPf: number
  fixedEsi: number
  fixedPt: number
  fixedTds: number
  insurance: number
  other: number
}

export async function applyStatutoryDeductions(
  settings: IPayrollCompanySettings,
  input: StatutoryInput,
  asOfDate: Date,
  employeeState?: string
): Promise<{ pf: number; esi: number; pt: number; tds: number }> {
  let pf = input.fixedPf
  let esi = input.fixedEsi
  let pt = input.fixedPt
  let tds = input.fixedTds

  if (settings.useComputedPf) {
    const pfPolicy = await getActivePolicy('PF_RATE', asOfDate)
    if (!pfPolicy) throw new Error('No active PF_RATE policy found — payroll cannot proceed')   // <-- ADD THIS LINE
    const base = Math.min(input.basic, pfPolicy.rules.wageCeiling)
    pf = Math.round((base * pfPolicy.rules.employeeRate) / 100)
  }

  if (settings.useComputedEsi) {
    const esiPolicy = await getActivePolicy('ESI_RATE', asOfDate)
    if (!esiPolicy) throw new Error('No active ESI_RATE policy found — payroll cannot proceed')  // <-- ADD THIS LINE
    esi = input.gross <= esiPolicy.rules.eligibilityThreshold
      ? Math.round((input.gross * esiPolicy.rules.employeeRate) / 100)
      : 0
  }

  if (settings.useComputedPt) {
    if (!employeeState) {
      pt = Math.round(settings.professionalTaxMonthlySlab)
    } else {
      const ptPolicy = await getActivePolicy('PT_SLAB', asOfDate, employeeState)
      pt = ptPolicy
        ? getFlatSlabAmount(input.gross, ptPolicy.rules.slabs)
        : Math.round(settings.professionalTaxMonthlySlab)
      // ^ this branch is already correct — no change needed, ptPolicy can be null and it's handled
    }
  }

  if (settings.useComputedTds) {
    const taxPolicy = await getActivePolicy('TAX_SLAB', asOfDate)
    if (!taxPolicy) throw new Error('No active TAX_SLAB policy found — payroll cannot proceed')  // <-- ADD THIS LINE
    const annualTaxable = Math.max(0, (input.gross * 12) - taxPolicy.rules.standardDeduction)
    const annualTax = calculateSlabTax(annualTaxable, taxPolicy.rules.slabs)
    tds = Math.max(0, Math.round(annualTax / 12))
  }

  return { pf, esi, pt, tds }
}
export function getFlatSlabAmount(income: number, slabs: ISlab[]): number {
  for (const slab of slabs) {
    if (income > slab.min && (slab.max === null || income <= slab.max)) {
      return slab.rate; // flat amount, not a percentage
    }
  }
  return 0;
}