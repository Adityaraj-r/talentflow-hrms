import mongoose, { Schema, Document } from "mongoose";

export interface IShift extends Document {
  name: string;         
  startTime: string;   
  endTime: string;      
  lateBuffer: number;   
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
      default: 15,
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