// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';

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

      // Create an update object with only the fields that were provided
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;

      // Use findByIdAndUpdate to bypass full document validation
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: false } // runValidators: false ignores missing required fields on old docs
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

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

      // 1. Verify old password
      const isPasswordValid = await user.comparePassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // 2. Update Password in Firebase (CRITICAL for login)
      if (user.firebaseUid) {
        try {
          await admin.auth().updateUser(user.firebaseUid, {
            password: newPassword
          });
        } catch (fbError: any) {
          console.error('Firebase password update failed:', fbError);
          return res.status(500).json({
            success: false,
            error: 'Failed to sync new password with authentication provider.'
          });
        }
      }

      // 3. Update Password in MongoDB (Bypassing validation)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await User.findByIdAndUpdate(
        userId,
        { $set: { password: hashedPassword } },
        { new: true, runValidators: false }
      );

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
