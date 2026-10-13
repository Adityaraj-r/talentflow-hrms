import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    referredByEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    candidatePhone: {
      type: String,
      default: "",
      trim: true,
    },
    resume: {
      type: String,
      default: "",
    },
    relationship: {
      type: String,
      default: "",
      trim: true,
    },
    referralNote: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Invited",
        "Applied",
        "In Process",
        "Selected",
        "Successful",
        "Rejected",
        "Withdrawn",
        "Expired",
        "Conflict",
      ],
      default: "Invited",
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
    },
    invitationType: {
      type: String,
      enum: ["Email", "ShareableLink"],
      default: "Email",
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReferralReward",
      default: null,
    },
    invitationToken: {
      type: String,
      required: true,
      unique: true,
    },
    invitationExpiry: {
      type: Date,
      required: true,
    },
    conflictStatus: {
      type: String,
      enum: ["None", "Conflict_Detected", "Resolved"],
      default: "None",
    },
    conflictDetails: [
      {
        referredByEmployeeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Employee",
        },
        referredAt: {
          type: Date,
          default: Date.now,
        },
        relationship: { type: String, default: "" },
        referralNote: { type: String, default: "" },
        notes: { type: String, default: "" },
      },
    ],
    resolvedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
      chosenReferrerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      notes: { type: String, default: "" },
    },
    firstReviewedAt: {
      type: Date,
      default: null,
    },
    firstReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resendHistory: [
      {
        resentAt: { type: Date, default: Date.now },
        resentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        previousTokenHash: { type: String, required: true },
        newExpiry: { type: Date, required: true },
      },
    ],
    resumeText: {
      type: String,
      default: "",
    },
    aiAnalysis: {
      matchScore: { type: Number, default: 0 },
      skillsScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      roleRelevanceScore: { type: Number, default: 0 },
      matchedSkills: [{ type: String }],
      missingSkills: [{ type: String }],
      explanation: { type: String, default: "" },
      analyzedAt: { type: Date },
    },
  },
  { timestamps: true }
);

referralSchema.index({ jobId: 1, candidateEmail: 1 });
referralSchema.index({ jobId: 1, candidatePhone: 1 });
referralSchema.index({ referredByEmployeeId: 1, status: 1 });

export default mongoose.models.Referral || mongoose.model("Referral", referralSchema);
