import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  // Company Information
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  
  // System Preferences
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  
  // Security
  sessionTimeout: number;
  passwordExpiry: number;
  twoFactorAuth: boolean;
  
  // Metadata
  updatedBy?: string;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  // Company Information
  companyName: { type: String, default: 'InternsLand HRMS' },
  companyEmail: { type: String, default: 'admin@internsland.com' },
  companyPhone: { type: String, default: '+91 9876543210' },
  companyAddress: { type: String, default: 'Pune, Maharashtra, India' },
  
  // System Preferences
  timezone: { type: String, default: 'Asia/Kolkata' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  currency: { type: String, default: 'INR' },
  language: { type: String, default: 'en' },
  
  // Notifications
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  weeklyReports: { type: Boolean, default: true },
  
  // Security
  sessionTimeout: { type: Number, default: 30 },
  passwordExpiry: { type: Number, default: 90 },
  twoFactorAuth: { type: Boolean, default: false },
  
  // Metadata
  updatedBy: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure only one settings document exists
SettingsSchema.index({}, { unique: true });

const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
