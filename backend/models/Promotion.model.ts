import mongoose, { Schema, Document } from 'mongoose';

export interface IPromotion extends Document {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    currentDesignation: string;
    currentRole: string;
    currentSalary: number;
    reportingManager: string;
    newDesignation: string;
    newRole: string;
    newSalary: number;
    effectiveDate: Date;
    justification: string;
    nominatedBy: string;
    status: {
        type: String,
        enum: [
            'Pending HR Review', 
            'Pending Country Manager', 
            'Pending CEO', 
            'Re-verify', 
            'Approved', 
            'Rejected'
        ],
        default: 'Pending HR Review'
    },
    adminRemarks?: string;
    actionedBy?: string;
    actionedAt?: Date;
    auditLog: Array<{
        action: string;
        by: string;
        remarks?: string;
        timestamp: Date;
    }>;
}

const PromotionSchema: Schema = new Schema({
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String, required: true, index: true },
    currentDesignation: { type: String, required: true },
    currentRole: { type: String, required: true },
    currentSalary: { type: Number, required: true },
    reportingManager: { type: String, required: true },
    newDesignation: { type: String, required: true },
    newRole: { type: String, required: true },
    newSalary: { type: Number, required: true },
    effectiveDate: { type: Date, required: true },
    justification: { type: String, required: true },
    nominatedBy: { type: String, required: true },
    status: {
        type: String,
        enum: [
            'Pending HR Review', 
            'Pending Country Manager', 
            'Pending CEO', 
            'Re-verify', 
            'Approved', 
            'Rejected'
        ],
        default: 'Pending HR Review'
    },
    adminRemarks: { type: String, default: "" },
    actionedBy: { type: String },
    actionedAt: { type: Date },
    auditLog: [{
        action: { type: String, required: true },
        by: { type: String, required: true },
        remarks: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

PromotionSchema.index({ createdAt: -1 });

export default mongoose.model<IPromotion>('Promotion', PromotionSchema);