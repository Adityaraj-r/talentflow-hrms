import { Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import Role from '../models/Role.model';
import { sendWelcomeEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middleware/auth.middleware';
import { createLog } from './audit.controller';
import {
  checkAdminSafeguard,
  isAssignableRoleStable,
  normalizeRoleKey,
} from '../utils/adminRules.util';

async function resolveRegisteredRoleName(input: string): Promise<string | null> {
  const roles = await Role.find({}).lean();
  const n = normalizeRoleKey(input);
  const found = roles.find((r) => normalizeRoleKey(String(r.name)) === n);
  return found ? String(found.name) : null;
}

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, phoneNumber, department, gender, employeeCode, salary } = req.body;
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name and role are required',
      });
      return;
    }

    const resolvedRole = await resolveRegisteredRoleName(role);
    if (!resolvedRole) {
      res.status(400).json({ success: false, message: 'Unknown or invalid role' });
      return;
    }
    if (!isAssignableRoleStable(resolvedRole)) {
      res.status(403).json({ success: false, message: 'Role assignment is not permitted through this endpoint' });
      return;
    }

    if (employeeCode) {
      const existingEmployeeCode = await User.findOne({ employeeCode });
      if (existingEmployeeCode) {
        res.status(400).json({
          success: false,
          message: `Account creation failed: The ID ${employeeCode} is already linked to an active user account.`
        });
        return;
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let personalEmail = "";
    if (employeeCode) {
      const candidateRecord = await Employee.findOne({ employeeCode });
      if (candidateRecord && candidateRecord.email) {
        personalEmail = candidateRecord.email;
      }
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role: resolvedRole,
      phoneNumber: phoneNumber || null,
      department: department || null,
      gender: gender || null,
      isEmailVerified: true,
      employeeCode: employeeCode || null,
      isActive: true,
    });

    const employeeData: Record<string, unknown> = {
      userId: user._id,
      workEmail: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      department: user.department || '',
      gender: user.gender || '',
      role: user.role,
      status: 'Active',
      salary: {
        basic: Number(salary?.basic) || 0,
        currency: 'INR',
        allowances: {
          hra: Number(salary?.allowances?.hra) || 0,
          transport: Number(salary?.allowances?.transport) || 0,
          medical: Number(salary?.allowances?.medical) || 0,
          other: Number(salary?.allowances?.other) || 0,
        },
        deductions: {
          pf: Number(salary?.deductions?.pf) || 0,
          tax: Number(salary?.deductions?.tax) || 0,
          insurance: Number(salary?.deductions?.insurance) || 0,
        },
      },
    };

    let employee;
    
    if (employeeCode) {
      employee = await Employee.findOneAndUpdate(
        { employeeCode: employeeCode },
        { $set: employeeData },
        { new: true }
      );
      
      if (!employee) {
        employeeData.email = personalEmail || user.email; 
        employee = await Employee.create({ ...employeeData, employeeCode });
      }
    } else {
      employeeData.email = user.email; 
      employee = await Employee.create(employeeData);
    }

    await User.findByIdAndUpdate(user._id, { employeeId: employee._id });

    if (personalEmail && password) {
      sendWelcomeEmail(personalEmail, firstName, user.email, password);
    }

    const actorName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || 'System';
    await createLog(
      req.user?.id || 'system',
      actorName,
      'CREATE_USER',
      'ADMINISTRATION',
      `Created user ${user.email}`,
      ip,
      'Success',
      {
        userRole: req.user?.role,
        afterValue: { email: user.email, role: user.role, employeeId: employee._id.toString() },
      }
    );

    res.status(201).json({
      success: true,
      message: 'User and Employee profile created successfully',
      data: {
        id: user._id,
        employeeId: employee._id,
        employeeCode: (employee as { employeeCode?: string }).employeeCode,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        salary: (employee as { salary?: unknown }).salary,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, isActive, search } = req.query;

    const filter: Record<string, unknown> = {};
    if (role && role !== 'all') filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
      ];
    }

    const requestingUser = req.user;
    const managerId = requestingUser?.id || (requestingUser as any)?._id;
    const managerRole = typeof requestingUser?.role === 'string' ? requestingUser.role : (requestingUser as any)?.role?.name;

    if (managerRole === "DIRECT_MANAGER" && managerId) {
      
      const managerEmployee = await Employee.findOne({
        $or: [{ userId: managerId }, { email: requestingUser?.email }]
      });

      console.log("Manager's Employee Code:", managerEmployee?.employeeCode);

      if (managerEmployee && managerEmployee.employeeCode) {
        const directReports = await Employee.find({ reportingManagerId: managerEmployee.employeeCode }).select('employeeCode');
        const reportCodes = directReports.map(emp => emp.employeeCode).filter(Boolean);

        console.log("Direct Reports Found (Codes):", reportCodes);

        filter.employeeCode = { $in: reportCodes };
        filter.role = "EMPLOYEE"; 
      } else {
        console.log("FAILSAFE TRIGGERED: Manager has no employeeCode.");
        filter.employeeCode = { $in: [] };
      }
    } 
    else if (managerRole === "DEPARTMENT_MANAGER") {
      filter.department = requestingUser?.department;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error: any) {
    console.error("GET ALL USERS ERROR:", error);
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
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

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.id || req.body.id;
    const {
      firstName, lastName, email, password,
      department, role, gender, phoneNumber, isActive,
      salary
    } = req.body;

    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

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

    if (req.user?.id === userId && role !== user.role) {
      res.status(403).json({ success: false, message: 'You cannot change your own role' });
      return;
    }

    const resolvedRole = await resolveRegisteredRoleName(role);
    if (!resolvedRole) {
      res.status(400).json({ success: false, message: 'Unknown or invalid role' });
      return;
    }
    if (!isAssignableRoleStable(resolvedRole)) {
      res.status(403).json({ success: false, message: 'Role assignment is not permitted through this endpoint' });
      return;
    }

    if (resolvedRole !== user.role) {
      const safeguard = await checkAdminSafeguard({
        userId,
        operation: 'role_change',
        nextRole: resolvedRole,
      });
      if (!safeguard.ok) {
        res.status(400).json({ success: false, message: safeguard.message });
        return;
      }
    }

    if (isActive !== undefined && isActive === false && user.isActive === true) {
      const safeguard = await checkAdminSafeguard({
        userId,
        operation: 'deactivate',
        nextIsActive: false,
      });
      if (!safeguard.ok) {
        res.status(400).json({ success: false, message: safeguard.message });
        return;
      }
    }

    const beforeSnap = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    };

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (department) user.department = department;
    user.role = resolvedRole;
    if (gender) user.gender = gender;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive = isActive;

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    if (user.employeeId) {
      const employeeUpdate: Record<string, unknown> = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        department: user.department,
        gender: user.gender,
        role: user.role,
        status: user.isActive ? 'Active' : 'Inactive',
      };

      if (salary) {
        employeeUpdate.salary = {
          basic: Number(salary?.basic) || 0,
          currency: 'INR',
          allowances: {
            hra: Number(salary?.allowances?.hra) || 0,
            transport: Number(salary?.allowances?.transport) || 0,
            medical: Number(salary?.allowances?.medical) || 0,
            other: Number(salary?.allowances?.other) || 0,
          },
          deductions: {
            pf: Number(salary?.deductions?.pf) || 0,
            tax: Number(salary?.deductions?.tax) || 0,
            insurance: Number(salary?.deductions?.insurance) || 0,
          },
        };
      }

      await Employee.findByIdAndUpdate(user.employeeId, employeeUpdate);
    }

    const { password: _, ...userResponse } = user.toObject();

    const actorName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || 'System';
    await createLog(
      req.user?.id || 'system',
      actorName,
      'UPDATE_USER',
      'ADMINISTRATION',
      `Updated user ${user.email}`,
      ip,
      'Success',
      {
        userRole: req.user?.role,
        beforeValue: beforeSnap,
        afterValue: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
          isActive: user.isActive,
        },
      }
    );

    res.status(200).json({ success: true, message: 'User updated successfully', data: userResponse });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error updating user details', error: error.message });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { newPassword } = req.body;
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');

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

    const actorName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || 'System';
    await createLog(
      req.user?.id || 'system',
      actorName,
      'RESET_PASSWORD',
      'ADMINISTRATION',
      `Password reset for ${user.email}`,
      ip,
      'Success',
      { userRole: req.user?.role, afterValue: { userId: user._id.toString() } }
    );

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error resetting password', error: error.message });
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const safeguard = await checkAdminSafeguard({
      userId: user._id.toString(),
      operation: 'deactivate',
      nextIsActive: false,
    });
    if (!safeguard.ok) {
      res.status(400).json({ success: false, message: safeguard.message });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!updated) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (updated.employeeId) {
      await Employee.findByIdAndUpdate(updated.employeeId, { status: 'Inactive' });
    }

    const actorName = [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ').trim() || 'System';
    await createLog(
      req.user?.id || 'system',
      actorName,
      'DEACTIVATE_USER',
      'ADMINISTRATION',
      `Deactivated ${updated.email}`,
      ip,
      'Success',
      { userRole: req.user?.role, afterValue: { userId: updated._id.toString() } }
    );

    res.status(200).json({
      success: true,
      message: `User ${updated.firstName} has been deactivated`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Error deactivating user', error: error.message });
  }
};
