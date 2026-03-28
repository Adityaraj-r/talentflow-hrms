import mongoose, { Schema, Document } from "mongoose";

export interface ICorrectionRequest extends Document {
  attendanceId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  requestedClockIn?: Date;
  requestedClockOut?: Date;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  month: number;
  year: number;
}

const CorrectionRequestSchema = new Schema<ICorrectionRequest>(
  {
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    requestedClockIn: { type: Date },
    requestedClockOut: { type: Date },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, trim: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

CorrectionRequestSchema.index({ requestedBy: 1, month: 1, year: 1 });

export default mongoose.model<ICorrectionRequest>("CorrectionRequest", CorrectionRequestSchema);