import mongoose, { Document, Schema } from 'mongoose';

export enum PIPStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface IPIPMilestone {
  title: string;
  targetDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IPIP extends Document {
  employeeId: mongoose.Types.ObjectId;
  cycleId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;        // HR Manager who created it
  reviewerId?: mongoose.Types.ObjectId;      // Direct/Dept Manager monitoring it
  reason: string;                            // Why the PIP was created
  improvementAreas: string[];               // List of areas to improve
  milestones: IPIPMilestone[];              // Checkpoints
  startDate: Date;
  endDate: Date;
  status: PIPStatus;
  hrNotes?: string;                          // HR Manager notes
  managerNotes?: string;                     // Reviewing manager notes
  outcome?: string;                          // Final outcome notes on close
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PIPMilestoneSchema = new Schema<IPIPMilestone>(
  {
    title: { type: String, required: true, trim: true },
    targetDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

const PIPSchema = new Schema<IPIP>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    improvementAreas: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v && v.length > 0,
        message: 'At least one improvement area is required',
      },
    },
    milestones: {
      type: [PIPMilestoneSchema],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PIPStatus),
      default: PIPStatus.ACTIVE,
    },
    hrNotes: {
      type: String,
      trim: true,
    },
    managerNotes: {
      type: String,
      trim: true,
    },
    outcome: {
      type: String,
      trim: true,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
PIPSchema.index({ employeeId: 1, status: 1 });
PIPSchema.index({ createdBy: 1 });
PIPSchema.index({ reviewerId: 1 });

export const PIPModel = mongoose.model<IPIP>('PIP', PIPSchema);
