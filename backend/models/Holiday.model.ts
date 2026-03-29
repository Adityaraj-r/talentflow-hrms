import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: "National" | "Regional" | "Company";
  country?: string;
  isPaid: boolean;
  year: number;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, unique: true },
    type: {
      type: String,
      enum: ["National", "Regional", "Company"],
      default: "National",
    },
    country: { type: String },
    isPaid: { type: Boolean, default: true },
    year: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);