import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
{
  jobTitle: { type: String, required: true },
  department: { type: String, required: true },
  positions: { type: Number, required: true },
  employmentType: { type: String, required: true },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ["Draft", "Published", "Closed"],
    default: "Draft"
  }
},
{ timestamps: true }
);

export default mongoose.model("Job", jobSchema);