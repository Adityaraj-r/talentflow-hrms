import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for Activity document
export interface IActivity extends Document {
  type: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approval' | 'rejection' | 'export' | 'import' |'EMPLOYEE_MANAGEMENT';
  title: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  targetModel?: 'User' | 'LeaveRequest' | 'DocumentRequest' | 'Department' | 'Payroll' | 'Attendance';
  targetId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Activity model with static methods
interface IActivityModel extends Model<IActivity> {
  logActivity(data: Partial<IActivity>): Promise<IActivity>;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'approval', 'rejection', 'export', 'import','EMPLOYEE_MANAGEMENT'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetModel: {
      type: String,
      enum: ['User', 'LeaveRequest', 'DocumentRequest', 'Department', 'Payroll', 'Attendance'],
      required: false,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

// Static method to log activity
ActivitySchema.statics.logActivity = async function (
  data: Partial<IActivity>
): Promise<IActivity> {
  try {
    return await this.create(data);
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

const Activity = mongoose.model<IActivity, IActivityModel>('Activity', ActivitySchema);

export default Activity;
