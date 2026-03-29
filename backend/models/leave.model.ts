import mongoose, { Schema, Document } from "mongoose";

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  leaveType: "Casual" | "Sick" | "Earned" | "Maternity" | "Paternity" | "LWP" | "Annual" | "Compassionate" | "Haj" | "Iddah";
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leaveType: {
      type: String,
      enum: ["Casual", "Sick", "Earned", "Maternity", "Paternity", "LWP", "Annual", "Compassionate", "Haj", "Iddah"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ILeave>("Leave", LeaveSchema);