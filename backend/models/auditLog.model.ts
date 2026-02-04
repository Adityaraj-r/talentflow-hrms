import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  userId: string;
  payrollId: string;
  timestamp: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema({
  action: { type: String, required: true },
  userId: { type: String, required: true },
  payrollId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
