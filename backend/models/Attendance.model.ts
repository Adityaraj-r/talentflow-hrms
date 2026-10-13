import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  startTime: Date;
  endTime?: Date;
  totalMinutes?: number;
}

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: string;
  clockIn?: Date;
  clockOut?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: "Present" | "Absent" | "Half Day" | "Late" | "Leave" | "Holiday" | "Weekend";
  state: "NOT_STARTED" | "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT" | "AUTO_CLOSED";
  breaks: IBreak[];
  totalBreakMinutes: number;
  totalHours?: number;
  overtimeHours?: number;
  isOtApproved: boolean;
  otApprovedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  isLocked: boolean;
  notes?: string;
}

const BreakSchema = new Schema<IBreak>({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  totalMinutes: { type: Number, default: 0 },
});

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    clockIn: { type: Date },
    clockOut: { type: Date },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "Late", "Leave", "Holiday", "Weekend"],
      default: "Present",
    },
    state: {
      type: String,
      enum: ["NOT_STARTED", "CHECKED_IN", "ON_BREAK", "CHECKED_OUT", "AUTO_CLOSED"],
      default: "NOT_STARTED",
    },
    breaks: [BreakSchema],
    totalBreakMinutes: { type: Number, default: 0 },
    totalHours: { type: Number },
    overtimeHours: { type: Number, default: 0 },
    isOtApproved: { type: Boolean, default: false },
    otApprovedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    isLocked: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ isOtApproved: 1, overtimeHours: 1 });

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);