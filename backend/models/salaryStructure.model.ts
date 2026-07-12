import mongoose, { Schema, Document } from "mongoose"
import { AppraisalRatingBand } from "../constants/appraisalRatingBands"

/** Audit trail for idempotent PMS → payroll bonus application on this salary row */
export interface IAppraisalBonusSnapshot {
  appraisalCycleId: mongoose.Types.ObjectId
  performanceCycleId: mongoose.Types.ObjectId
  ratingBand: AppraisalRatingBand
  bonusPercentApplied: number
  /** Monetary bonus derived at apply time (typically % of annual basic or monthly — see integration contract) */
  bonusAmount: number
  /** Must match AppraisalCycle.bonusRunId for this processing run */
  bonusRunId: string
  appliedAt: Date
  /** Set once this bonus has been included in a generated payroll run — prevents double payment */
  paidInPayrollId?: string
  paidAt?: Date
}

export interface ISalaryStructure extends Document {
  userId:         mongoose.Types.ObjectId 
  employeeId:     string                   
  basic:          number
  hra:            number
  transport:      number
  medical:        number
  otherAllowance: number
  pf:             number
  tax:            number
  insurance:      number
  effectiveFrom:  Date
  /** Latest performance/appraisal bonus amount for active structure (updated on cycle PROCESSED) */
  performanceBonusAmount: number
  /** Last successful bonus application — used for idempotency + audit */
  appraisalBonusSnapshot?: IAppraisalBonusSnapshot
}

const AppraisalBonusSnapshotSchema = new Schema<IAppraisalBonusSnapshot>(
  {
    appraisalCycleId: {
      type: Schema.Types.ObjectId,
      ref: "AppraisalCycle",
      required: true,
    },
    performanceCycleId: {
      type: Schema.Types.ObjectId,
      ref: "PerformanceCycle",
      required: true,
    },
    ratingBand: {
      type: String,
      enum: Object.values(AppraisalRatingBand),
      required: true,
    },
    bonusPercentApplied: { type: Number, required: true, min: 0, max: 100 },
    bonusAmount: { type: Number, required: true, min: 0 },
    bonusRunId: { type: String, required: true, trim: true },
    appliedAt: { type: Date, required: true },
    paidInPayrollId: { type: String, default: undefined },
    paidAt: { type: Date, default: undefined },
  },
  { _id: false }
)

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    userId: {
      type:    Schema.Types.ObjectId,
      ref:     "User",
      default: null,
    },
    employeeId: { type: String, default: null },
    basic:          { type: Number, default: 0 },
    hra:            { type: Number, default: 0 },
    transport:      { type: Number, default: 0 },
    medical:        { type: Number, default: 0 },
    otherAllowance: { type: Number, default: 0 },
    pf:             { type: Number, default: 0 },
    tax:            { type: Number, default: 0 },
    insurance:      { type: Number, default: 0 },
    effectiveFrom:  { type: Date,   default: null },
    performanceBonusAmount: { type: Number, default: 0, min: 0 },
    appraisalBonusSnapshot: { type: AppraisalBonusSnapshotSchema, default: undefined },
  },
  { timestamps: true }
)

SalaryStructureSchema.index({ userId: 1, effectiveFrom: -1 })
SalaryStructureSchema.index({ employeeId: 1 })

export default mongoose.model<ISalaryStructure>("SalaryStructure", SalaryStructureSchema)
