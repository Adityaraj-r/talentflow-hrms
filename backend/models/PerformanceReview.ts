import mongoose, { Document, Schema } from 'mongoose';

export enum ReviewStatus {
  PENDING = 'pending',
  SELF_ASSESSMENT_DONE = 'self assessment done',
  MANAGER_REVIEW_DONE = 'manager review done',
  HR_REVIEWED = 'hr reviewed',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

export interface ICompetencyRating {
  name: string;
  rating: number;
  comments?: string;
}

export interface IPerformanceReview extends Document {
  cycleId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  status: ReviewStatus;
  competencies: ICompetencyRating[];
  overallRating: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  managerComments?: string;
  selfRating?: number;
  selfComments?: string;
  submittedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  adminFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompetencyRatingSchema = new Schema<ICompetencyRating>(
  {
    name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, trim: true },
  },
  { _id: false }
);

const PerformanceReviewSchema = new Schema<IPerformanceReview>(
  {
    cycleId: { type: Schema.Types.ObjectId, ref: 'PerformanceCycle', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
    },
    competencies: {
      type: [CompetencyRatingSchema],
      validate: {
        validator: (v: ICompetencyRating[]) => v && v.length > 0,
        message: 'At least one competency rating is required',
      },
    },
    // NOTE: not required on creation — pre-save hook calculates it from competencies on submit
    // assignReview sets it to 0; submitReview/submitManagerReview recalculates server-side
    overallRating: { type: Number, required: false, default: 0, min: 0, max: 5 },
    strengths: { type: String, trim: true },
    areasForImprovement: { type: String, trim: true },
    goals: { type: String },
    managerComments: { type: String, trim: true },
    selfRating: { type: Number, min: 1, max: 5 },
    selfComments: { type: String, trim: true },
    submittedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    adminFeedback: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Indexes — matches doc recommendation
PerformanceReviewSchema.index({ cycleId: 1, employeeId: 1 });
PerformanceReviewSchema.index({ employeeId: 1, status: 1 });
PerformanceReviewSchema.index({ reviewerId: 1 });

// Pre-save hook: auto-calculate overallRating from competency average
// NOTE: this only runs on .save() not findByIdAndUpdate — controller manually recalculates for updates
PerformanceReviewSchema.pre('save', function (next) {
  if (this.competencies && this.competencies.length > 0) {
    const sum = this.competencies.reduce((acc, comp) => acc + comp.rating, 0);
    this.overallRating = parseFloat((sum / this.competencies.length).toFixed(2));
  }
  next();
});

export const PerformanceReviewModel = mongoose.model<IPerformanceReview>(
  'PerformanceReview',
  PerformanceReviewSchema
);
