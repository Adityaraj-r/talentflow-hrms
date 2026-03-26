import mongoose, { Schema, Document } from 'mongoose';

export interface ITransfer extends Document {
    employeeId: string;
    employeeName: string;
    employeeEmail?: string; 
    initiatedBy?: string;   
    actionedBy?: string;    
    actionedAt?: Date;      
    currentDepartment: string;
    newDepartment: string;
    transferType: string;
    effectiveDate: Date;
    reason?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    adminRemarks?: string;
    requestDate: Date;
}

const TransferSchema: Schema = new Schema({
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    employeeEmail: { type: String }, 
    initiatedBy: { type: String },   
    actionedBy: { type: String },    
    actionedAt: { type: Date },      
    currentDepartment: { type: String, required: true },
    newDepartment: { type: String, required: true },
    transferType: { type: String, required: true },
    effectiveDate: { type: Date, required: true },
    reason: { type: String },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected'], 
        default: 'Pending' 
    },
    adminRemarks: { type: String, default: "" },
    requestDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ITransfer>('Transfer', TransferSchema);