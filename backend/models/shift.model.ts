import mongoose, { Schema, Document } from "mongoose";

export interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  isActive: boolean;
  assignedTo: mongoose.Types.ObjectId[];
}

const ShiftSchema = new Schema<IShift>(
  {
    name: { type: String, required: true, unique: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    graceMinutes: { type: Number, default: 15, min: 0 },
    isActive: { type: Boolean, default: true },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

export default mongoose.model<IShift>("Shift", ShiftSchema);
