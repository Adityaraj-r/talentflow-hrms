import mongoose, { Document, Schema } from 'mongoose';

/** @deprecated Prefer WorkflowStage strings; kept for backward compatibility */
export enum ReviewStatus {
  PENDING = 'pending',
  SELF_ASSESSMENT_DONE = 'self assessment done',
  MANAGER_REVIEW_DONE = 'manager review done',
  HR_REVIEWED = 'hr reviewed',
  COMPLETED = 'completed',
  APPROVED = 'approved',
}

/** All values accepted in DB (legacy + canonical workflow). Validated on transition in services. */
export const REVIEW_STATUS_STORAGE = [
  ...Object.values(ReviewStatus),
  'goals_pending',
  'goals_locked',
  'self_assessment_done',
  'manager_review_done',
  'hr_reviewed',
  'ceo_reviewed',
  'calibrated',
  'final_approved',
  'feedback_released',
] as const;

export interface ICompetencyRating {
  name: string;
  rating: number;
  comments?: string;
}

export interface IPerformanceReview extends Document {
  cycleId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  status: string;
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
  requiresCeoReview?: boolean;
  ceoReviewerId?: mongoose.Types.ObjectId;
  ceoComments?: string;
  ceoReviewedAt?: Date;
  calibrationNotes?: string;
  calibratedAt?: Date;
  calibratedBy?: mongoose.Types.ObjectId;
  feedbackReleasedAt?: Date;
  immutableLockedAt?: Date;
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
      enum: REVIEW_STATUS_STORAGE,
      default: 'goals_pending',
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
    requiresCeoReview: { type: Boolean, default: false },
    ceoReviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
    ceoComments: { type: String, trim: true, default: '' },
    ceoReviewedAt: { type: Date },
    calibrationNotes: { type: String, trim: true, default: '' },
    calibratedAt: { type: Date },
    calibratedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    feedbackReleasedAt: { type: Date },
    immutableLockedAt: { type: Date },
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
