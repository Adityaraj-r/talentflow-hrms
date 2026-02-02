import mongoose from "mongoose";

const requisitionSchema = new mongoose.Schema(
  {
    position: String,
    department: String,
    experience: String,
    salaryRange: String,
    reason: String,
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Requisition", requisitionSchema);
