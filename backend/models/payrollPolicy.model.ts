import { Schema, model, Types } from 'mongoose';

export interface ISlab {
  min: number;
  max: number | null; // null = no upper bound
  rate: number;        // percentage
}

interface IPayrollPolicy {
  policyType: 'TAX_SLAB' | 'PF_RATE' | 'ESI_RATE' | 'PT_SLAB';
  state?: string;                 // required only for PT_SLAB — stored normalized (trim + lowercase)
  version: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
  rules: {
    slabs?: ISlab[];              // TAX_SLAB, PT_SLAB
    standardDeduction?: number;   // TAX_SLAB
    employeeRate?: number;        // PF_RATE / ESI_RATE
    employerRate?: number;        // PF_RATE / ESI_RATE
    wageCeiling?: number;         // PF_RATE
    eligibilityThreshold?: number;// ESI_RATE
  };
  changeNote: string;
  createdBy: Types.ObjectId;
}

const payrollPolicySchema = new Schema<IPayrollPolicy>({
  policyType: { type: String, enum: ['TAX_SLAB', 'PF_RATE', 'ESI_RATE', 'PT_SLAB'], required: true },
  state: { type: String, default: null },   // normalized (lowercase, trimmed) before saving
  version: { type: Number, required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  rules: { type: Schema.Types.Mixed, required: true },
  changeNote: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// compound index — lookups always filter by policyType + state + effectiveFrom together
payrollPolicySchema.index({ policyType: 1, state: 1, effectiveFrom: -1 });

export const PayrollPolicy = model<IPayrollPolicy>('PayrollPolicy', payrollPolicySchema);