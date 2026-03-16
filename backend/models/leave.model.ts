import mongoose, { Schema, Document } from "mongoose";

export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  leaveType: "Sick" | "Casual" | "Annual" | "Unpaid";
  startDate: Date;
  endDate: Date;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  approvedBy?: mongoose.Types.ObjectId; 
  adminComment?: string; 
}

const LeaveSchema = new Schema<ILeave>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    leaveType: {
      type: String,
      enum: ["Sick", "Casual", "Annual", "Unpaid"],
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },

    adminComment: { type: String },
  },
  { 
    timestamps: true 
  }
);

export default mongoose.model<ILeave>("Leave", LeaveSchema);