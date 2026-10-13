import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  requestTimestamps: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetOtpSchema = new Schema<IPasswordResetOtp>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    lastSentAt: {
      type: Date,
      required: true,
    },
    requestTimestamps: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPasswordResetOtp>('PasswordResetOtp', PasswordResetOtpSchema);
