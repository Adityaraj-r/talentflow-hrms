import mongoose from "mongoose";

const referralRewardSchema = new mongoose.Schema(
  {
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    bonusAmount: {
      type: Number,
      default: 10000,
    },
    currency: {
      type: String,
      default: "INR",
    },
    probationDays: {
      type: Number,
      default: 90,
    },
    hiredDate: {
      type: Date,
      default: Date.now,
    },
    probationEndDate: {
      type: Date,
    },
    isProbationCompleted: {
      type: Boolean,
      default: false,
    },
    rewardStatus: {
      type: String,
      enum: [
        "Pending_Probation",
        "Eligible",
        "HR_Approved",
        "Finance_Approved",
        "Paid",
        "Ineligible",
      ],
      default: "Pending_Probation",
    },
    approvedByHR: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: { type: Date },
    },
    approvedByFinance: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      approvedAt: { type: Date },
    },
    payrollPeriod: {
      month: { type: Number },
      year: { type: Number },
      payrollId: { type: mongoose.Schema.Types.ObjectId, ref: "Payroll" },
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ReferralReward ||
  mongoose.model("ReferralReward", referralRewardSchema);
