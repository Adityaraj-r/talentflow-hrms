import mongoose, { Schema, Document } from 'mongoose';

export interface IOffboardingRequest extends Document {
    employeeId: string;
    employeeName: string;
    department: string;
    designation: string;
    type: 'Resignation' | 'Termination' | 'Layoff' | 'Retirement';
    reason: string;
    priority: 'Normal' | 'High';
    
    // Detailed Statuses
    status: 'Pending Approval' | 'Pending Manager Approval' | 'Pending HR Approval' | 'Pending Country Manager Approval' | 'Pending CEO Approval' | 'On Notice Period' | 'Exit Clearance' | 'Exited' | 'Terminated' | 'Rejected' | 'Withdrawn' | 'Approved';
    
    // Notice Period Tracking
    noticePeriod: {
        proposedExitDate: Date;
        approvedExitDate?: Date;
        totalDaysRequired: number;
        daysWaived: number;
    };

    // Approval Timeline
    approvals: {
        manager: { status: 'Pending'|'Approved'|'Rejected', by?: string, date?: Date, remarks?: string };
        hr: { status: 'Pending'|'Approved'|'Rejected', by?: string, date?: Date, remarks?: string };
        countryManager: { status: 'Pending'|'Approved'|'Rejected', by?: string, date?: Date, remarks?: string };
        ceo: { status: 'Pending'|'Approved'|'Rejected', by?: string, date?: Date, remarks?: string };
    };

    // Exit Clearance Checklist
    clearance: {
        it: { status: 'Pending'|'Cleared', by?: string, date?: Date };
        finance: { status: 'Pending'|'Cleared', by?: string, date?: Date };
        admin: { status: 'Pending'|'Cleared', by?: string, date?: Date };
        manager: { status: 'Pending'|'Cleared', by?: string, date?: Date };
    };

    // Asset Return Tracking
    assets: Array<{
        assetName: string;
        assetType: 'Laptop' | 'ID Card' | 'Access Card' | 'Other';
        status: 'Pending' | 'Returned' | 'Lost/Damaged';
        remarks?: string;
    }>;

    // Knowledge Transfer (KT)
    knowledgeTransfer: {
        status: 'Pending' | 'In Progress' | 'Completed';
        assignedReplacementId?: string; 
        managerSignOff: boolean;
    };

    // Full & Final (FnF) Settlement
    fnfSettlement: {
        status: 'Pending' | 'Processing' | 'Settled';
        amount?: number;
        settlementDate?: Date;
    };

    // Access Revocation
    accessRevocation: {
        email: boolean;
        vpn: boolean;
        hrms: boolean;
        github: boolean;
        slack: boolean;
        completedAt?: Date;
    };

    // Exit Documents
    documents: {
        resignationLetterPath?: string;
        relievingLetterPath?: string;
        experienceLetterPath?: string;
        nocPath?: string;
    };

    // Exit Interview
    exitInterview: {
        status: 'Pending' | 'Scheduled' | 'Completed';
        feedbackScore?: number;
        notes?: string;
    };

    initiatedBy: string;
    actionedBy?: string;
    actionedAt?: Date;

    auditLog: Array<{ action: string, by: string, remarks?: string, timestamp: Date }>;
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
    priority: { type: String, enum: ['Normal', 'High'], default: 'Normal' },
    
    status: { 
        type: String, 
        enum: [
            'Pending Approval',
            'Pending Manager Approval', 
            'Pending HR Approval', 
            'Pending Country Manager Approval', 
            'Pending CEO Approval', 
            'Approved', 
            'On Notice Period',
            'Exit Clearance',
            'Exited',
            'Terminated',
            'Rejected',
            'Withdrawn'
        ], 
        default: 'Pending Manager Approval',
        index: true
    },

    noticePeriod: {
        proposedExitDate: { type: Date, required: true },
        approvedExitDate: { type: Date },
        totalDaysRequired: { type: Number, default: 0 },
        daysWaived: { type: Number, default: 0 }
    },

    approvals: {
        manager: {
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            by: { type: String },
            date: { type: Date },
            remarks: { type: String }
        },
        hr: {
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            by: { type: String },
            date: { type: Date },
            remarks: { type: String }
        },
        countryManager: {
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            by: { type: String },
            date: { type: Date },
            remarks: { type: String }
        },
        ceo: {
            status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
            by: { type: String },
            date: { type: Date },
            remarks: { type: String }
        }
    },

    clearance: {
        it: {
            status: { type: String, enum: ['Pending', 'Cleared'], default: 'Pending' },
            by: { type: String },
            date: { type: Date }
        },
        finance: {
            status: { type: String, enum: ['Pending', 'Cleared'], default: 'Pending' },
            by: { type: String },
            date: { type: Date }
        },
        admin: {
            status: { type: String, enum: ['Pending', 'Cleared'], default: 'Pending' },
            by: { type: String },
            date: { type: Date }
        },
        manager: {
            status: { type: String, enum: ['Pending', 'Cleared'], default: 'Pending' },
            by: { type: String },
            date: { type: Date }
        }
    },

    assets: [{
        assetName: { type: String },
        assetType: { type: String, enum: ['Laptop', 'ID Card', 'Access Card', 'Other'] },
        status: { type: String, enum: ['Pending', 'Returned', 'Lost/Damaged'], default: 'Pending' },
        remarks: { type: String }
    }],

    knowledgeTransfer: {
        status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
        assignedReplacementId: { type: String },
        managerSignOff: { type: Boolean, default: false }
    },

    fnfSettlement: {
        status: { type: String, enum: ['Pending', 'Processing', 'Settled'], default: 'Pending' },
        amount: { type: Number },
        settlementDate: { type: Date }
    },

    accessRevocation: {
        email: { type: Boolean, default: false },
        vpn: { type: Boolean, default: false },
        hrms: { type: Boolean, default: false },
        github: { type: Boolean, default: false },
        slack: { type: Boolean, default: false },
        completedAt: { type: Date }
    },

    documents: {
        resignationLetterPath: { type: String },
        relievingLetterPath: { type: String },
        experienceLetterPath: { type: String },
        nocPath: { type: String }
    },

    exitInterview: {
        status: { type: String, enum: ['Pending', 'Scheduled', 'Completed'], default: 'Pending' },
        feedbackScore: { type: Number, min: 1, max: 5 },
        notes: { type: String }
    },

    initiatedBy: { type: String, required: true },
    actionedBy: { type: String },
    actionedAt: { type: Date },

    auditLog: [{
        action: { type: String, required: true },
        by: { type: String, required: true },
        remarks: { type: String },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

export default mongoose.model<IOffboardingRequest>('OffboardingRequest', OffboardingRequestSchema);