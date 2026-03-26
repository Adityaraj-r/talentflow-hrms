import mongoose, { Document, Schema } from 'mongoose';

export interface IRecruitmentSuggestion extends Document {
  subject: string;
  message: string;
  contextType: 'general' | 'requisition' | 'job' | 'application' | 'candidate' | 'offer' | 'onboarding';
  contextRef?: string;
  createdBy: mongoose.Types.ObjectId;
  status: 'open' | 'acknowledged' | 'closed';
  acknowledgedAt?: Date;
  acknowledgedBy?: mongoose.Types.ObjectId;
  hrNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecruitmentSuggestionSchema = new Schema<IRecruitmentSuggestion>(
  {
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 8000 },
    contextType: {
      type: String,
      enum: ['general', 'requisition', 'job', 'application', 'candidate', 'offer', 'onboarding'],
      default: 'general',
    },
    contextRef: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'closed'],
      default: 'open',
    },
    acknowledgedAt: { type: Date },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    hrNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

RecruitmentSuggestionSchema.index({ status: 1, createdAt: -1 });
RecruitmentSuggestionSchema.index({ createdBy: 1 });

export default mongoose.model<IRecruitmentSuggestion>(
  'RecruitmentSuggestion',
  RecruitmentSuggestionSchema
);
