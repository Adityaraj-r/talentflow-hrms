import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: string; 
  year: number;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, unique: true }, 
    type: { type: String, default: 'National Holiday' },
    year: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);