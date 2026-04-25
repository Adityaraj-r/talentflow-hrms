import mongoose, { Schema, Document } from 'mongoose';

export interface IOffboardingRequest extends Document {
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    type: 'Resignation' | 'Termination' | 'Layoff' | 'Retirement';
    reason: string;
    proposedExitDate: Date;
    initiatedBy: string;
    status: 'Pending Manager Approval' | 'Pending HR Clearance' | 'Pending Country Manager' | 'Pending CEO' | 'Approved' | 'Rejected';
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

const OffboardingRequestSchema: Schema = new Schema({
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['Resignation', 'Termination', 'Layoff', 'Retirement'], 
        required: true 
    },
    reason: { type: String, required: true },
    proposedExitDate: { type: Date, required: true },
    initiatedBy: { type: String, required: true },
    status: { 
        type: String, 
        enum: [
            'Pending Manager Approval', 
            'Pending HR Clearance', 
            'Pending Country Manager', 
            'Pending CEO', 
            'Approved', 
            'Rejected'
        ], 
        default: 'Pending Manager Approval',
        index: true
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

OffboardingRequestSchema.index({ createdAt: -1 });

export default mongoose.model<IOffboardingRequest>('OffboardingRequest', OffboardingRequestSchema);