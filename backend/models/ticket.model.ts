import mongoose, { Schema, Document } from "mongoose"

export interface ITicket extends Document {
  employeeId: string
  employeeName: string
  type: "advance" | "travel"
  amount?: number
  destination?: string
  travelPurpose?: string
  departureDate?: Date
  returnDate?: Date
  ticketClass?: "economy" | "business" | "first"
  reason: string
  notes?: string
  status: "Pending" | "Approved" | "Rejected"
  requestedBy: string
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
    destination: String,
    travelPurpose: String,
    departureDate: Date,
    returnDate: Date,
    ticketClass: { type: String, enum: ["economy", "business", "first"] },
    reason: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestedBy: { type: String, required: true },
    approvedBy: String,
    approvalDate: Date,
    rejectionReason: String,
  },
  { timestamps: true }
)

export default mongoose.model<ITicket>("Ticket", TicketSchema)
