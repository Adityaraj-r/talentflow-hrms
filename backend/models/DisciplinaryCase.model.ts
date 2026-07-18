import mongoose, { Document, Schema } from "mongoose"; /*comment*/

export type DisciplinaryStatus = "Pending Review" | "In Progress" | "Completed";

export interface IDisciplinaryCase extends Document {
  caseId: string;
  employeeId: string;
  category: string;
  incidentDate: Date;
  description: string;
  attachment?: string;
  hrRemarks?: string;
  managerReview?: string;
  managerReviewRequested: boolean;
  status: DisciplinaryStatus;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DisciplinaryCaseSchema = new Schema<IDisciplinaryCase>(
  {
    caseId: { type: String, required: true, unique: true, trim: true },
    employeeId: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    incidentDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true },
    attachment: { type: String, default: null },
    hrRemarks: { type: String, default: "", trim: true },
    managerReview: { type: String, default: "", trim: true },
    managerReviewRequested: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["Pending Review", "In Progress", "Completed"],
      default: "Pending Review",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

DisciplinaryCaseSchema.index({ employeeId: 1, createdAt: -1 });
DisciplinaryCaseSchema.index({ status: 1, createdAt: -1 });
DisciplinaryCaseSchema.index({ managerReviewRequested: 1, createdAt: -1 });

export default mongoose.model<IDisciplinaryCase>(
  "DisciplinaryCase",
  DisciplinaryCaseSchema
);
