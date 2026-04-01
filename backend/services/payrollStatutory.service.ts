import type { IPayrollCompanySettings } from "../models/payrollCompanySettings.model"

export type StatutoryInput = {
  basic: number
  gross: number
  /** Fixed amounts from Employee master when statutory not computed */
  fixedPf: number
  fixedEsi: number
  fixedPt: number
  fixedTds: number
  insurance: number
  other: number
}

/**
 * Single place for PF / ESI / PT / TDS rules (India-oriented defaults).
 * Toggle via PayrollCompanySettings flags.
 */
export function applyStatutoryDeductions(
  settings: IPayrollCompanySettings,
  input: StatutoryInput
): { pf: number; esi: number; pt: number; tds: number } {
  let pf = input.fixedPf
  let esi = input.fixedEsi
  let pt = input.fixedPt
  let tds = input.fixedTds

  if (settings.useComputedPf) {
    const base = Math.min(input.basic, settings.pfWageCeiling)
    pf = Math.round((base * settings.pfEmployeePercent) / 100)
  }

  if (settings.useComputedEsi && input.gross <= settings.esiGrossCeiling) {
    esi = Math.round((input.gross * settings.esiEmployeePercent) / 100)
  } else if (settings.useComputedEsi) {
    esi = 0
  }

  if (settings.useComputedPt) {
    pt = Math.round(settings.professionalTaxMonthlySlab)
  }

  if (settings.useComputedTds) {
    tds = Math.max(0, Math.round(settings.tdsDefaultMonthlyEstimate))
  }

  return { pf, esi, pt, tds }
}
