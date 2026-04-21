import { Schema, model, Document, Types } from 'mongoose';

/** In-app notifications (PMS-scoped types; extend enum as other modules adopt). */
export enum NotificationType {
  APPRAISAL_CYCLE_ACTIVE = 'appraisal_cycle_active',
  APPRAISAL_RESULT_PUBLISHED = 'appraisal_result_published',
  TEAM_APPRAISALS_COMPLETE = 'team_appraisals_complete',
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

export const NotificationModel = model<INotification>('Notification', NotificationSchema);
