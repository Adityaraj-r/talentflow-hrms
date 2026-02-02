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
    // Links the leave request to a specific employee profile.
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    leaveType: {
      type: String,
      enum: ["Sick", "Casual", "Annual", "Unpaid"],
      required: true,
    },

    // Note: Frontend should handle date validation to ensure startDate < endDate 
    // before hitting the API, but we store them as full Date objects for range queries.
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending", // Every new request sits in the manager's queue as Pending.
    },

    // Reference to the Admin or HR who processed the request. 
    // Useful for audit logs if multiple people have admin access.
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Essential for Rejections so the employee knows why their request was denied.
    adminComment: { type: String },
  },
  { 
    // Provides 'createdAt' (submission date) and 'updatedAt' (approval/rejection date).
    timestamps: true 
  }
);

export default mongoose.model<ILeave>("Leave", LeaveSchema);