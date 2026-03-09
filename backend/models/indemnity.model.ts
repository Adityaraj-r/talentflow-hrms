import mongoose, { Schema, Document } from "mongoose"

export interface IIndemnity extends Document {
  employeeId: string
  employeeName: string
  joiningDate: Date
  lastWorkingDate: Date
  yearsOfService: number
  basicSalary: number
  calculatedAmount: number
  reason: "termination" | "resignation" | "retirement" | "end-of-contract"
  notes?: string
  status: "Pending" | "Approved" | "Rejected" | "Paid"
  requestedBy: string
  approvedBy?: string
  approvalDate?: Date
  paymentDate?: Date
}

const IndemnitySchema = new Schema<IIndemnity>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    lastWorkingDate: { type: Date, required: true },
    yearsOfService: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    calculatedAmount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["termination", "resignation", "retirement", "end-of-contract"],
      required: true,
    },
    notes: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid"],
      default: "Pending",
    },
    requestedBy: { type: String, required: true },
    approvedBy: String,
    approvalDate: Date,
    paymentDate: Date,
  },
  { timestamps: true }
)

export default mongoose.model<IIndemnity>("Indemnity", IndemnitySchema)
