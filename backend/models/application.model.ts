import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
{
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  resume: {
    type: String
  },

  status: {
    type: String,
    default: "Applied"
  }

},
{ timestamps: true }
)

export default mongoose.model("Application", applicationSchema)