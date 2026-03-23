import { Request, Response } from 'express';
import User from '../models/User.model';
import Transfer from '../models/Transfer.model';

export class CeoController {
  static async getDashboardMetrics(req: Request, res: Response) {
    try {
      const [
        totalActiveEmployees,
        totalInactiveEmployees,
        departmentBreakdown,
        pendingTransfers,
      ] = await Promise.all([
        User.countDocuments({ isActive: true, role: { $ne: 'SUPER_ADMIN' } }),
        User.countDocuments({ isActive: false }),

        User.aggregate([
          { $match: { isActive: true, department: { $exists: true, $ne: null } } },
          { $group: { _id: "$department", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Transfer.countDocuments({ status: 'Pending' }),
      ]);


      const totalEverEmployed = totalActiveEmployees + totalInactiveEmployees;
      const turnoverRate = totalEverEmployed > 0
        ? ((totalInactiveEmployees / totalEverEmployed) * 100).toFixed(1) : 0;
      const formattedDepartments = departmentBreakdown.map(dept => ({
        name: dept._id === 'N/A' ? 'Unassigned' : dept._id,
        value: dept.count
      }));

      return res.status(200).json({
        success: true,
        data: {
          kpis: {
            employees: totalActiveEmployees,
            openPositions: 12,
            budgetUtilization: 88,
            turnoverRate: Number(turnoverRate)
          },
          charts: {
            departmentData: formattedDepartments,
          },
          approvals: {
            transfers: pendingTransfers,
            leaves: 5,
            requisitions: 3
          }
        }
      });

    } catch (error: any) {
      console.error('CEO Dashboard Aggregation Error:', error);
      return res.status(500).json({ success: false, error: 'Failed to aggregate dashboard metrics' });
    }
  }
}