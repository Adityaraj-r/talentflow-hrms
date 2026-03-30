import mongoose from 'mongoose';

const employerBrandSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    glassdoorRating: { type: Number, min: 0, max: 5, default: null },
    linkedInScore: { type: Number, min: 0, max: 100, default: null },
    employerNps: { type: Number, min: -100, max: 100, default: null },
    notes: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('EmployerBrand', employerBrandSchema);
