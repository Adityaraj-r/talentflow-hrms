import mongoose, { Document, Schema } from "mongoose";

export interface IReferralPolicy extends Document {
  programEnabled: boolean;
  invitationExpiryDays: number;
  shareableLinkExpiryDays: number;
  minEmployeeTenureDays: number;
  probationDurationDays: number;
  maxActiveReferralsPerEmployee: number;
  defaultBonusAmount: number;
  currency: string;
  reviewSlaHours: number;
  probationEligibilityRule: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const referralPolicySchema = new Schema<IReferralPolicy>(
  {
    programEnabled: {
      type: Boolean,
      default: true,
    },
    invitationExpiryDays: {
      type: Number,
      default: 14,
      min: 1,
    },
    shareableLinkExpiryDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    minEmployeeTenureDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    probationDurationDays: {
      type: Number,
      default: 90,
      min: 0,
    },
    maxActiveReferralsPerEmployee: {
      type: Number,
      default: 10,
      min: 1,
    },
    defaultBonusAmount: {
      type: Number,
      default: 10000,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    reviewSlaHours: {
      type: Number,
      default: 48,
      min: 1,
    },
    probationEligibilityRule: {
      type: String,
      default: "Employee must complete probation period and be in Active status at payout.",
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ReferralPolicy ||
  mongoose.model<IReferralPolicy>("ReferralPolicy", referralPolicySchema);
