import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import RefreshToken from '../models/RefreshToken.model';
import bcrypt from 'bcryptjs';
import { createLog } from './audit.controller';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiryToDate,
} from '../utils/token.util';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        await createLog('system', 'Unknown User', 'Login Attempt', 'Auth', `Failed login: ${email}`, String(ip), 'Failed');
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      if (user.isActive === false) {
        await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Login Attempt', 'Auth', 'Deactivated account access attempt', String(ip), 'Failed');
        if (user.isDeleted) {
            return res.status(403).json({ 
              success: false, 
              error: 'Your account has been terminated. Please contact the HR department for further assistance.' 
            });
        }
        return res.status(403).json({ success: false, error: 'Your account has been deactivated.' });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Login Attempt', 'Auth', 'Incorrect password', String(ip), 'Failed');
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      user.lastLogin = new Date();
      await user.save();

      await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'User Login', 'Auth', 'Successful login', String(ip), 'Success');

      // Existing long-lived token — kept exactly as-is so anything still reading
      // `data.token` from the response keeps working without changes.
      const token = user.getSignedJwtToken();

      // --- New: short-lived access token + DB-backed refresh token ---
      const accessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
      const refreshTokenValue = generateRefreshToken({ id: user._id.toString() });

      await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(refreshTokenValue),
        expiresAt: expiryToDate(process.env.REFRESH_TOKEN_EXPIRE, SEVEN_DAYS_MS),
        userAgent: req.headers['user-agent'],
        ip: String(ip),
      });

      return res.json({
        success: true,
        message: 'Login successful',
        token, // unchanged, kept for backward compatibility
        accessToken, // NEW — short-lived, use this for Authorization header going forward
        refreshToken: refreshTokenValue, // NEW — use this to obtain new access tokens
        data: {
          id: user._id,
          employeeCode: user.employeeCode,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          gender: user.gender, // <-- ADD THIS LINE
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  /**
   * NEW: exchange a valid refresh token for a new access token.
   * Refresh tokens are rotated on every use — the old one is revoked and a
   * new one is issued, so a stolen refresh token can only be replayed once
   * before the legitimate client's next refresh invalidates it.
   */
  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Refresh token is required' });
      }

      let decoded: any;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
      }

      const tokenHash = hashToken(refreshToken);
      const storedToken = await RefreshToken.findOne({ tokenHash });

      if (!storedToken || storedToken.revoked) {
        return res.status(401).json({ success: false, error: 'Refresh token has been revoked or is invalid' });
      }

      if (storedToken.expiresAt < new Date()) {
        return res.status(401).json({ success: false, error: 'Refresh token has expired' });
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Account deactivated' });
      }

      // Rotate: revoke the used token, issue a fresh pair
      storedToken.revoked = true;
      await storedToken.save();

      const newAccessToken = generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
      const newRefreshToken = generateRefreshToken({ id: user._id.toString() });

      await RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: expiryToDate(process.env.REFRESH_TOKEN_EXPIRE, SEVEN_DAYS_MS),
        userAgent: req.headers['user-agent'],
        ip: String(req.ip || req.headers['x-forwarded-for'] || 'unknown'),
      });

      return res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error: any) {
      console.error('Refresh token error:', error);
      return res.status(500).json({ success: false, error: 'Failed to refresh token' });
    }
  }

  /**
   * NEW: revoke a refresh token so it can no longer be used to mint new
   * access tokens. Doesn't touch the access token itself (it just expires
   * naturally within its short lifetime).
   */
  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Refresh token is required' });
      }

      const tokenHash = hashToken(refreshToken);
      await RefreshToken.updateOne({ tokenHash }, { $set: { revoked: true } });

      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      return res.status(500).json({ success: false, error: 'Failed to logout' });
    }
  }

  static async register(req: Request, res: Response) {
    return res.status(403).json({ success: false, error: 'Registration is disabled. Please contact admin.' });
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const user = await User.findById(userId).select('-password').populate('currentShift');

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

     return res.json({
        success: true,
        data: {
          id: user._id,
          employeeCode: user.employeeCode,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          gender: user.gender,
          isActive: user.isActive,
          currentShift: user.currentShift,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });
    } catch (error: any) {
      console.error('Get profile error:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, phoneNumber } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // Create an update object with only the fields that were provided
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      // Use findByIdAndUpdate to bypass full document validation (prevents 500 errors)
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: false } 
      );

      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Keep the audit log from the main branch
      await createLog(updatedUser._id.toString(), `${updatedUser.firstName} ${updatedUser.lastName}`, 'Update Profile', 'User Settings', 'Self profile update', String(ip), 'Success');

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new password are required' });
      }

      const user = await User.findById(userId).select('+password');
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      // 1. Verify old password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Password Change', 'Security', 'Failed: Incorrect current password', String(ip), 'Failed');
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      // 2. Update Password in MongoDB (Bypassing validation) & hashing locally
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(
        userId,
        { $set: { password: hashedPassword } },
        { new: true, runValidators: false }
      );

      await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Password Change', 'Security', 'Successful password update', String(ip), 'Success');

      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  }

  // Re-added Avatar Upload function
  static async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No image file provided' });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      await User.findByIdAndUpdate(
        userId,
        { $set: { avatar: avatarUrl } },
        { new: true, runValidators: false }
      );

      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl
      });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      return res.status(500).json({ success: false, error: 'Failed to upload avatar' });
    }
  }
}