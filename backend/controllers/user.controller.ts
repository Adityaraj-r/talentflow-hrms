import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import admin from 'firebase-admin';

// Create new user (Admin/HR only)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber,department } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role || !phoneNumber || !department) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

   //  Create User in Firebase Authentication 
    
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: `${firstName} ${lastName}`,
        // Firebase requires phone numbers in E.164 format (e.g., +91...)
        phoneNumber: phoneNumber ? `+91${phoneNumber}` : undefined,
      });
    } catch (fbError: any) {
      res.status(400).json({ success: false, message: `Firebase Error: ${fbError.message}` });
      return;
    }

    // Hash password for MongoDB storage 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create MongoDB User with firebaseUid 
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'EMPLOYEE',
      phoneNumber,
      department,
      firebaseUid: firebaseUser.uid, 
      isEmailVerified: true,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully in both DB and Firebase',
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
};

// Get all users (Admin/HR only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;

    // Build filter
    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .populate('employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

// Get single user by ID (Admin/HR only)
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate('employeeId');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// Update user (Admin/HR only)
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, phoneNumber, isActive, employeeId } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { firstName, lastName, role, phoneNumber, isActive, employeeId },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

// Reset user password (Admin/HR only)
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

// Deactivate user (Admin/HR only)
export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { isActive: false } }, 
      { new: true, runValidators: true } // runValidators ensures the status stays within schema limits
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User ${user.firstName} has been deactivated.`,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error during deactivation',
      error: error.message,
    });
  }
};
