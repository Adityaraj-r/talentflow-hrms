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
      enum: ["Invited", "Applied", "Expired", "Cancelled"],
      default: "Invited",
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
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
  },
  { timestamps: true }
);

export default mongoose.models.Referral || mongoose.model("Referral", referralSchema);
