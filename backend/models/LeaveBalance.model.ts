import mongoose, { Schema, Document } from "mongoose";
import { LeaveTypeName } from "./LeavePolicy.model";

export interface ILeaveBalanceEntry {
  leaveType: LeaveTypeName;
  allocated: number;
  used: number;
  remaining: number;
  carriedForward: number;
}

export interface ILeaveBalance extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  balances: ILeaveBalanceEntry[];
  lastSyncedAt: Date;
}

const LeaveBalanceEntrySchema = new Schema<ILeaveBalanceEntry>(
  {
    leaveType: {
      type: String,
      enum: [
        "Casual",
        "Sick",
        "Earned",
        "Maternity",
        "Paternity",
        "LWP",
        "Annual",
        "Compassionate",
        "Haj",
        "Iddah",
      ],
      required: true,
    },
    allocated: { type: Number, default: 0 },
    used: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 },
    carriedForward: { type: Number, default: 0 },
  },
  { _id: false }
);

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    balances: [LeaveBalanceEntrySchema],
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

export default mongoose.model<ILeaveBalance>("LeaveBalance", LeaveBalanceSchema);