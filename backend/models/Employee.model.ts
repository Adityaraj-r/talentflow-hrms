import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  firstName: string;
  MiddleName?: string; // Corrected casing to match frontend
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: 'Male' | 'Female' | 'Other';
  nationality?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  currentAddress?: string; // Added to match your UI Textarea
  
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  employeeCode?: string | "";
  joiningDate?: Date;
  department?: string;
  designation?: string;
  employmentType?: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  workLocation?: string;
  reportingManager?: string;
  
  // Salary made optional for step-by-step onboarding
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

  kycDetails?: { // Added to match Onboarding.jsx
    panNumber: string;
    aadharNumber: string;
    uan?: string;
    pfNumber?: string;
  };

  Documents?: { // NEW: Document File Paths
  aadharCardPath?: string;
  panCardPath?: string;
  resumePath?: string;
  educationDocsPath?: string;
  passportPhotoPath?: string;
  relievingLetterPath?: string;
  };
  
  onboardingStatus: string; // Corrected interface type
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    firstName: { type: String, required: true, trim: true },
    MiddleName: { type: String, trim: true }, // Lowercase 'm'
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    nationality: { type: String, default: 'Indian' },
    currentAddress: { type: String }, 

    // Employment - Removed 'required' for multi-step save
    employeeCode: { type: String, unique: false, default: "", sparse: true },
    joiningDate: { type: Date },
    department: { type: String },
    designation: { type: String },
    workLocation: { type: String },
    reportingManager: { type: String },
    
    salary: {
      basic: { type: Number },
      currency: { type: String, default: 'INR' },
    },

    kycDetails: {
      panNumber: { type: String, uppercase: true },
      aadharNumber: String,
      uan: String,
      pfNumber: String,
    },
    
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      branchName: String,
      ifscCode: String,
    },

    Documents:{
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
      default: 'Personal' 
    },
    status: { type: String, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'], default: 'Active' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);