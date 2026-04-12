import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  // Company Information
  companyName: string;
  companyEmail: string;
  phone: string;              // Changed from companyPhone
  address: string;            // Changed from companyAddress
  
  // System Preferences
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  
  // Notifications
  enableEmailNotifications: boolean;  // Changed from emailNotifications
  enableSMSNotifications: boolean;    // Changed from smsNotifications
  enablePushNotifications: boolean;   // Changed from pushNotifications
  
  // Security
  sessionTimeout: number;
  passwordExpiryDays: number;         // Changed from passwordExpiry
  requireMFA: boolean;                // Changed from twoFactorAuth

  // HR Outbound Email (DB-based SMTP)
  hrSmtpHost?: string;
  hrSmtpPort?: number | null;
  hrSmtpSecure?: boolean;
  hrSmtpUser?: string;
  hrSmtpPass?: string;
  
  // Metadata
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>({
  // Company Information
  companyName: { type: String, default: 'InternsLand' },
  companyEmail: { type: String, default: 'admin@internsland.com' },
  phone: { type: String, default: '+91 0000000000' },
  address: { type: String, default: 'Pune, Maharashtra, India' },
  
  // System Preferences
  timezone: { type: String, default: 'Asia/Kolkata' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  currency: { type: String, default: 'INR' },
  language: { type: String, default: 'en' },
  
  // Notifications
  enableEmailNotifications: { type: Boolean, default: true },
  enableSMSNotifications: { type: Boolean, default: false },
  enablePushNotifications: { type: Boolean, default: true },
  
  // Security
  sessionTimeout: { type: Number, default: 30 },
  passwordExpiryDays: { type: Number, default: 90 },
  requireMFA: { type: Boolean, default: false },

  // HR Outbound Email (DB-based SMTP)
  hrSmtpHost: { type: String, default: '' },
  hrSmtpPort: { type: Number, default: null },
  hrSmtpSecure: { type: Boolean, default: false },
  hrSmtpUser: { type: String, default: '' },
  hrSmtpPass: { type: String, default: '', select: false },
  
  // Metadata
  updatedBy: { type: String },
}, {
  timestamps: true  // This auto-creates createdAt and updatedAt
});

const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
