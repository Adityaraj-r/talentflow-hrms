import { Schema, model, Document, Types } from 'mongoose';

/**
 * Extended appraisal lifecycle layered on PerformanceCycle (PMS reviews stay on PerformanceReview + PerformanceCycle).
 * Status: DRAFT → ACTIVE → CLOSED → PROCESSED
 */
export enum AppraisalCycleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  PROCESSED = 'processed',
}

export interface IAppraisalCycle extends Document {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: AppraisalCycleStatus;
  /** One-to-one link — canonical review data lives on this PerformanceCycle */
  performanceCycleId: Types.ObjectId;
  createdBy: Types.ObjectId;
  closedAt?: Date;
  closedBy?: Types.ObjectId;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
  /** Idempotency token for bonus payroll run (set when CLOSED → PROCESSED completes) */
  bonusRunId?: string;
  /** Avoid duplicate in-app broadcasts */
  broadcastActiveSentAt?: Date;
  broadcastProcessedSentAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AppraisalCycleSchema = new Schema<IAppraisalCycle>(
  {
    name: {
      type: String,
      required: [true, 'Appraisal cycle name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: { type: Date, required: [true, 'End date is required'] },
    status: {
      type: String,
      enum: Object.values(AppraisalCycleStatus),
      default: AppraisalCycleStatus.DRAFT,
    },
    performanceCycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
      required: [true, 'performanceCycleId is required'],
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    closedAt: { type: Date, default: null },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    bonusRunId: { type: String, trim: true, default: null },
    broadcastActiveSentAt: { type: Date, default: null },
    broadcastProcessedSentAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AppraisalCycleSchema.index({ status: 1, startDate: -1 });
AppraisalCycleSchema.index({ performanceCycleId: 1 }, { unique: true });
AppraisalCycleSchema.index({ createdBy: 1 });
AppraisalCycleSchema.index({ isDeleted: 1 });

export const AppraisalCycleModel = model<IAppraisalCycle>('AppraisalCycle', AppraisalCycleSchema);
