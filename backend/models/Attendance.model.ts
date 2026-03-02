import mongoose, { Schema, Document } from "mongoose";

export interface IBreak {
  startTime: Date;
  endTime?: Date;
  totalMinutes?: number;
}

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; 
  checkIn?: Date;
  checkOut?: Date;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Weekend";
  state: "NOT_STARTED" | "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT" | "AUTO_CLOSED";
  breaks: IBreak[];
  totalBreakMinutes: number;
  totalHours?: number;
}

const BreakSchema = new Schema<IBreak>({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  totalMinutes: { type: Number, default: 0 }
});

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Weekend"],
      default: "Present",
    },
    state: {
      type: String,
      enum: ["NOT_STARTED", "CHECKED_IN", "ON_BREAK", "CHECKED_OUT", "AUTO_CLOSED"],
      default: "CHECKED_IN",
    },
    breaks: [BreakSchema],
    totalBreakMinutes: {
      type: Number,
      default: 0,
    },
    totalHours: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>("Attendance", AttendanceSchema);