import mongoose, { Schema, Document } from 'mongoose';

export interface IRemark {
  remark: string;
  addedBy: string;
  role: string;
  createdAt: Date;
}

export interface IDocumentRequest extends Document {
  requestId: string;
  employeeId: string;
  documentType: string;
  purpose: string;
  additionalNotes?: string;
  remarks: IRemark[];
  status: 'Pending' | 'Approved' | 'Rejected';
  documentPath?: string;
  documentPaths?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RemarkSchema: Schema = new Schema({
  remark: { type: String, required: true },
  addedBy: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const DocumentRequestSchema: Schema = new Schema({
  requestId: { type: String, unique: true },
  employeeId: { type: String, required: true },
  documentType: { type: String, required: true },
  purpose: { type: String, required: true },
  additionalNotes: { type: String },
  remarks: { type: [RemarkSchema], default: [] },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  documentPath: { type: String },
  documentPaths: { type: [String], default: [] }
}, { timestamps: true });

DocumentRequestSchema.pre('save', function (this: any) {
  if (!this.requestId) {
    const uniqueSuffix = Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    this.requestId = `REQ-${uniqueSuffix}`;
  }
});

export default mongoose.model<IDocumentRequest>('DocumentRequest', DocumentRequestSchema);