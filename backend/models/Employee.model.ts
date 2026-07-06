import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  userId?: mongoose.Types.ObjectId;
  firstName: string;
  MiddleName?: string;
  lastName?: string;
  workEmail?: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  currentAddress?: string;
  role?: string;
  exitDate?: Date;
  exitReason?: string;

  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  employeeCode?: string;
  joiningDate?: Date;
  department?: string;
  designation?: string;
  employmentType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  workLocation?: string;
  reportingManager?: string;
  reportingManagerId?: string; 

  salary?: {
    basic?: number;
    currency?: string;
    allowances?: { hra?: number; transport?: number; medical?: number; other?: number; };
    deductions?: { tax?: number; pf?: number; insurance?: number; other?: number; };
  };

  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    ifscCode: string;
  };

  kycDetails?: {
    panNumber: string;
    aadharNumber: string;
    uan?: string;
    pfNumber?: string;
  };

  Documents?: {
    aadharCardPath?: string;
    panCardPath?: string;
    resumePath?: string;
    educationDocsPath?: string;
    passportPhotoPath?: string;
    relievingLetterPath?: string;
  };

  onboardingStatus: string;
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    firstName: { type: String, required: true, trim: true },
    MiddleName: { type: String, trim: true },
    lastName: { type: String, trim: true, default: '' },
    workEmail: { type: String, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    alternatePhone: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    nationality: { type: String, default: 'Indian' },
    maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
    currentAddress: { type: String },

    employeeCode: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      trim: true,
    },
    role: {
      type: String,
      default: null,
    },
    joiningDate: { type: Date },
    exitDate: { type: Date, default: null },
    exitReason: { type: String, default: null },
    department: { type: String },
    designation: { type: String },
    employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'] },
    workLocation: { type: String },
    reportingManager: { type: String },
    reportingManagerId: { type: String, default: null }, 

    salary: {
      basic: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      allowances: {
        hra: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
      deductions: {
        pf: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        insurance: { type: Number, default: 0 },
        other: { type: Number, default: 0 },
      },
    },

    kycDetails: {
      panNumber: { type: String, uppercase: true },
      aadharNumber: { type: String },
      uan: { type: String },
      pfNumber: { type: String },
    },

    bankDetails: {
      accountHolderName: { type: String },
      accountNumber: { type: String },
      bankName: { type: String },
      branchName: { type: String },
      ifscCode: { type: String },
    },

    Documents: {
      aadharCardPath: { type: String, default: null },
      panCardPath: { type: String, default: null },
      resumePath: { type: String, default: null },
      educationDocsPath: { type: String, default: null },
      passportPhotoPath: { type: String, default: null },
      relievingLetterPath: { type: String, default: null },
    },

    onboardingStatus: {
      type: String,
      enum: ['Personal', 'Employment', 'Banking', 'Documents', 'Completed'],
      default: 'Personal',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
      default: 'Active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
