import mongoose, { Schema, Document } from "mongoose";

export interface IShift extends Document {
  name: string;         // e.g., "General Shift", "Night Shift"
  startTime: string;    // e.g., "09:00" (24-hour format)
  endTime: string;      // e.g., "18:00"
  lateBuffer: number;   // Minutes allowed before marking "Late" (e.g., 15)
  isActive: boolean;
}

const ShiftSchema = new Schema<IShift>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true 
    },
    startTime: { 
      type: String, 
      required: true 
    },
    endTime: { 
      type: String, 
      required: true 
    },
    lateBuffer: { 
      type: Number, 
      default: 15, // Default 15 minutes grace period
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IShift>("Shift", ShiftSchema);