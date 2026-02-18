import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  module: {
    type: String,
    required: true
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  }
}, { timestamps: true });

export default mongoose.model('AuditLog', AuditLogSchema);