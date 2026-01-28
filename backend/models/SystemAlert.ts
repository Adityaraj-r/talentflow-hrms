import mongoose, { Document, Schema } from 'mongoose';

// Interface for SystemAlert document
export interface ISystemAlert extends Document {
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'dismissed';
  type: 'security' | 'performance' | 'maintenance' | 'error' | 'warning';
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SystemAlertSchema = new Schema<ISystemAlert>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'dismissed'],
      default: 'active',
      index: true,
    },
    type: {
      type: String,
      enum: ['security', 'performance', 'maintenance', 'error', 'warning'],
      required: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for active alerts
SystemAlertSchema.index({ status: 1, severity: -1, createdAt: -1 });

const SystemAlert = mongoose.model<ISystemAlert>('SystemAlert', SystemAlertSchema);

export default SystemAlert;
