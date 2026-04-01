import mongoose, { Document, Schema } from 'mongoose';

export enum GoalStatus {
  NOT_STARTED = 'not started',
  IN_PROGRESS = 'in progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IGoal extends Document {
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  weight: number;       // percentage weight e.g. 20 means 20% of total score
  status: GoalStatus;
  progress: number;     // 0-100 percent
  targetDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // Weight as percentage — all goals for an employee in a cycle should sum to 100
    weight: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 10,
    },
    status: {
      type: String,
      enum: Object.values(GoalStatus),
      default: GoalStatus.NOT_STARTED,
    },
    // Progress 0-100%
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    targetDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
GoalSchema.index({ employeeId: 1, cycleId: 1 });
GoalSchema.index({ cycleId: 1 });
GoalSchema.index({ createdBy: 1 });

export const GoalModel = mongoose.model<IGoal>('Goal', GoalSchema);
