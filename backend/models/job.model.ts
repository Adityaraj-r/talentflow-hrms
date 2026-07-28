import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
{
  jobTitle: { type: String, required: true },
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Requisition",
    default: null
  },
  department: { type: String, required: true },
  positions: { type: Number, required: true },
  hiringRoles: [
    {
      roleName: { type: String, required: true },
      openings: { type: Number, required: true, min: 1 },
      minSalary: { type: Number },
      maxSalary: { type: Number },
      experience: { type: String, default: "" },
      skills: { type: String, default: "" },
      filled: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ["Open", "Closed"],
        default: "Open"
      }
    }
  ],
  employmentType: { type: String, required: true },
  description: { type: String, default: "" },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ["Draft", "Published", "Closed"],
    default: "Draft"
  },
  autoClosedByHiringProgress: { type: Boolean, default: false }
},
{ timestamps: true }
);

export default mongoose.model("Job", jobSchema);
