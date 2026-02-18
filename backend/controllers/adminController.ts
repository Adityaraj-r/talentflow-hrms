import { Request, Response } from 'express';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import bcrypt from 'bcryptjs';
import { auth } from '../config/firebase';
import csv from 'csv-parser';
import fs from 'fs';
import mongoose from 'mongoose';
import { createLog } from './audit.controller';

const Activity = require('../models/Activity').default || require('../models/Activity');
const SystemAlert = require('../models/SystemAlert').default || require('../models/SystemAlert');

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    firstName?: string;
  };
}

interface MetricsResponse {
  totalUsers: number;
  totalUsersLabel: string;
  totalUsersTrend: 'up' | 'down' | 'neutral';
  totalUsersTrendValue: string;
  activeUsers: number;
  activeUsersLabel: string;
  activeUsersTrend: 'up' | 'down' | 'neutral';
  activeUsersTrendValue: string;
  pendingApprovals: number;
  pendingApprovalsLabel: string;
  systemAlerts: number;
  systemAlertsLabel: string;
  securityStatus: string;
  securityStatusLabel: string;
  securityColor: 'green' | 'yellow' | 'red' | 'purple';
  metadata: {
    currentMonthNewUsers: number;
    previousMonthNewUsers: number;
    lastUpdated: string;
  };
}

interface ActivityResponse {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  metadata?: Record<string, any>;
}

export const bulkUploadUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    return;
  }

  const results: any[] = [];
  const errors: any[] = [];
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const adminName = req.user?.firstName || 'Admin';

  const stream = fs.createReadStream(req.file.path).pipe(csv());

  stream.on('data', (data) => results.push(data));

  stream.on('end', async () => {
    if (results.length === 0) {
      res.status(400).json({ success: false, message: 'No rows detected in CSV' });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const processedUsers = [];

      for (const row of results) {
        try {
          let firebaseUid;
          try {
            const existingFirebaseUser = await auth.getUserByEmail(row.email);
            firebaseUid = existingFirebaseUser.uid;
          } catch (err) {
            const newFirebaseUser = await auth.createUser({
              email: row.email.trim(),
              password: row.password || 'Temporary123!',
              displayName: `${row.firstName} ${row.lastName}`,
            });
            firebaseUid = newFirebaseUser.uid;
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(row.password || 'Temporary123!', salt);

          processedUsers.push({
            firebaseUid,
            email: row.email.toLowerCase().trim(),
            password: hashedPassword,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            role: row.role.trim().toUpperCase(),
            department: row.department,
            phoneNumber: row.phoneNumber.trim(),
            isActive: true,
            isEmailVerified: true,
            isDeleted: false
          });
        } catch (err: any) {
          errors.push({ email: row.email, error: err.message });
        }
      }

      if (processedUsers.length > 0) {
        await User.insertMany(processedUsers, { session });
      }

      await createLog(
        req.user?.id || 'system',
        adminName,
        'Bulk Upload',
        'User Management',
        `Processed ${processedUsers.length} users via CSV`,
        String(ip),
        'Success'
      );

      await session.commitTransaction();
      fs.unlinkSync(req.file!.path);

      res.status(200).json({
        success: true,
        message: `Processed ${processedUsers.length} users successfully.`,
        failedCount: errors.length,
        errors: errors
      });
    } catch (error: any) {
      await session.abortTransaction();
      res.status(500).json({ success: false, message: 'Bulk upload failed', error: error.message });
    } finally {
      session.endSession();
    }
  });
};

export const getAdminMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false });
    const activeUsersCount = await User.countDocuments({
      isDeleted: false,
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const systemAlertsCount = await SystemAlert.countDocuments({
      status: 'active',
      severity: { $in: ['high', 'critical'] },
    });

    const userStats = await User.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, newUsers: { $sum: 1 } } }
    ]);

    const previousMonthStats = await User.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          }
        }
      },
      { $group: { _id: null, newUsers: { $sum: 1 } } }
    ]);

    const currentMonthNewUsers = userStats[0]?.newUsers || 0;
    const previousMonthNewUsers = previousMonthStats[0]?.newUsers || 1;
    const userGrowthPercentage = (((currentMonthNewUsers - previousMonthNewUsers) / previousMonthNewUsers) * 100).toFixed(1);
    const activeUserPercentage = totalUsers > 0 ? ((activeUsersCount / totalUsers) * 100).toFixed(1) : '0';

    const securityStatus = systemAlertsCount === 0 ? 'Secure' : systemAlertsCount <= 2 ? 'Warning' : 'Alert';
    const securityColor = securityStatus === 'Secure' ? 'green' : securityStatus === 'Warning' ? 'yellow' : 'red';

    const metrics: MetricsResponse = {
      totalUsers,
      totalUsersLabel: 'Registered Employees',
      totalUsersTrend: parseFloat(userGrowthPercentage) >= 0 ? 'up' : 'down',
      totalUsersTrendValue: `${Math.abs(parseFloat(userGrowthPercentage))}%`,
      activeUsers: activeUsersCount,
      activeUsersLabel: 'Currently Active',
      activeUsersTrend: parseFloat(activeUserPercentage) >= 50 ? 'up' : 'down',
      activeUsersTrendValue: `${activeUserPercentage}%`,
      pendingApprovals: 0,
      pendingApprovalsLabel: 'Approvals Needed',
      systemAlerts: systemAlertsCount,
      systemAlertsLabel: systemAlertsCount === 0 ? 'All Clear' : 'Requires Attention',
      securityStatus,
      securityStatusLabel: 'System Health',
      securityColor,
      metadata: {
        currentMonthNewUsers,
        previousMonthNewUsers,
        lastUpdated: new Date().toISOString(),
      },
    };

    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch metrics' });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: Record<string, any> = {};
    if (type && type !== 'all') filter.type = type;

    const [activities, totalCount] = await Promise.all([
      Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('userId', 'name email role').lean(),
      Activity.countDocuments(filter),
    ]);

    const formattedActivities: ActivityResponse[] = activities.map((activity: any) => ({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: formatRelativeTime(activity.createdAt),
      user: activity.userId ? { name: activity.userId.name, email: activity.userId.email, role: activity.userId.role } : null,
      metadata: activity.metadata,
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

export const getUserDistribution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const distribution = await User.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    const total = distribution.reduce((sum: number, item: any) => sum + item.count, 0);
    const distributionWithPercentage = distribution.map((item: any) => ({
      role: item.role,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
    }));

    res.status(200).json({ success: true, data: { distribution: distributionWithPercentage, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch distribution' });
  }
};

export const getDepartmentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departmentStats = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$department',
          employeeCount: { $sum: 1 },
          activeEmployees: { $sum: { $cond: [{ $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 1, 0] } },
        },
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          activeEmployees: 1,
          activePercentage: { $multiply: [{ $divide: ['$activeEmployees', '$employeeCount'] }, 100] },
          _id: 0,
        },
      },
      { $sort: { employeeCount: -1 } },
    ]);

    res.status(200).json({ success: true, data: departmentStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch department stats' });
  }
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    let query: any = { isDeleted: { $ne: true } };

    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const adminName = req.user?.firstName || 'Admin';

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.isActive = !user.isActive;
    await user.save();

    const action = user.isActive ? 'Activate User' : 'Deactivate User';
    await createLog(
      req.user?.id || 'system',
      adminName,
      action,
      'User Management',
      `${action} for: ${user.email}`,
      String(ip),
      'Success'
    );

    res.status(200).json({ success: true, message: `User status updated successfully`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Toggle failed' });
  }
};