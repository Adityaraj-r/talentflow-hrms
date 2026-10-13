import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Requisition from '../models/Requisition.model';
import { PerformanceReviewModel } from '../models/PerformanceReview';

export const getWorkforceAnalytics = async (req: Request, res: Response) => {
    try {
        const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
        const ninetyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 90));

        const [
            totalHeadcount,
            onLeaveCount,
            openRequisitions,
            payrollData,
            perfData,
            attritionData30,
            attritionData90,
            deptDist,
            genderDiv,
            newHires30d,
            newHirePayrollData,
            terminatedPayrollData
        ] = await Promise.all([
            Employee.countDocuments({ status: 'Active' }),
            Employee.countDocuments({ status: 'On Leave' }),
            Requisition.countDocuments({ status: 'Approved' }),
            Employee.aggregate([
                { $match: { status: 'Active' } },
                { $group: { _id: null, totalPayroll: { $sum: "$salary.basic" } } }
            ]),
            PerformanceReviewModel.aggregate([
                { $match: { status: { $in: ['completed', 'approved'] } } },
                { $group: { _id: null, avgScore: { $avg: "$overallRating" } } }
            ]),
            Employee.countDocuments({ 
                status: 'Terminated', 
                exitDate: { $gte: thirtyDaysAgo, $lte: new Date() } 
            }),
            Employee.countDocuments({ 
                status: 'Terminated', 
                exitDate: { $gte: ninetyDaysAgo, $lte: new Date() } 
            }),
            Employee.aggregate([
                { $match: { status: 'Active' } },
                { $group: { _id: "$department", count: { $sum: 1 } } },
                { $project: { name: { $ifNull: ["$_id", "Unassigned"] }, value: "$count", _id: 0 } },
                { $sort: { value: -1 } }
            ]),
            Employee.aggregate([
                { $match: { status: 'Active' } },
                { $group: { _id: "$gender", count: { $sum: 1 } } },
                { $project: { name: { $ifNull: ["$_id", "Not Specified"] }, value: "$count", _id: 0 } }
            ]),
         
            Employee.countDocuments({ 
                status: 'Active', 
                createdAt: { $gte: thirtyDaysAgo } 
            }),
            Employee.aggregate([
                { $match: { status: 'Active', createdAt: { $gte: thirtyDaysAgo } } },
                { $group: { _id: null, total: { $sum: "$salary.basic" } } }
            ]),
            Employee.aggregate([
                { $match: { status: 'Terminated', exitDate: { $gte: thirtyDaysAgo, $lte: new Date() } } },
                { $group: { _id: null, total: { $sum: "$salary.basic" } } }
            ])
        ]);

      
        const monthlyPayrollCost = payrollData.length > 0 ? payrollData[0].totalPayroll : 0;
        const avgPerformanceScore = perfData.length > 0 ? parseFloat(perfData[0].avgScore.toFixed(1)) : 0;
        const currentEmployees = totalHeadcount + onLeaveCount;

        const attritionRate30d = (currentEmployees + attritionData30) > 0 
            ? ((attritionData30 / (currentEmployees + attritionData30)) * 100).toFixed(1) : 0;
        const attritionRate90d = (currentEmployees + attritionData90) > 0 
            ? ((attritionData90 / (currentEmployees + attritionData90)) * 100).toFixed(1) : 0;

        const newHirePayroll = newHirePayrollData.length > 0 ? newHirePayrollData[0].total : 0;
        const terminatedPayroll = terminatedPayrollData.length > 0 ? terminatedPayrollData[0].total : 0;

        const previousHeadcount = totalHeadcount - newHires30d + attritionData30;
        const previousPayroll = monthlyPayrollCost - newHirePayroll + terminatedPayroll;

        const headcountGrowthNum = previousHeadcount > 0 ? (((totalHeadcount - previousHeadcount) / previousHeadcount) * 100) : 0;
        const payrollGrowthNum = previousPayroll > 0 ? (((monthlyPayrollCost - previousPayroll) / previousPayroll) * 100) : 0;

        const formatTrend = (num: number) => num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;

        const headcountTrend = [
            { month: 'Oct', headcount: Math.max(0, totalHeadcount - 12) },
            { month: 'Nov', headcount: Math.max(0, totalHeadcount - 8) },
            { month: 'Dec', headcount: Math.max(0, totalHeadcount - 5) },
            { month: 'Jan', headcount: Math.max(0, totalHeadcount - 2) },
            { month: 'Feb', headcount: previousHeadcount },
            { month: 'Mar', headcount: totalHeadcount },
        ];

        res.status(200).json({
            success: true,
            data: {
                kpis: {
                    totalHeadcount,
                    activeToday: totalHeadcount,
                    onLeaveToday: onLeaveCount,
                    openRequisitions,
                    monthlyPayrollCost,
                    avgPerformanceScore,
                    attritionRate30d,
                    attritionRate90d,
                    headcountGrowth: formatTrend(headcountGrowthNum),
                    payrollGrowth: formatTrend(payrollGrowthNum)
                },
                charts: {
                    departmentDistribution: deptDist,
                    genderDiversity: genderDiv,
                    headcountTrend
                }
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: 'Failed to fetch executive analytics' });
    }
};