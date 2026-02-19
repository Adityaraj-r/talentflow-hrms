import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber, department } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({ success: false, message: 'Email, password, first name, last name and role are required' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: role || 'EMPLOYEE',
      phoneNumber: phoneNumber || null,
      department: department || null,
      isEmailVerified: true,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
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
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error fetching user', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, role, phoneNumber, isActive, department } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, role, phoneNumber, isActive, department },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'User updated successfully', data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating user', error: error.message });
  }
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

export const deactivateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `User ${user.firstName} has been deactivated`,
      data: user
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deactivating user', error: error.message });
  }
};
