import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  department?: string;
  phoneNumber?: string;
  gender?: string;
  employeeId?: mongoose.Types.ObjectId;
  currentShift?: mongoose.Types.ObjectId;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: [
        'CEO',
        'COUNTRY_MANAGER',
        'HR_MANAGER',
        'HR_OFFICER',
        'DEPARTMENT_MANAGER',
        'DIRECT_MANAGER',
        'PAYROLL_OFFICER',
        'PROJECT_MANAGER',
        'OPERATIONS_MANAGER',
        'CAMP_BOSS',
        'ADMIN',
        'EMPLOYEE'
      ]
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      default: null
    },
    department: {
      type: String,
      default: null
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: null
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null
    },
    currentShift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch {
    return false;
  }
};

UserSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    (process.env.JWT_SECRET as jwt.Secret) || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '30d' } as jwt.SignOptions
  );
};

export default mongoose.model<IUser>('User', UserSchema);
