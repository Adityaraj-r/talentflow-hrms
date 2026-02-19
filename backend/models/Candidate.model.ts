import mongoose, { Schema, Document } from "mongoose";

export interface ICandidate extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position: string;
  experience?: string;
  stage: string;
  rejectReason?: string;
  createdAt: Date;
}

const CandidateSchema: Schema = new Schema(
  {
    firstName:    { type: String, required: true },
    lastName:     { type: String, required: true },
    email:        { type: String },
    phone:        { type: String },
    position:     { type: String, required: true },
    experience:   { type: String },
    stage: {
      type: String,
      enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
      default: "Applied"
    },
    rejectReason: { type: String, default: null }
  },
  { timestamps: true }
);

export default mongoose.model<ICandidate>("Candidate", CandidateSchema);
