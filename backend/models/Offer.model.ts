import mongoose, { Schema, Document } from 'mongoose';

export interface IOffer extends Document {
  offerId: string;
  candidateName: string;
  salary: number;
  joiningDate: string;
  status: 'Offered' | 'Accepted' | 'Declined';
  createdBy: mongoose.Types.ObjectId;
}

const OfferSchema: Schema = new Schema({
  offerId: { type: String, required: true, unique: true },
  candidateName: { type: String, required: true },
  salary: { type: Number, required: true },
  joiningDate: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Offered', 'Accepted', 'Declined'], 
    default: 'Offered' 
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IOffer>('Offer', OfferSchema);