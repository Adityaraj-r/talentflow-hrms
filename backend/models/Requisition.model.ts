import mongoose from "mongoose";

const requisitionSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    experience: String,

    salaryRange: String,

    reason: String,

    urgency: {
      type: String,
      enum: ["High", "Normal", "Low"],
      default: "Normal",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    finalApprovalRequired: {
      type: Boolean,
      default: false,
    },

    finalApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    finalApprovalDate: Date,

    approvalDate: Date,

    recommendations: [
      {
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdByRole: { type: String },
      },
    ],

    approvalHistory: [
      {
        action: { type: String, enum: ["approved", "rejected"], required: true },
        at: { type: Date, default: Date.now },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Requisition", requisitionSchema);
