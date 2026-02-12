import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  manager: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true 
    },
    description: { 
        type: String 
    },
    manager: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>('Department', departmentSchema);