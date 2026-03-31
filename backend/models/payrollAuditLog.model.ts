import mongoose, { Schema, Document } from "mongoose"

export interface IPayrollAuditLog extends Document {
  action: string
  entityType: string
  entityId: string
  actorUserId: string
  actorEmail?: string
  actorRole?: string
  ip?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

const PayrollAuditLogSchema = new Schema<IPayrollAuditLog>(
  {
    action:      { type: String, required: true, index: true },
    entityType:  { type: String, required: true },
    entityId:    { type: String, required: true, index: true },
    actorUserId: { type: String, required: true },
    actorEmail:  String,
    actorRole:   String,
    ip:          String,
    before:      { type: Schema.Types.Mixed },
    after:       { type: Schema.Types.Mixed },
    metadata:    { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

PayrollAuditLogSchema.index({ createdAt: -1 })

export default mongoose.model<IPayrollAuditLog>("PayrollAuditLog", PayrollAuditLogSchema)
