import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firebaseUid?: string;
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  department?: string;
  phoneNumber?: string;
  employeeId?: mongoose.Types.ObjectId;
  currentShift?: mongoose.Types.ObjectId;   //✅ NEW ADD
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      unique: true,
      required: [true, 'Firebase UID is required for authentication'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
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
        'EMPLOYEE',
      ],
      // default: 'EMPLOYEE',
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      minlength: [10, 'Phone number must be exactly 10 digits'],
      maxlength: [10, 'Phone number must be exactly 10 digits']
    },
    department: {
      type: String,
      required: [true, 'Department is required']
    },
    // ✅ ADD THIS 2: Schema Definition
    currentShift: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      default: null 
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);
