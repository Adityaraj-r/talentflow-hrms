import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  nationality: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  
  employeeCode: string;
  joiningDate: Date;
  department: string;
  designation: string;
  employmentType: 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern';
  workLocation: string;
  reportingManager?: mongoose.Types.ObjectId;
  
  salary: {
    basic: number;
    currency: string;
    allowances?: {
      hra?: number;
      transport?: number;
      medical?: number;
      other?: number;
    };
    deductions?: {
      tax?: number;
      pf?: number;
      insurance?: number;
      other?: number;
    };
  };
  
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    branchName: string;
    ifscCode: string;
  };
  
  documents?: {
    type: string;
    name: string;
    url: string;
    uploadedAt: Date;
  }[];
  
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  
  status: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  exitDate?: Date;
  exitReason?: string;
  
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    alternatePhone: String,
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    nationality: {
      type: String,
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed'],
    },
    
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, required: true },
      postalCode: String,
    },
    
    employeeCode: {
      type: String,
      required: true,
      unique: true,
    },
    joiningDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
      default: 'Full-Time',
    },
    workLocation: {
      type: String,
      required: true,
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    
    salary: {
      basic: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'INR',
      },
      allowances: {
        hra: Number,
        transport: Number,
        medical: Number,
        other: Number,
      },
      deductions: {
        tax: Number,
        pf: Number,
        insurance: Number,
        other: Number,
      },
    },
    
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      branchName: String,
      ifscCode: String,
    },
    
    documents: [
      {
        type: String,
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
      default: 'Active',
    },
    exitDate: Date,
    exitReason: String,
    
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ employeeCode: 1 });
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
