import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  checkIn?: Date;
  checkOut?: Date;
  status: "Present" | "Absent" | "Late" | "Half Day" | "Weekend";
  totalHours?: number;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Speeds up queries when searching attendance by specific employee
    },

    // We use a String (YYYY-MM-DD) instead of a Date object here to prevent 
    // timezone shifts from moving an entry to the previous or next day.
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

    totalHours: {
      type: Number, // Calculated as a decimal (e.g., 8.5 for 8 hours 30 mins)
    },
  },
  {
    // Auto-generates createdAt and updatedAt. 
    // createdAt is useful for sorting the "latest" check-ins.
    timestamps: true,
  }
);

// CRITICAL: This prevents a user from having two attendance records on the same day.
// It acts as our final line of defense for data integrity.
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IAttendance>(
  "Attendance",
  AttendanceSchema
);