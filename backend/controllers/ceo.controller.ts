import { Request, Response } from 'express';
import User from '../models/User.model';
import Transfer from '../models/Transfer.model';
import Requisition from '../models/Requisition.model';
import Job from '../models/job.model';
import Application from '../models/application.model';
import Offer from '../models/Offer.model';

export class CeoController {
  private static parseMaxSalary(salaryRange?: string): number {
    if (!salaryRange) return 0;
    const numbers = salaryRange
      .toString()
      .match(/\d+(?:\.\d+)?/g)
      ?.map((n) => Number(n))
      .filter((n) => Number.isFinite(n)) || [];
    if (numbers.length === 0) return 0;
    return Math.max(...numbers);
  }

  private static isExecutiveTitle(title?: string): boolean {
    const text = (title || '').toLowerCase();
    return /(chief|cxo|vp|vice president|director|head)/i.test(text);
  }

  private static requisitionNeedsCeo(requisition: any): boolean {
    const salaryThreshold = Number(process.env.CEO_REQUISITION_SALARY_THRESHOLD || 250000);
    const maxSalary = CeoController.parseMaxSalary(requisition?.salaryRange);
    const urgency = (requisition?.urgency || '').toString().toLowerCase();
    return maxSalary >= salaryThreshold || urgency === 'high' || CeoController.isExecutiveTitle(requisition?.position);
  }

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

  static async getRecruitmentOverview(req: Request, res: Response) {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);

      const [
        openRequisitions,
        requisitionsYtd,
        jobsPublished,
        applications,
        pendingReqs,
        requisitions12m,
        applications12m,
      ] = await Promise.all([
        Requisition.countDocuments({ status: { $in: ['Pending', 'Approved'] } }),
        Requisition.countDocuments({ createdAt: { $gte: startOfYear } }),
        Job.countDocuments({ status: 'Published' }),
        Application.find().populate('jobId', 'jobTitle department').sort({ createdAt: -1 }).limit(300),
        Requisition.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(150),
        Requisition.find({ createdAt: { $gte: twelveMonthsAgo } })
          .select('createdAt status department urgency position salaryRange')
          .sort({ createdAt: 1 })
          .limit(3000),
        Application.find({ createdAt: { $gte: twelveMonthsAgo } })
          .select('createdAt status')
          .sort({ createdAt: 1 })
          .limit(3000),
      ]);

      const executiveApplications = applications.filter((app: any) =>
        CeoController.isExecutiveTitle(app?.jobId?.jobTitle)
      );

      const hiresSixMonths = applications.filter((app: any) =>
        (app?.status || '').toString().toLowerCase() === 'hired' &&
        app?.updatedAt &&
        new Date(app.updatedAt) >= sixMonthsAgo
      ).length;

      const pendingExecutiveRequisitions = pendingReqs.filter((r: any) =>
        CeoController.requisitionNeedsCeo(r)
      ).length;

      const budgetTarget = Number(process.env.CEO_RECRUITMENT_BUDGET_TARGET || 500000);
      const requisitionBudgetActual = pendingReqs.reduce((sum: number, r: any) => {
        return sum + CeoController.parseMaxSalary(r.salaryRange);
      }, 0);
      const budgetUtilization = budgetTarget > 0
        ? Number(((requisitionBudgetActual / budgetTarget) * 100).toFixed(1))
        : 0;

      const monthKey = (date: Date) =>
        new Date(date).toLocaleDateString('en-US', { month: 'short' });

      const reqByMonthMap: Record<string, number> = {};
      const approvedByMonthMap: Record<string, number> = {};
      const appByMonthMap: Record<string, number> = {};
      const baseMonths: string[] = [];

      for (let i = 11; i >= 0; i -= 1) {
        const dt = new Date();
        dt.setMonth(dt.getMonth() - i);
        const key = monthKey(dt);
        baseMonths.push(key);
        reqByMonthMap[key] = 0;
        approvedByMonthMap[key] = 0;
        appByMonthMap[key] = 0;
      }

      requisitions12m.forEach((r: any) => {
        const key = monthKey(r.createdAt);
        if (reqByMonthMap[key] === undefined) return;
        reqByMonthMap[key] += 1;
        if ((r.status || '').toString().toLowerCase() === 'approved') {
          approvedByMonthMap[key] += 1;
        }
      });

      applications12m.forEach((a: any) => {
        const key = monthKey(a.createdAt);
        if (appByMonthMap[key] === undefined) return;
        appByMonthMap[key] += 1;
      });

      const hiringTrend = baseMonths.map((m) => ({
        month: m,
        requisitions: reqByMonthMap[m] || 0,
        approved: approvedByMonthMap[m] || 0,
        applications: appByMonthMap[m] || 0,
      }));

      const departmentMap: Record<string, { pending: number; highUrgency: number; avgMaxSalary: number; count: number }> = {};
      requisitions12m.forEach((r: any) => {
        const dept = (r.department || 'Unassigned').toString();
        if (!departmentMap[dept]) {
          departmentMap[dept] = { pending: 0, highUrgency: 0, avgMaxSalary: 0, count: 0 };
        }
        const maxSalary = CeoController.parseMaxSalary(r.salaryRange);
        departmentMap[dept].count += 1;
        departmentMap[dept].avgMaxSalary += maxSalary;
        if ((r.status || '').toString().toLowerCase() === 'pending') departmentMap[dept].pending += 1;
        if ((r.urgency || '').toString().toLowerCase() === 'high') departmentMap[dept].highUrgency += 1;
      });

      const departmentBottlenecks = Object.entries(departmentMap)
        .map(([department, d]) => ({
          department,
          pending: d.pending,
          highUrgency: d.highUrgency,
          avgMaxSalary: d.count > 0 ? Math.round(d.avgMaxSalary / d.count) : 0,
        }))
        .sort((a, b) => b.pending - a.pending)
        .slice(0, 8);

      const acceptedCount = applications.filter(
        (a: any) => (a.status || '').toString().toLowerCase() === 'accepted'
      ).length;
      const declinedCount = applications.filter(
        (a: any) => (a.status || '').toString().toLowerCase() === 'declined'
      ).length;
      const offeredCount = applications.filter(
        (a: any) => ['offered', 'accepted', 'declined'].includes((a.status || '').toString().toLowerCase())
      ).length;

      const acceptanceRate = offeredCount > 0
        ? Number(((acceptedCount / offeredCount) * 100).toFixed(1))
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          hiringVelocity: {
            ytdRequisitions: requisitionsYtd,
            openRequisitions,
            jobsPublished,
            targetYear: Number(process.env.CEO_HIRING_TARGET_YEAR || 2026),
            targetOpenRequisitions: Number(process.env.CEO_OPEN_REQUISITIONS_TARGET || 30),
          },
          financialHealth: {
            budgetTarget,
            actual: requisitionBudgetActual,
            utilizationPct: budgetUtilization,
          },
          qualityAndDiversity: {
            sixMonthHires: hiresSixMonths,
            executiveApplications: executiveApplications.length,
            diversityBenchmarkPct: Number(process.env.CEO_DIVERSITY_BENCHMARK_PCT || 35),
            acceptanceRate,
            declinedOffers: declinedCount,
          },
          bottlenecks: {
            pendingExecutiveRequisitions,
          },
          charts: {
            hiringTrend,
            departmentBottlenecks,
          },
        },
      });
    } catch (error: any) {
      console.error('CEO recruitment overview error:', error);
      return res.status(500).json({ success: false, error: 'Failed to load CEO recruitment overview' });
    }
  }

  static async getExecutiveApprovals(req: Request, res: Response) {
    try {
      const requisitions = await Requisition.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(150);
      const reqRows = requisitions
        .filter((r: any) => CeoController.requisitionNeedsCeo(r))
        .map((r: any) => ({
          _id: r._id,
          type: 'REQUISITION',
          title: r.position,
          department: r.department,
          salaryRange: r.salaryRange,
          urgency: r.urgency,
          reason: r.reason,
          createdAt: r.createdAt,
          status: r.status,
        }));

      const pendingOffers = await Offer.find({ status: 'Pending CEO Approval' })
        .sort({ createdAt: -1 })
        .limit(50);
      const offerRows = pendingOffers.map((o: any) => ({
        _id: o._id,
        type: 'OFFER',
        title: `Offer: ${o.candidateName}`,
        department: '—',
        salaryRange: String(o.salary),
        urgency: 'Normal',
        reason: o.offerId,
        createdAt: o.createdAt,
        status: o.status,
        offerId: o.offerId,
        candidateName: o.candidateName,
        salary: o.salary,
      }));

      return res.status(200).json({ success: true, data: [...offerRows, ...reqRows] });
    } catch (error: any) {
      console.error('CEO executive approvals error:', error);
      return res.status(500).json({ success: false, error: 'Failed to load executive approvals' });
    }
  }
}