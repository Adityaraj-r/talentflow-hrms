// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      // --- ADD THIS BLOCK HERE (Starting at Line 21) ---
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          error: 'Your account has been deactivated. Please contact the administrator.'
        });
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      user.lastLogin = new Date();
      await user.save();

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      return res.status(403).json({
        success: false,
        error: 'Registration is disabled. Please contact admin.'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      console.log('📋 getProfile called for user:', req.user?.email);
      
      const userId = req.user?.id;

      if (!userId) {
        console.error('❌ No user ID in request');
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const user = await User.findById(userId).select('-password').populate('currentShift');

      if (!user) {
        console.error('❌ User not found by ID:', userId);
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      console.log('✅ Sending profile data for:', user.email);

      return res.json({
        success: true,
        data: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
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
      console.error('❌ Get profile error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { firstName, lastName, phoneNumber } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;

      await user.save();

      return res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      const user = await User.findById(userId).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      user.password = newPassword;
      await user.save();

      return res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }
}
