import mongoose, { Schema, Document } from "mongoose"

/** Workflow + legacy statuses for backward compatibility */
export type PayrollRunStatus =
  | "Generated"
  | "Verified"
  | "HR_Approved"
  | "CEO_Approved"
  | "Disbursed"
  | "Locked"
  | "HR Approved"
  | "Paid"

export interface IAdvanceAllocation {
  ticketId: string
  amount: number
}

export interface IPayrollEarningsSnapshot {
  basic: number
  hra: number
  allowances: number
  bonus: number
  bonusReason?: string
  overtime: number
  overtimeAuto: number
  reimbursement: number
  performanceBonus: number
}

export interface IPayrollDeductionsSnapshot {
  pf: number
  esi: number
  pt: number
  tds: number
  insurance: number
  other: number
  lopAmount: number
  advanceTotal: number
}

export interface IEmployeePayroll {
  employeeId: string
  earnings: IPayrollEarningsSnapshot
  deductions: IPayrollDeductionsSnapshot
  grossPay: number
  totalDeductions: number
  netPay: number
  lopDays: number
  prorationFactor: number
  advanceAllocations: IAdvanceAllocation[]
  /** Frozen at calculation time — PDF must not recompute */
  calculationVersion: string
  computedAt: Date
}

export interface IPayroll extends Document {
  month: string
  year: number
  runKind: "regular" | "off_cycle"
  offCycleLabel?: string
  employees: IEmployeePayroll[]
  status: PayrollRunStatus
  totalGross: number
  totalNet: number
  ceoApprovalRequired: boolean
  generatedBy?: string
  generatedAt?: Date
  verifiedBy?: string
  verifiedAt?: Date
  hrApprovedBy?: string
  hrApprovedAt?: Date
  ceoApprovedBy?: string
  ceoApprovedAt?: Date
  disbursedBy?: string
  disbursedAt?: Date
  lockedBy?: string
  lockedAt?: Date
  paymentReference?: string
  paymentMethod?: string
  paymentStatus?: "pending" | "processing" | "completed" | "failed"
  bankExportGeneratedAt?: Date
}

const AdvanceAllocationSchema = new Schema<IAdvanceAllocation>(
  {
    ticketId: { type: String, required: true },
    amount:   { type: Number, required: true },
  },
  { _id: false }
)

const EarningsSnapshotSchema = new Schema<IPayrollEarningsSnapshot>(
  {
    basic:             { type: Number, default: 0 },
    hra:               { type: Number, default: 0 },
    allowances:        { type: Number, default: 0 },
    bonus:             { type: Number, default: 0 },
    bonusReason:       { type: String, default: "" },
    overtime:          { type: Number, default: 0 },
    overtimeAuto:      { type: Number, default: 0 },
    reimbursement:     { type: Number, default: 0 },
    performanceBonus:  { type: Number, default: 0 },
  },
  { _id: false }
)

const DeductionsSnapshotSchema = new Schema<IPayrollDeductionsSnapshot>(
  {
    pf:           { type: Number, default: 0 },
    esi:          { type: Number, default: 0 },
    pt:           { type: Number, default: 0 },
    tds:          { type: Number, default: 0 },
    insurance:    { type: Number, default: 0 },
    other:        { type: Number, default: 0 },
    lopAmount:    { type: Number, default: 0 },
    advanceTotal: { type: Number, default: 0 },
  },
  { _id: false }
)

const EmployeePayrollSchema = new Schema<IEmployeePayroll>({
  employeeId:          { type: String, required: true },
  earnings:            { type: EarningsSnapshotSchema, required: true },
  deductions:          { type: DeductionsSnapshotSchema, required: true },
  grossPay:            { type: Number, required: true },
  totalDeductions:     { type: Number, required: true },
  netPay:              { type: Number, required: true },
  lopDays:             { type: Number, default: 0 },
  prorationFactor:     { type: Number, default: 1 },
  advanceAllocations:  { type: [AdvanceAllocationSchema], default: [] },
  calculationVersion:  { type: String, default: "v2" },
  computedAt:          { type: Date, default: () => new Date() },
})

const STATUS_ENUM: PayrollRunStatus[] = [
  "Generated",
  "Verified",
  "HR_Approved",
  "CEO_Approved",
  "Disbursed",
  "Locked",
  "HR Approved",
  "Paid",
]

const PayrollSchema = new Schema<IPayroll>(
  {
    month:   { type: String, required: true },
    year:    { type: Number, required: true },
    runKind: { type: String, enum: ["regular", "off_cycle"], default: "regular" },
    offCycleLabel: String,
    employees:     { type: [EmployeePayrollSchema], default: [] },
    status:        { type: String, enum: STATUS_ENUM, default: "Generated" },
    totalGross:    { type: Number, default: 0 },
    totalNet:      { type: Number, default: 0 },
    ceoApprovalRequired: { type: Boolean, default: false },
    generatedBy:   String,
    generatedAt:   Date,
    verifiedBy:    String,
    verifiedAt:    Date,
    hrApprovedBy:  String,
    hrApprovedAt:  Date,
    ceoApprovedBy: String,
    ceoApprovedAt: Date,
    disbursedBy:   String,
    disbursedAt:   Date,
    lockedBy:      String,
    lockedAt:      Date,
    paymentReference: String,
    paymentMethod:    String,
    paymentStatus:    { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
    bankExportGeneratedAt: Date,
  },
  { timestamps: true }
)

PayrollSchema.index({ month: 1, year: 1, runKind: 1 })

export default mongoose.model<IPayroll>("Payroll", PayrollSchema)

/** Employee-visible slip states (after disbursement / legacy paid) */
export const EMPLOYEE_SLIP_VISIBLE_STATUSES: PayrollRunStatus[] = [
  "Disbursed",
  "Locked",
  "HR Approved",
  "Paid",
]

export const normalizePayrollStatus = (s: string): PayrollRunStatus => {
  if (s === "HR Approved") return "HR_Approved"
  if (s === "Paid") return "Disbursed"
  return s as PayrollRunStatus
}
