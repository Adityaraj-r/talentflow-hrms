import { Schema, model, Document } from 'mongoose';

// Review Status
export enum ReviewStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  APPROVED = 'approved'
}

// Competency Rating
export interface ICompetencyRating {
  name: string;
  rating: number;
  comments?: string;
}

// Interface for Performance Review
export interface IPerformanceReview extends Document {
  cycleId: Schema.Types.ObjectId;
  employeeId: Schema.Types.ObjectId;
  reviewerId: Schema.Types.ObjectId;
  status: ReviewStatus;
  competencies: ICompetencyRating[];
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string[];
  managerComments?: string;
  selfRating?: number;
  selfComments?: string;
  submittedAt?: Date;
  approvedBy?: Schema.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema Definition
const CompetencyRatingSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true
  }
}, { _id: false });

const PerformanceReviewSchema = new Schema<IPerformanceReview>(
  {
    cycleId: {
      type: Schema.Types.ObjectId,
      ref: 'PerformanceCycle',
      required: [true, 'Cycle ID is required']
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required']
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer ID is required']
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING
    },
    competencies: {
      type: [CompetencyRatingSchema],
      validate: {
        validator: function(v: ICompetencyRating[]) {
          return v && v.length > 0;
        },
        message: 'At least one competency rating is required'
      }
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    strengths: {
      type: String,
      trim: true
    },
    areasForImprovement: {
      type: String,
      trim: true
    },
    goals: [String],
    managerComments: {
      type: String,
      trim: true
    },
    selfRating: {
      type: Number,
      min: 1,
      max: 5
    },
    selfComments: {
      type: String,
      trim: true
    },
    submittedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  },
  {
    timestamps: true
  }
);

// Indexes
PerformanceReviewSchema.index({ cycleId: 1, employeeId: 1 });
PerformanceReviewSchema.index({ employeeId: 1, status: 1 });
PerformanceReviewSchema.index({ reviewerId: 1 });

// Pre-save hook: Calculate overall rating
PerformanceReviewSchema.pre('save', function(next) {
  if (this.competencies && this.competencies.length > 0) {
    const sum = this.competencies.reduce((acc, comp) => acc + comp.rating, 0);
    this.overallRating = parseFloat((sum / this.competencies.length).toFixed(2));
  }
  next();
});

// Export Model
export const PerformanceReviewModel = model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);
