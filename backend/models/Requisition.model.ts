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

    approvalDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Requisition", requisitionSchema);
