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
  TASK_ASSIGNED = 'task_assigned',
  TASK_IN_PROGRESS = 'task_in_progress',
  TASK_COMPLETED = 'task_completed',
  LEAVE_REQUESTED = "leave_requested",
  LEAVE_APPROVED = "leave_approved",
  LEAVE_REJECTED = "leave_rejected",
  DISCIPLINARY_CASE_CREATED = "disciplinary_case_created",
  DISCIPLINARY_REVIEW_REQUESTED = "disciplinary_review_requested",
  DISCIPLINARY_CASE_IN_PROGRESS = "disciplinary_case_in_progress",
  DISCIPLINARY_CASE_COMPLETED = "disciplinary_case_completed",
  TRANSFER_REQUESTED = "transfer_requested",
  TRANSFER_MANAGER_RECOMMENDATION = "transfer_manager_recommendation",
  TRANSFER_APPROVED = "transfer_approved",
  TRANSFER_REJECTED = "transfer_rejected",
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
