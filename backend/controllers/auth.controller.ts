import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import { createLog } from './audit.controller';

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

      const token = user.getSignedJwtToken();

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, error: 'Login failed' });
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
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          currentShift: user.currentShift,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;

      await user.save();
      await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Update Profile', 'User Settings', 'Self profile update', String(ip), 'Success');

      return res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Failed to update profile' });
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

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Password Change', 'Security', 'Failed: Incorrect current password', String(ip), 'Failed');
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }

      user.password = newPassword;
      await user.save();

      await createLog(user._id.toString(), `${user.firstName} ${user.lastName}`, 'Password Change', 'Security', 'Successful password update', String(ip), 'Success');

      return res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  }
}
