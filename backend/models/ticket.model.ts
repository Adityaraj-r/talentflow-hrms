import mongoose, { Schema, Document } from "mongoose"

export interface ITicket extends Document {
  employeeId: string
  employeeName: string
  type: "advance" | "travel"
  amount?: number
  /** For advances: balance left to recover (FIFO). Set to amount on approval. */
  remainingAmount?: number
  destination?: string
  travelPurpose?: string
  departureDate?: Date
  returnDate?: Date
  ticketClass?: "economy" | "premium-economy" | "business" | "first"
  reason: string
  notes?: string
  status: "Pending" | "Approved" | "Rejected"
  workflowStage:
  | "PENDING_FINANCE"
  | "PENDING_PAYROLL"
  | "APPROVED"
  | "REJECTED"
  requestedBy: string
  financeApprovedBy?: string
  financeApprovalDate?: Date
  approvedBy?: string
  approvalDate?: Date
  rejectionReason?: string
}

const TicketSchema = new Schema<ITicket>(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    type: { type: String, enum: ["advance", "travel"], required: true },
    amount: Number,
    remainingAmount: { type: Number, default: undefined },
    destination: String,
    travelPurpose: String,
    departureDate: Date,
    returnDate: Date,
    ticketClass: { type: String, enum: ["economy", "premium-economy", "business", "first"] },
    reason: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    workflowStage: {
  type: String,
  enum: [
    "PENDING_FINANCE",
    "PENDING_PAYROLL",
    "APPROVED",
    "REJECTED",
  ],
  default: "PENDING_FINANCE",
},
    requestedBy: { type: String, required: true },
    financeApprovedBy: String,
    financeApprovalDate: Date,
    approvedBy: String,
    approvalDate: Date,
    rejectionReason: String,
  },
  { timestamps: true }
)

export default mongoose.model<ITicket>("Ticket", TicketSchema)
