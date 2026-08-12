import { Schema, model, Document, Types } from 'mongoose';

/** In-app notifications (PMS-scoped types; extend enum as other modules adopt). */
export enum NotificationType {
  APPRAISAL_CYCLE_ACTIVE = 'appraisal_cycle_active',
  APPRAISAL_RESULT_PUBLISHED = 'appraisal_result_published',
  TEAM_APPRAISALS_COMPLETE = 'team_appraisals_complete',
  RESIGNATION_WITHDRAWN = 'resignation_withdrawn',
  PAYROLL_REJECTED = 'payroll_rejected',
  PAYROLL_PENDING_CEO_APPROVAL = 'payroll_pending_ceo_approval',
  PAYROLL_PENDING_FINANCE_APPROVAL = 'payroll_pending_finance_approval',
  INDEMNITY_REJECTED = 'indemnity_rejected',
  INDEMNITY_PENDING_HR_APPROVAL = 'indemnity_pending_hr_approval',
  INDEMNITY_PENDING_CEO_APPROVAL = 'indemnity_pending_ceo_approval',
  INDEMNITY_APPROVED = 'indemnity_approved',
  INDEMNITY_RESUBMITTED = 'indemnity_resubmitted',
  INDEMNITY_PENDING_FINANCE_APPROVAL = 'indemnity_pending_finance_approval',
  TICKET_PENDING_FINANCE_APPROVAL = 'ticket_pending_finance_approval',
  TICKET_PENDING_PAYROLL_APPROVAL = 'ticket_pending_payroll_approval',
  TICKET_APPROVED = 'ticket_approved',
  TICKET_REJECTED = 'ticket_rejected',
  REFERRAL_SUBMITTED = 'referral_submitted',
  REFERRAL_STATUS_UPDATED = 'referral_status_updated',
  REFERRAL_CANDIDATE_HIRED = 'referral_candidate_hired',
  REFERRAL_REWARD_CREATED = 'referral_reward_created',
  REFERRAL_PROBATION_PASSED = 'referral_probation_passed',
  REFERRAL_REWARD_APPROVED = 'referral_reward_approved',
  REFERRAL_REWARD_PAID = 'referral_reward_paid',
  REFERRAL_EXPIRING_SOON = 'referral_expiring_soon',
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: Date;
  /** Arbitrary refs: appraisalCycleId, performanceCycleId, reviewId, managerId, etc. */
  metadata?: Record<string, unknown>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Title too long'],
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: [4000, 'Body too long'],
    },
    readAt: { type: Date, default: null },
    metadata: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isDeleted: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days — ADD THIS

export const NotificationModel = model<INotification>('Notification', NotificationSchema);
