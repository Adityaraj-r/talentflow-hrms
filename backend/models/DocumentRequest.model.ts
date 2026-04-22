import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentRequest extends Document {
  employeeId: string;
  employeeName: string;
  documentType: 'Salary Certificate' | 'Form 16' | 'Bonafide Certificate' | 'Experience Certificate' | 'Relieving Letter' | 'Visa NOC';
  purpose: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Rejected';
  rejectionReason?: string;
  fulfilledDocumentId?: mongoose.Types.ObjectId;
  requestDate: Date;
  actionedBy?: string;
  actionedAt?: Date;
}

const DocumentRequestSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  documentType: { 
    type: String, 
    required: true,
    enum: ['Salary Certificate', 'Form 16', 'Bonafide Certificate', 'Experience Certificate', 'Relieving Letter', 'Visa NOC']
  },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  rejectionReason: { type: String },
  fulfilledDocumentId: { type: Schema.Types.ObjectId, ref: 'Document' },
  requestDate: { type: Date, default: Date.now },
  actionedBy: { type: String },
  actionedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model<IDocumentRequest>('DocumentRequest', DocumentRequestSchema);