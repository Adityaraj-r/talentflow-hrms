import mongoose, { Document, Schema } from 'mongoose';

interface IAuditLog extends Document {
  userId: string;
  userName: string;
  userRole?: string;
  action: string;
  module: string;
  details: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  ipAddress: string;
  status: 'Success' | 'Failed';
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: '' },
    action: { type: String, required: true },
    module: { type: String, required: true },
    details: { type: String, default: '' },
    beforeValue: { type: Schema.Types.Mixed, default: null },
    afterValue: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: 'unknown' },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
