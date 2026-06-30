import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User.model';
import PasswordResetOtp from '../models/PasswordResetOtp.model';
import { sendEmail } from './email.service';
import { renderEmailTemplate } from './template.service';

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const GENERIC_FORGOT_PASSWORD_MESSAGE = 'If the account exists, an OTP has been sent.';

export class PasswordResetError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'PASSWORD_RESET_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const forgotPasswordGenericMessage = GENERIC_FORGOT_PASSWORD_MESSAGE;

export const normalizeEmail = (email: unknown): string =>
  String(email || '').trim().toLowerCase();

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidOtp = (otp: unknown): boolean =>
  /^\d{6}$/.test(String(otp || '').trim());

export const validatePasswordPolicy = (password: unknown): string[] => {
  const value = String(password || '');
  const errors: string[] = [];

  if (value.length < 12) errors.push('Password must be at least 12 characters long.');
  if (!/[A-Z]/.test(value)) errors.push('Password must include at least one uppercase letter.');
  if (!/[a-z]/.test(value)) errors.push('Password must include at least one lowercase letter.');
  if (!/\d/.test(value)) errors.push('Password must include at least one digit.');
  if (!/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value)) {
    errors.push('Password must include at least one special character.');
  }

  return errors;
};

const generateOtp = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

const getActiveUserByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email, isActive: true, isDeleted: { $ne: true } });
};

const sendResetOtpEmail = async (user: IUser, otp: string) => {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there';

  return sendEmail({
    to: user.email,
    subject: 'Your password reset OTP',
    html: renderEmailTemplate('genericNotification', {
      name,
      title: 'Password Reset OTP',
      message: `Use this OTP to reset your password: ${otp}\n\nThis OTP expires in 5 minutes. If you did not request a password reset, you can safely ignore this email.`,
    }),
    text: `Use this OTP to reset your password: ${otp}\n\nThis OTP expires in 5 minutes. If you did not request a password reset, you can safely ignore this email.`,
  });
};

const createAndSendOtp = async (user: IUser, enforceCooldown: boolean) => {
  const now = new Date();
  const existing = await PasswordResetOtp.findOne({ email: user.email });

  if (existing && enforceCooldown) {
    const elapsed = now.getTime() - existing.lastSentAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new PasswordResetError(`Please wait ${waitSeconds}s before requesting another OTP.`, 429, 'RESEND_COOLDOWN');
    }
  }

  const recentRequests = (existing?.requestTimestamps || []).filter(
    (timestamp) => now.getTime() - timestamp.getTime() < REQUEST_WINDOW_MS
  );

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new PasswordResetError('Too many OTP requests. Please try again after 15 minutes.', 429, 'OTP_RATE_LIMITED');
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 12);
  const emailResult = await sendResetOtpEmail(user, otp);

  if (!emailResult.success) {
    throw new PasswordResetError('Unable to send OTP right now. Please try again later.', 502, 'EMAIL_SEND_FAILED');
  }

  await PasswordResetOtp.findOneAndUpdate(
    { email: user.email },
    {
      $set: {
        otpHash,
        expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
        attempts: 0,
        lastSentAt: now,
        requestTimestamps: [...recentRequests, now],
      },
      $setOnInsert: {
        email: user.email,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};

export const requestPasswordResetOtp = async (rawEmail: unknown, enforceCooldown = false) => {
  const email = normalizeEmail(rawEmail);
  if (!email || !isValidEmail(email)) {
    throw new PasswordResetError('Please enter a valid email address.', 400, 'INVALID_EMAIL');
  }

  const user = await getActiveUserByEmail(email);
  if (!user) return;

  await createAndSendOtp(user, enforceCooldown);
};

export const verifyPasswordResetOtp = async (rawEmail: unknown, rawOtp: unknown) => {
  const email = normalizeEmail(rawEmail);
  const otp = String(rawOtp || '').trim();

  if (!email || !isValidEmail(email)) {
    throw new PasswordResetError('Please enter a valid email address.', 400, 'INVALID_EMAIL');
  }

  if (!isValidOtp(otp)) {
    throw new PasswordResetError('OTP must be exactly 6 digits.', 400, 'INVALID_OTP_FORMAT');
  }

  const record = await PasswordResetOtp.findOne({ email }).select('+otpHash');

  if (!record) {
    throw new PasswordResetError('Invalid or expired OTP.', 400, 'OTP_NOT_FOUND');
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await PasswordResetOtp.deleteOne({ email });
    throw new PasswordResetError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
  }

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await PasswordResetOtp.deleteOne({ email });
    throw new PasswordResetError('Too many invalid OTP attempts. Please request a new OTP.', 429, 'TOO_MANY_ATTEMPTS');
  }

  const matches = await bcrypt.compare(otp, record.otpHash);
  if (!matches) {
    record.attempts += 1;
    await record.save();

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await PasswordResetOtp.deleteOne({ email });
      throw new PasswordResetError('Too many invalid OTP attempts. Please request a new OTP.', 429, 'TOO_MANY_ATTEMPTS');
    }

    throw new PasswordResetError('Invalid OTP. Please check the code and try again.', 400, 'INVALID_OTP');
  }

  return true;
};

export const resetPasswordWithOtp = async (
  rawEmail: unknown,
  rawOtp: unknown,
  rawPassword: unknown,
  rawConfirmPassword?: unknown
) => {
  const email = normalizeEmail(rawEmail);
  const password = String(rawPassword || '');
  const confirmPassword = rawConfirmPassword === undefined ? password : String(rawConfirmPassword || '');
  const passwordErrors = validatePasswordPolicy(password);

  if (password !== confirmPassword) {
    passwordErrors.push('Confirm password must match the new password.');
  }

  if (passwordErrors.length > 0) {
    throw new PasswordResetError(passwordErrors.join(' '), 400, 'WEAK_PASSWORD');
  }

  await verifyPasswordResetOtp(email, rawOtp);

  const user = await getActiveUserByEmail(email);
  if (!user) {
    await PasswordResetOtp.deleteOne({ email });
    throw new PasswordResetError('Unable to reset password for this account.', 400, 'USER_NOT_FOUND');
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  await User.findByIdAndUpdate(
    user._id,
    { $set: { password: hashedPassword } },
    { new: true, runValidators: false }
  );

  await PasswordResetOtp.deleteOne({ email });
};
