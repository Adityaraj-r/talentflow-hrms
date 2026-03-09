import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import Employee from '../models/Employee.model';


export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email, password, firstName, lastName, role,
      phoneNumber, department, gender, salary
    } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name and role are required',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const empCount        = await Employee.countDocuments();
    const employeeCode    = `EMP-${String(empCount + 1).padStart(4, '0')}`;
    const salt            = await bcrypt.genSalt(10);
    const hashedPassword  = await bcrypt.hash(password, salt);

    const user = await User.create({
      email:           email.toLowerCase(),
      password:        hashedPassword,
      firstName,
      lastName,
      role:            role        || 'EMPLOYEE',
      phoneNumber:     phoneNumber || null,
      department:      department  || null,
      gender:          gender      || null,
      employeeCode,
      isEmailVerified: true,
      isActive:        true,
    });

    const employee = await Employee.create({
      userId:       user._id,
      employeeCode,
      email:        user.email,
      firstName:    user.firstName,
      lastName:     user.lastName,
      phoneNumber:  user.phoneNumber || '',
      department:   user.department  || '',
      gender:       user.gender      || '',
      role:         user.role,
      status:       'Active',
      salary: {
        basic:    Number(salary?.basic)                    || 0,
        currency: 'INR',
        allowances: {
          hra:       Number(salary?.allowances?.hra)       || 0,
          transport: Number(salary?.allowances?.transport) || 0,
          medical:   Number(salary?.allowances?.medical)   || 0,
          other:     Number(salary?.allowances?.other)     || 0,
        },
        deductions: {
          pf:        Number(salary?.deductions?.pf)        || 0,
          tax:       Number(salary?.deductions?.tax)       || 0,
          insurance: Number(salary?.deductions?.insurance) || 0,
        },
      },
    });

    await User.findByIdAndUpdate(user._id, { employeeId: employee._id });

    res.status(201).json({
      success: true,
      message: 'User and Employee profile created successfully',
      data: {
        id:           user._id,
        employeeId:   employee._id,
        employeeCode: employee.employeeCode,
        email:        user.email,
        firstName:    user.firstName,
        lastName:     user.lastName,
        role:         user.role,
        department:   user.department,
        gender:       user.gender,
        phoneNumber:  user.phoneNumber,
        isActive:     user.isActive,
        salary:       employee.salary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;

    const filter: any = {};
    if (role)              filter.role     = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName:    { $regex: search, $options: 'i' } },
        { lastName:     { $regex: search, $options: 'i' } },
        { email:        { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
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
    const userId = req.params.id || req.body.id;
    const {
      firstName, lastName, email, password,
      department, role, gender, phoneNumber, isActive,
      salary
    } = req.body;

    if (!role || !department || !phoneNumber) {
      res.status(400).json({
        success: false,
        message: 'Role, Department, and Phone Number are compulsory fields.',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (firstName)              user.firstName   = firstName;
    if (lastName)               user.lastName    = lastName;
    if (email)                  user.email       = email;
    if (department)             user.department  = department;
    if (role)                   user.role        = role;
    if (gender)                 user.gender      = gender;
    if (phoneNumber)            user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive    = isActive;

    if (password && password.trim() !== '') {
      const salt    = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    if (user.employeeId) {
      const employeeUpdate: any = {
        firstName:   user.firstName,
        lastName:    user.lastName,
        email:       user.email,
        phoneNumber: user.phoneNumber,
        department:  user.department,
        gender:      user.gender,
        role:        user.role,
        status:      user.isActive ? 'Active' : 'Inactive',
      };

      if (salary) {
        employeeUpdate.salary = {
          basic:    Number(salary?.basic)                    || 0,
          currency: 'INR',
          allowances: {
            hra:       Number(salary?.allowances?.hra)       || 0,
            transport: Number(salary?.allowances?.transport) || 0,
            medical:   Number(salary?.allowances?.medical)   || 0,
            other:     Number(salary?.allowances?.other)     || 0,
          },
          deductions: {
            pf:        Number(salary?.deductions?.pf)        || 0,
            tax:       Number(salary?.deductions?.tax)       || 0,
            insurance: Number(salary?.deductions?.insurance) || 0,
          },
        };
      }

      await Employee.findByIdAndUpdate(user.employeeId, employeeUpdate);
    }

    const { password: _, ...userResponse } = user.toObject();
    res.status(200).json({ success: true, message: 'User updated successfully', data: userResponse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating user details', error: error.message });
  }
};


export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }

    const salt           = await bcrypt.genSalt(10);
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

    if (user.employeeId) {
      await Employee.findByIdAndUpdate(user.employeeId, { status: 'Inactive' });
    }

    res.status(200).json({
      success: true,
      message: `User ${user.firstName} has been deactivated`,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deactivating user', error: error.message });
  }
};
