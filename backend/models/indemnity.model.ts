import mongoose, { Schema, Document } from "mongoose"

export interface IIndemnity extends Document {
  employeeId: string
  employeeName: string
  joiningDate: Date
  lastWorkingDate: Date
  yearsOfService: number
  roundedYearsOfService: number
  basicSalary: number
  da: number
  calculatedAmount: number
  reason:
    | "termination"
    | "resignation"
    | "retirement"
    | "end-of-contract"
    | "death"
    | "permanent-disablement"
    | "retrenchment"
  notes?: string
  status: "Pending" | "Approved" | "Rejected" | "Paid"
  workflowStage: "PENDING_FINANCE" | "PENDING_HR" | "PENDING_CEO" | "APPROVED" | "REJECTED_RESUBMIT"
  requestedBy: string
  financeApprovedBy?: string
  financeApprovedAt?: Date
  hrApprovedBy?: string
  hrApprovedAt?: Date
  approvedBy?: string // CEO — final approval
  approvalDate?: Date
  rejectionReason?: string
  rejectedBy?: string
  rejectedAt?: Date
  rejectedAtStage?: string
  paymentDate?: Date
}

const IndemnitySchema = new Schema<IIndemnity>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    lastWorkingDate: { type: Date, required: true },
    yearsOfService: { type: Number, required: true },
    roundedYearsOfService: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    da: { type: Number, default: 0 },
    calculatedAmount: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        "termination",
        "resignation",
        "retirement",
        "end-of-contract",
        "death",
        "permanent-disablement",
        "retrenchment",
      ],
      required: true,
    },
    notes: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid"],
      default: "Pending",
    },
    workflowStage: {
      type: String,
      enum: ["PENDING_FINANCE", "PENDING_HR", "PENDING_CEO", "APPROVED", "REJECTED_RESUBMIT"],
      default: "PENDING_FINANCE",
    },
    requestedBy: { type: String, required: true },
    financeApprovedBy: String,
    financeApprovedAt: Date,
    hrApprovedBy: String,
    hrApprovedAt: Date,
    approvedBy: String, // CEO — final approval
    approvalDate: Date,
    rejectionReason: String,
    rejectedBy: String,
    rejectedAt: Date,
    rejectedAtStage: String,
    paymentDate: Date,
  },
  { timestamps: true }
)

export default mongoose.model<IIndemnity>("Indemnity", IndemnitySchema)
