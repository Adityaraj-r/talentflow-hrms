import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  status: "TO_DO" | "IN_PROGRESS" | "DONE";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate: Date;
  createdBy: mongoose.Types.ObjectId;
  interviewDetails?: {
    candidateName: string;
    interviewerName: string;
    interviewDate: string;
    startTime: string;
    endTime: string;
    mode: string;
    meetingLink: string;
    instructions: string[];
    interviewStatus: string;
  };
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["TO_DO", "IN_PROGRESS", "DONE"],
      default: "TO_DO",
    },

    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },

    dueDate: { type: Date, required: true },

    interviewDetails: {
      candidateName: { type: String },
      interviewerName: { type: String },
      interviewDate: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      mode: { type: String },
      meetingLink: { type: String },
      instructions: { type: [String], default: [] },
      interviewStatus: { type: String },
      applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
      resume: { type: String },
      candidateEmail: { type: String },
      candidatePhone: { type: String },
      jobTitle: { type: String },
      department: { type: String }
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITask>("Task", TaskSchema);