import mongoose, { Schema, Document } from "mongoose";

export type LeaveTypeName =
  | "Casual"
  | "Sick"
  | "Earned"
  | "Maternity"
  | "Paternity"
  | "LWP"
  | "Annual"
  | "Compassionate"
  | "Haj"
  | "Iddah";

export interface ILeavePolicy extends Document {
  leaveType: LeaveTypeName;
  description: string;
  annualLimit: number;
  carryForward: boolean;
  maxCarryForwardDays: number;
  applicableTo: "All" | "Male" | "Female";
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const LeavePolicySchema = new Schema<ILeavePolicy>(
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
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    annualLimit: {
      type: Number,
      required: true,
      min: 0,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    maxCarryForwardDays: {
      type: Number,
      default: 0,
    },
    applicableTo: {
      type: String,
      enum: ["All", "Male", "Female"],
      default: "All",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ILeavePolicy>("LeavePolicy", LeavePolicySchema);