import { Request, Response } from 'express';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import bcrypt from 'bcryptjs';
import { auth } from '../config/firebase'; // Your shared firebase file
import csv from 'csv-parser';
import fs from 'fs';
import mongoose from 'mongoose';

/**
 * Bulk upload users via CSV
 * @route POST /api/admin/bulk-upload
 */
export const bulkUploadUsers = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    return;
  }

  const results: any[] = [];
  const errors: any[] = [];
  const stream = fs.createReadStream(req.file.path).pipe(csv());

  stream.on('data', (data) =>{ 
    console.log('✅ Row parsed by CSV:', data);
    results.push(data)});

  stream.on('end', async () => {
    console.log('📊 Total results in array:', results.length);
    if (results.length === 0) {
      console.log('❌ ERROR: No rows were detected. Check if CSV uses commas or semicolons.');
    }
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const processedUsers = [];

      // backend/src/controllers/adminController.ts

// backend/src/controllers/adminController.ts

for (const row of results) {
  try {
    console.log(`Processing: ${row.email}`);

    // Check if user exists in Firebase first to avoid the crash
    let firebaseUid;
    try {
      const existingFirebaseUser = await auth.getUserByEmail(row.email);
      firebaseUid = existingFirebaseUser.uid;
      console.log(`Found existing Firebase user: ${firebaseUid}`);
    } catch (err) {
      // User doesn't exist, create them
      const newFirebaseUser = await auth.createUser({
        email: row.email.trim(),
        password: row.password || 'Temporary123!',
        displayName: `${row.firstName} ${row.lastName}`,
      });
      firebaseUid = newFirebaseUser.uid;
      console.log(`Created new Firebase user: ${firebaseUid}`);
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
      isActive: true,
      isEmailVerified: true,
      isDeleted: false
    });

  } catch (err: any) {
    console.error(`❌ Final Error for ${row.email}:`, err.message);
    errors.push({ email: row.email, error: err.message });
  }
}

      // 4. Bulk Insert to MongoDB
      if (processedUsers.length > 0) {
        await User.insertMany(processedUsers, { session });
      }

      await session.commitTransaction();
      
      // Cleanup: Delete the uploaded file
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

// Use require for Activity and SystemAlert (TypeScript workaround)
const Activity = require('../models/Activity').default || require('../models/Activity');
const SystemAlert = require('../models/SystemAlert').default || require('../models/SystemAlert');

// Types
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
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

/**
 * Get comprehensive admin dashboard metrics
 * @route GET /api/admin/metrics
 * @access Private (Admin only)
 */
export const getAdminMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          newUsers: { $sum: 1 },
        },
      },
    ]);

    const previousMonthStats = await User.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          newUsers: { $sum: 1 },
        },
      },
    ]);

    const currentMonthNewUsers = userStats[0]?.newUsers || 0;
    const previousMonthNewUsers = previousMonthStats[0]?.newUsers || 1;
    const userGrowthPercentage = (
      ((currentMonthNewUsers - previousMonthNewUsers) / previousMonthNewUsers) * 100
    ).toFixed(1);

    const activeUserPercentage =
      totalUsers > 0 ? ((activeUsersCount / totalUsers) * 100).toFixed(1) : '0';

    const securityStatus: string =
      systemAlertsCount === 0 ? 'Secure' : systemAlertsCount <= 2 ? 'Warning' : 'Alert';

    const securityColor: 'green' | 'yellow' | 'red' =
      securityStatus === 'Secure' ? 'green' : securityStatus === 'Warning' ? 'yellow' : 'red';

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

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin metrics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * Get recent system activities with pagination
 * @route GET /api/admin/activities
 * @access Private (Admin only)
 */
export const getRecentActivities = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: Record<string, any> = {};
    if (type && type !== 'all') {
      filter.type = type;
    }

    const [activities, totalCount] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email role')
        .lean(),

      Activity.countDocuments(filter),
    ]);

    const formattedActivities: ActivityResponse[] = activities.map((activity: any) => ({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: formatRelativeTime(activity.createdAt),
      user: activity.userId
        ? {
            name: activity.userId.name,
            email: activity.userId.email,
            role: activity.userId.role,
          }
        : null,
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
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * Get user distribution by role for charts
 * @route GET /api/admin/user-distribution
 * @access Private (Admin only)
 */
export const getUserDistribution = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const distribution = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = distribution.reduce((sum: number, item: any) => sum + item.count, 0);
    const distributionWithPercentage = distribution.map((item: any) => ({
      role: item.role,
      count: item.count,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
    }));

    res.status(200).json({
      success: true,
      data: {
        distribution: distributionWithPercentage,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user distribution',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

/**
 * Get department statistics
 * @route GET /api/admin/department-stats
 * @access Private (Admin only)
 */
export const getDepartmentStats = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const departmentStats = await User.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$department',
          employeeCount: { $sum: 1 },
          activeEmployees: {
            $sum: {
              $cond: [
                {
                  $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          activeEmployees: 1,
          activePercentage: {
            $multiply: [{ $divide: ['$activeEmployees', '$employeeCount'] }, 100],
          },
          _id: 0,
        },
      },
      { $sort: { employeeCount: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: departmentStats,
    });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department statistics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    });
  }
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
}
/**
 * Enroll a new user into the system
 * @route POST /api/admin/enroll-user
 */
/**
 * Enroll a new user into the system
 * @route POST /api/admin/enroll-user
 */
export const enrollNewUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, role, department, phoneNumber } = req.body;

    // 1. Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      department,
      phoneNumber,
      isActive: true,
      isEmailVerified: true,
      isDeleted: false 
    });

    await newUser.save();

    // --- START ENHANCEMENT: Activity Logging ---
    try {
      if (Activity) {
        await new Activity({
          type: 'USER_MANAGEMENT',
          title: 'New User Enrolled',
          description: `Admin enrolled ${firstName} ${lastName} (${email}) to the ${department} department.`,
          userId: (req as AuthRequest).user?.id, // Captures the ID of the Admin who performed the action
          metadata: {
            newUserId: newUser._id,
            role: role,
            department: department
          },
          createdAt: new Date()
        }).save();
      }
    } catch (activityError) {
      // We log the error but don't fail the whole request if activity logging fails
      console.error('Failed to log enrollment activity:', activityError);
    }
    // --- END ENHANCEMENT ---

    res.status(201).json({
      success: true,
      message: 'User enrolled successfully',
      data: { id: newUser._id, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Enrollment failed', 
      error: (error as Error).message 
    });
  }
};
/**
 * Get all users with filtering and search
 * @route GET /api/admin/users
 */
// backend/src/controllers/adminController.ts

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;

    // FIX: Match documents where isDeleted is false OR doesn't exist at all
    let query: any = { 
      isDeleted: { $ne: true } 
    };

    if (role && role !== 'all') {
      query.role = role;
    }
// ... rest of the code remains the same

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch users sorted by newest first
    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: (error as Error).message
    });
  }
};

// Deactive button logic 

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // 1. Find the current user
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // 2. Flip the isActive status (If true -> false, if false -> true)
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'Reactivated' : 'Deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Toggle failed', error: (error as Error).message });
  }
};