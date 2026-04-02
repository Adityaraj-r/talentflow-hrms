import mongoose, { Schema, Document } from "mongoose"

/** Singleton-style company payroll configuration (statutory + workflow). */
export interface IPayrollCompanySettings extends Document {
  /** CEO must approve when total net payroll exceeds this amount (0 = never require CEO) */
  ceoApprovalThresholdTotalNet: number
  /** Default overtime: hourly rate = (basic / monthWorkingHours) * multiplier */
  defaultMonthWorkingHours: number
  otRateMultiplier: number
  pfEmployeePercent: number
  pfWageCeiling: number
  esiEmployeePercent: number
  esiEmployerPercent: number
  esiGrossCeiling: number
  professionalTaxMonthlySlab: number
  /** If true, compute PF as % of basic (capped) instead of using Employee.salary.deductions.pf */
  useComputedPf: boolean
  useComputedEsi: boolean
  useComputedPt: boolean
  useComputedTds: boolean
  tdsDefaultMonthlyEstimate: number
  updatedAt: Date
}

const PayrollCompanySettingsSchema = new Schema<IPayrollCompanySettings>(
  {
    ceoApprovalThresholdTotalNet: { type: Number, default: 5_000_000 },
    defaultMonthWorkingHours:     { type: Number, default: 240 },
    otRateMultiplier:             { type: Number, default: 1.5 },
    pfEmployeePercent:            { type: Number, default: 12 },
    pfWageCeiling:                { type: Number, default: 15_000 },
    esiEmployeePercent:           { type: Number, default: 0.75 },
    esiEmployerPercent:           { type: Number, default: 3.25 },
    esiGrossCeiling:              { type: Number, default: 21_000 },
    professionalTaxMonthlySlab:   { type: Number, default: 200 },
    useComputedPf:                { type: Boolean, default: false },
    useComputedEsi:               { type: Boolean, default: false },
    useComputedPt:                { type: Boolean, default: false },
    useComputedTds:               { type: Boolean, default: false },
    tdsDefaultMonthlyEstimate:    { type: Number, default: 0 },
  },
  { timestamps: true }
)

const PayrollCompanySettings = mongoose.model<IPayrollCompanySettings>(
  "PayrollCompanySettings",
  PayrollCompanySettingsSchema
)

export default PayrollCompanySettings

export const getOrCreatePayrollSettings = async () => {
  let doc = await PayrollCompanySettings.findOne()
  if (!doc) doc = await PayrollCompanySettings.create({})
  return doc
}
