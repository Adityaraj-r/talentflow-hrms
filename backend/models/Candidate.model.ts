import mongoose, { Schema, Document } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  email?: string;
  phone?: string;
  position: string;
  experience: string;
  stage: string;
  rejectReason?: string;
  createdAt: Date;

}

const CandidateSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    position: { type: String, required: true },
    experience: String,
    stage: {
      type: String,
      enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
      default: "Applied"
    },
    rejectReason: {
      type: String,
      default: null
    },
    
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>("Candidate", CandidateSchema);
