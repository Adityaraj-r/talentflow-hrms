import { Schema, model, Document } from 'mongoose';

// Performance Cycle Status
export enum CycleStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// Interface for Performance Cycle
export interface IPerformanceCycle extends Document {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: CycleStatus;
  createdBy: Schema.Types.ObjectId;
  assignedEmployees: Schema.Types.ObjectId[];
  totalReviews: number;
  completedReviews: number;
  avgScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const PerformanceCycleSchema = new Schema<IPerformanceCycle>(
  {
    name: {
      type: String,
      required: [true, 'Cycle name is required'],
      trim: true,
      minlength: [3, 'Cycle name must be at least 3 characters'],
      maxlength: [100, 'Cycle name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
      // ✅ REMOVED: Date validation - now handled in controller for better update support
    },
    status: {
      type: String,
      enum: Object.values(CycleStatus),
      default: CycleStatus.ACTIVE
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    assignedEmployees: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    completedReviews: {
      type: Number,
      default: 0,
      min: 0
    },
    avgScore: {
      type: Number,
      min: 0,
      max: 5
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
PerformanceCycleSchema.index({ status: 1, startDate: -1 });
PerformanceCycleSchema.index({ createdBy: 1 });

// Virtual: Completion Rate
PerformanceCycleSchema.virtual('completionRate').get(function(this: IPerformanceCycle) {
  if (this.totalReviews === 0) return 0;
  return Math.round((this.completedReviews / this.totalReviews) * 100);
});

// Virtual: Is Active
PerformanceCycleSchema.virtual('isActive').get(function(this: IPerformanceCycle) {
  const now = new Date();
  return this.status === CycleStatus.ACTIVE && 
         this.startDate <= now && 
         this.endDate >= now;
});

// Export Model
export const PerformanceCycleModel = model<IPerformanceCycle>('PerformanceCycle', PerformanceCycleSchema);
