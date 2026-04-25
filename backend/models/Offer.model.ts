import mongoose, { Schema, Document } from 'mongoose';

export type OfferStatus = 'Pending CEO Approval' | 'Offered' | 'Accepted' | 'Declined';

export interface IOffer extends Document {
  offerId: string;
  candidateName: string;
  salary: number;
  joiningDate: string;
  status: OfferStatus;
  createdBy: mongoose.Types.ObjectId;
  ceoApprovedBy?: mongoose.Types.ObjectId;
  ceoApprovedAt?: Date;
}

const OfferSchema: Schema = new Schema({
  offerId: { type: String, required: true, unique: true },
  candidateName: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending CEO Approval', 'Offered', 'Accepted', 'Declined'],
    default: 'Offered',
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  ceoApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  ceoApprovedAt: Date,
}, { timestamps: true });

export default mongoose.model<IOffer>('Offer', OfferSchema);
