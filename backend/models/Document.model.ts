import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  employeeId: string;
  uploadedBy: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: string;
  filePath: string;
  category: 'Personal' | 'Education' | 'Employment' | 'Payroll' | 'Onboarding' | 'Uncategorized';
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadDate: Date;
}

const DocumentSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: String, required: true },
  filePath: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Personal', 'Education', 'Employment', 'Payroll', 'Onboarding', 'Uncategorized'],
    default: 'Uncategorized' 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected'], 
    default: 'Pending' 
  },
  uploadDate: { type: Date, default: Date.now }
});

export default mongoose.model<IDocument>('Document', DocumentSchema);