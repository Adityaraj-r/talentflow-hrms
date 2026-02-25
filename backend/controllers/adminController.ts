import { Request, Response } from 'express';
import User from '../models/User.model';
import bcrypt from 'bcryptjs';
import csv from 'csv-parser';
import fs from 'fs';
import mongoose from 'mongoose';
import { createLog } from './audit.controller';
import Document from '../models/Document.model';
import Transfer from '../models/Transfer.model';
import Requisition from '../models/Requisition.model';
import Leave from '../models/leave.model';

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
  user: { name: string; email: string; role: string } | null;
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
          if (!row.email || !row.firstName || !row.lastName || !row.role) {
            errors.push({ email: row.email || 'unknown', error: 'Missing required fields' });
            continue;
          }

          const existingUser = await User.findOne({ email: row.email.toLowerCase().trim() });
          if (existingUser) {
            errors.push({ email: row.email, error: 'User already exists' });
            continue;
          }

          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(row.password || 'Temporary123!', salt);

          processedUsers.push({
            email: row.email.toLowerCase().trim(),
            password: hashedPassword,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            role: row.role.trim().toUpperCase(),
            department: row.department || null,
            phoneNumber: row.phoneNumber?.trim() || null,
            isActive: true,
            isEmailVerified: true
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
        errors
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
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const systemAlertsCount = await SystemAlert.countDocuments({
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    });

    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const previousMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

    const [currentStats, previousStats] = await Promise.all([
      User.aggregate([{ $match: { isDeleted: false, createdAt: { $gte: currentMonthStart } } }, { $group: { _id: null, newUsers: { $sum: 1 } } }]),
      User.aggregate([{ $match: { isDeleted: false, createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } } }, { $group: { _id: null, newUsers: { $sum: 1 } } }])
    ]);

    const currentMonthNewUsers = currentStats[0]?.newUsers || 0;
    const previousMonthNewUsers = previousStats[0]?.newUsers || 1;
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
      securityColor: securityColor as any,
      metadata: { currentMonthNewUsers, previousMonthNewUsers, lastUpdated: new Date().toISOString() }
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
      Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('userId', 'firstName lastName email role').lean(),
      Activity.countDocuments(filter)
    ]);

    const formattedActivities: ActivityResponse[] = activities.map((activity: any) => ({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: formatRelativeTime(activity.createdAt),
      user: activity.userId ? {
        name: `${activity.userId.firstName || ''} ${activity.userId.lastName || ''}`.trim(),
        email: activity.userId.email,
        role: activity.userId.role
      } : null,
      metadata: activity.metadata
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: formattedActivities,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalCount / Number(limit)),
          totalItems: totalCount,
          itemsPerPage: Number(limit)
        }
      }
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
      { $sort: { count: -1 } }
    ]);

    const total = distribution.reduce((sum: number, item: any) => sum + item.count, 0);
    const distributionWithPercentage = distribution.map((item: any) => ({
      role: item.role,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
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
          activeEmployees: { $sum: { $cond: [{ $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] }, 1, 0] } }
        }
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          activeEmployees: 1,
          activePercentage: { $multiply: [{ $divide: ['$activeEmployees', '$employeeCount'] }, 100] },
          _id: 0
        }
      },
      { $sort: { employeeCount: -1 } }
    ]);

    res.status(200).json({ success: true, data: departmentStats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch department stats' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const query: any = { isDeleted: { $ne: true } };

    if (role && role !== 'all') query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
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
    await createLog(req.user?.id || 'system', adminName, action, 'User Management', `${action} for: ${user.email}`, String(ip), 'Success');

    res.status(200).json({ success: true, message: 'User status updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Toggle failed' });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Fetch Top-Level Stat Cards
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: { $ne: true } });

    const pendingDocuments = await Document.countDocuments({ status: 'Pending' });
    const pendingTransfers = await Transfer.countDocuments({ status: 'Pending' });
    const pendingRequisitions = await Requisition.countDocuments({ status: 'Pending' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    const totalPendingApprovals = pendingDocuments + pendingTransfers + pendingRequisitions + pendingLeaves;

    const pendingBreakdown = [
      { module: 'KYC Documents', count: pendingDocuments, fill: '#f59e0b' }, // Amber
      { module: 'Transfers', count: pendingTransfers, fill: '#3b82f6' },     // Blue
      { module: 'Requisitions', count: pendingRequisitions, fill: '#8b5cf6' },// Purple
      { module: 'Leave Requests', count: pendingLeaves, fill: '#10b981' }    //  Emerald Green
    ];

    // 2. Aggregate Department Distribution Data
    const departmentData = await User.aggregate([
      // Exclude users without a department
      { $match: { department: { $ne: null }, isDeleted: { $ne: true } } }, 
      { $group: { _id: '$department', employees: { $sum: 1 } } },
      // Map MongoDB _id to 'name' for the Recharts library
      { $project: { name: '$_id', employees: 1, _id: 0 } },
      { $sort: { employees: -1 } } // Sort highest to lowest
    ]);

    // 3. Aggregate Role Distribution Data
    const roleData = await User.aggregate([
      { $match: { role: { $ne: null }, isDeleted: { $ne: true } } },
      { $group: { _id: '$role', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    const genderData = await User.aggregate([
      { $match: { gender: { $ne: null }, isDeleted: { $ne: true } } },
      { $group: { _id: '$gender', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        departmentData,
        roleData,
        genderData,
        pendingApprovals: totalPendingApprovals,
        pendingBreakdown,
      }
    });
  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ success: false, message: "Error fetching dashboard stats" });
  }
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
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
