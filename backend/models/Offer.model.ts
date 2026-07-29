import mongoose, { Schema, Document } from 'mongoose';

export type OfferStatus = 'Under Review' | 'Changes Requested' | 'Pending HR Manager Approval' | 'Pending CEO Approval' | 'Offered' | 'Accepted' | 'Declined' | 'Expired' | 'Joined';

export interface IOffer extends Document {
  offerId: string;
  candidateId?: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId | any;
  candidateEmail?: string;
  candidateName: string;
  position?: string;
  department?: string;
  salary: number;
  joiningDate: string;
  expiryDate?: Date;
  noticeBuyout?: number;
  bonus?: number;
  benefits?: string[];
  probationDetails?: string;
  reportingManager?: string;
  templateId?: string;
  secureLink?: string;
  sentAt?: Date;
  viewedAt?: Date;
  approvalStage?: string;
  approvalHistory?: unknown[];
  negotiationRounds?: unknown[];
  activityHistory?: unknown[];
  automationRules?: unknown[];
  compensation?: unknown;
  preOnboarding?: unknown[];
  status: OfferStatus;
  createdBy: mongoose.Types.ObjectId;
  ceoApprovedBy?: mongoose.Types.ObjectId;
  ceoApprovedAt?: Date;
  emailStatus?: 'Pending' | 'Sending' | 'Sent' | 'Failed';
  emailSentAt?: Date;
  lastEmailAttempt?: Date;
  emailFailureReason?: string;
  emailMessageId?: string;
}

const ApprovalHistorySchema = new Schema(
  {
    role: String,
    approverName: String,
    approverId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, enum: ['Submitted', 'Approved', 'Rejected', 'Changes Requested', 'Escalated'], default: 'Submitted' },
    comments: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const NegotiationRoundSchema = new Schema(
  {
    round: Number,
    originalOffer: Number,
    requestedSalary: Number,
    revisedOffer: Number,
    notes: String,
    status: { type: String, default: 'Open' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActivityHistorySchema = new Schema(
  {
    type: String,
    message: String,
    actor: String,
    priority: { type: String, default: 'normal' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AutomationRuleSchema = new Schema(
  {
    name: String,
    channel: { type: String, default: 'Email' },
    enabled: { type: Boolean, default: true },
    cadence: String,
  },
  { _id: false }
);

const PreOnboardingStepSchema = new Schema(
  {
    step: String,
    owner: String,
    status: { type: String, default: 'Pending' },
    dueDate: Date,
  },
  { _id: false }
);

const OfferSchema: Schema = new Schema({
  offerId: { type: String, required: true, unique: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'Application' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  candidateEmail: { type: String, default: '' },
  candidateName: { type: String, required: true },
  position: { type: String, default: '' },
  department: { type: String, default: '' },
  salary: { type: Number, required: true },
  joiningDate: { type: String, required: true },
  expiryDate: Date,
  noticeBuyout: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  benefits: [{ type: String }],
  probationDetails: { type: String, default: '' },
  reportingManager: { type: String, default: '' },
  templateId: { type: String, default: 'standard-offer' },
  secureLink: { type: String, default: '' },
  sentAt: Date,
  viewedAt: Date,
  approvalStage: { type: String, default: 'HR Review' },
  approvalHistory: [ApprovalHistorySchema],
  negotiationRounds: [NegotiationRoundSchema],
  activityHistory: [ActivityHistorySchema],
  automationRules: [AutomationRuleSchema],
  compensation: {
    fixedSalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    benefitsValue: { type: Number, default: 0 },
    joiningBonus: { type: Number, default: 0 },
    stockOptions: { type: Number, default: 0 },
    totalCtc: { type: Number, default: 0 },
  },
  preOnboarding: [PreOnboardingStepSchema],
  status: {
    type: String,
    enum: ['Under Review', 'Changes Requested', 'Pending HR Manager Approval', 'Pending CEO Approval', 'Offered', 'Accepted', 'Declined', 'Expired', 'Joined'],
    default: 'Offered',
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ceoApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  ceoApprovedAt: Date,
  emailStatus: {
    type: String,
    enum: ['Pending', 'Sending', 'Sent', 'Failed'],
    default: 'Pending',
  },
  emailSentAt: Date,
  lastEmailAttempt: Date,
  emailFailureReason: { type: String, default: '' },
  emailMessageId: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IOffer>('Offer', OfferSchema);
