import { Request, Response } from "express";
import mongoose from "mongoose";
import Employee from "../models/Employee.model";
import Attendance from "../models/Attendance.model";
import Leave from "../models/leave.model";
import { PerformanceReviewModel } from "../models/PerformanceReview";
import Job from "../models/job.model";

const buildEmployeeFilter = (
  query: any,
  user?: any
) => {
  const { department, role } = query;

  const filter: any = {};

  const deptValue = String(
    department || ""
  ).trim();

  const roleValue = String(
    role || ""
  ).trim();

  const empIdValue = String(
    query.employeeId || ""
  ).trim();

  if (
    empIdValue &&
    empIdValue.toLowerCase() !== "all"
  ) {
    if (mongoose.Types.ObjectId.isValid(empIdValue)) {
      filter.userId = new mongoose.Types.ObjectId(empIdValue);
    }
  }

  if (
    user?.role === "DEPARTMENT_MANAGER"
  ) {
    filter.department = user.department;
  }

  else if (
    deptValue &&
    deptValue.toLowerCase() !== "all" &&
    deptValue.toLowerCase() !== "all departments"
  ) {
    if (
      mongoose.Types.ObjectId.isValid(
        deptValue
      )
    ) {
      filter.department =
        new mongoose.Types.ObjectId(
          deptValue
        );
    }
  }

  if (
    roleValue &&
    roleValue.toLowerCase() !== "all" &&
    roleValue.toLowerCase() !== "all roles"
  ) {
    filter.role = roleValue;
  }

  return filter;
};

const getFilteredEmployees = async (
  query: any,
  user?: any
) => {
  const filter = buildEmployeeFilter(
    query,
    user
  );

  const employees = await Employee.find(
    filter
  )
    .select(
      "userId department status salary.basic joiningDate firstName lastName designation role"
    )
    .lean();

  const userIds = employees
    .map((e: any) => e.userId)
    .filter(Boolean);

  return {
    employees,
    userIds,
    filter,
  };
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { employees, userIds } = await getFilteredEmployees( req.query, req.user);

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === "Active").length;
    const inactiveEmployees = employees.filter(e => ["Inactive", "Terminated"].includes(e.status)).length;

    const attritionRate =
      totalEmployees > 0
        ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
        : 0;

    const totalPayroll = employees
      .filter(e => e.status === "Active")
      .reduce((sum, e) => sum + (e.salary?.basic || 0), 0);

    const match: any = { userId: { $in: userIds } };

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      match.date = { $gte: start, $lte: end };
    }

    const attendanceAgg = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalHours: { $sum: { $ifNull: ["$totalHours", 0] } },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [
                { $in: ["$status", ["Present", "Late", "Half Day"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const totalHours = attendanceAgg?.[0]?.totalHours ?? 0;
    const totalDays = attendanceAgg?.[0]?.totalDays ?? 0;
    const presentDays = attendanceAgg?.[0]?.presentDays ?? 0;

    const avgWorkingHours =
      totalDays > 0 ? Number((totalHours / totalDays).toFixed(1)) : 0;

    const avgAttendance =
      totalDays > 0
        ? Number(((presentDays / totalDays) * 100).toFixed(1))
        : 0;

    const performanceAgg = await PerformanceReviewModel.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$overallRating" },
        },
      },
    ]);

    const avgPerformance =
      performanceAgg?.[0]?.avgRating
        ? Number(((performanceAgg[0].avgRating / 5) * 100).toFixed(1))
        : 0;

    const productivityScore =
      avgWorkingHours > 0 ? Math.min((avgWorkingHours / 8) * 100, 100) : 0;

    const workforceHealthScore = Number(
      ((avgAttendance + avgPerformance + productivityScore) / 3).toFixed(1)
    );

    const openPositions = await Job.countDocuments({ status: "Published" });

    res.json({
      success: true,
      data: {
        headcount: totalEmployees,
        activeEmployees,
        attritionRate,
        avgAttendance,
        totalPayroll,
        totalWorkingHours: Number(totalHours.toFixed(1)),
        avgWorkingHours,
        workforceHealthScore,
        openPositions,
      },
    });

  } catch (error) {
    console.error("getSummary error:", error);
    res.status(500).json({ success: false });
  }
};

export const getWorkforceData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { employees } = await getFilteredEmployees( req.query, req.user );

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setMonth(new Date().getMonth() - 12));

    const end = endDate ? new Date(endDate) : new Date();

    const monthlyData: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      const monthEnd = new Date(current);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const count = employees.filter(emp =>
        emp.joiningDate && new Date(emp.joiningDate) <= monthEnd
      ).length;

      monthlyData.push({
        month: current.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        headcount: count,
      });

      current.setMonth(current.getMonth() + 1);
    }

    res.json({ success: true, data: monthlyData });

  } catch (error) {
    console.error("getWorkforceData error:", error);
    res.status(500).json({ success: false });
  }
};

export const getAttendanceData = async (
  req: Request,
  res: Response
) => {
  try {
    const { startDate, endDate } = req.query as any;

    const { userIds } = await getFilteredEmployees( req.query, req.user );

    const match: any = {
      userId: { $in: userIds },
      date: { $ne: null }, // prevent null date crash
    };

    if (startDate && endDate) {
      match.date = {
        $gte: new Date(startDate).toISOString().split("T")[0],
        $lte: new Date(endDate).toISOString().split("T")[0],
      };
    }

    const attendance = await Attendance.aggregate([
      { $match: match },

      {
        $group: {
          _id: {
            year: { $year: { $toDate: "$date" } },
            month: { $month: { $toDate: "$date" } },
          },

          totalDays: { $sum: 1 },

          presentDays: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Present", "Late", "Half Day"],
                  ],
                },
                1,
                0,
              ],
            },
          },

          lateMarks: {
            $sum: {
              $cond: [{ $eq: ["$status", "Late"] }, 1, 0],
            },
          },

          leavesTaken: {
            $sum: {
              $cond: [{ $eq: ["$status", "Leave"] }, 1, 0],
            },
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr",
      "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec",
    ];

    const formatted = attendance.map((item: any) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      totalDays: item.totalDays,
      presentDays: item.presentDays,
      lateMarks: item.lateMarks,
      leavesTaken: item.leavesTaken,

      attendance:
        item.totalDays > 0
          ? Number(
              (
                (item.presentDays / item.totalDays) *
                100
              ).toFixed(1)
            )
          : 0,

      complianceScore:
        item.totalDays > 0
          ? Number(
              (
                (item.presentDays / item.totalDays) *
                100
              ).toFixed(1)
            )
          : 0,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });

  } catch (error) {
    console.error("Attendance Error:", error);

    return res.status(200).json({
      success: true,
      data: [],
    });
  }
};

export const getDepartmentData = async (req: Request, res: Response) => {
  try {
    const data = await Employee.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: "$department",
          employees: { $sum: 1 },
        },
      },
    ]);

    const result = data.map((d: any) => ({
      department: d._id,
      employees: d.employees,
    }));

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("getDepartmentData error:", error);
    res.status(500).json({ success: false });
  }
};

export const getLeaveData = async (req: Request, res: Response) => {
  try {
    const { userIds } = await getFilteredEmployees( req.query, req.user );

    const data = await Leave.aggregate([
      { $match: { status: "Approved", userId: { $in: userIds } } },
      {
        $group: {
          _id: "$leaveType",
          value: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: data.map((d: any) => ({
        name: d._id,
        value: d.value,
      })),
    });

  } catch (error) {
    console.error("getLeaveData error:", error);
    res.status(500).json({ success: false });
  }
};

export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 10 } = req.query as any;
    const { employees } = await getFilteredEmployees( req.query, req.user );

    let filtered = employees;

    if (search) {
      filtered = filtered.filter((e: any) =>
        `${e.firstName} ${e.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    const skip = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(skip, skip + Number(limit));

    const reviews = await PerformanceReviewModel.find({
      employeeId: { $in: employees.map(e => e.userId).filter(Boolean) as mongoose.Types.ObjectId[] },
      status: { $in: ["completed", "approved"] },
    }).lean();

    const performanceMap: any = {};

    reviews.forEach((review: any) => {
      const score = (review.overallRating / 5) * 100;

      if (!performanceMap[review.employeeId]) {
        performanceMap[review.employeeId] = [];
      }

      performanceMap[review.employeeId].push(score);
    });

    const userIds = paginated.map((e: any) => e.userId);

    // Get attendance stats per employee
    const attendanceStats = await Attendance.aggregate([
      { $match: { userId: { $in: userIds } } },
      {
        $group: {
          _id: "$userId",
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $in: ["$status", ["Present", "Half Day", "Late"]] }, 1, 0]
            }
          },
          lateMarks: {
            $sum: {
              $cond: [{ $eq: ["$status", "Late"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const attendanceMap: any = {};
    attendanceStats.forEach(stat => {
      attendanceMap[stat._id.toString()] = {
        attendancePercent: stat.totalDays > 0 ? Math.round((stat.presentDays / stat.totalDays) * 100) : 0,
        lateMarks: stat.lateMarks
      };
    });

    // Get leave stats per employee
    const leaveStats = await Leave.aggregate([
      { $match: { userId: { $in: userIds }, status: "Approved" } },
      {
        $group: {
          _id: "$userId",
          totalLeaves: { $sum: "$totalDays" }
        }
      }
    ]);

    const leaveMap: any = {};
    leaveStats.forEach(stat => {
      leaveMap[stat._id.toString()] = stat.totalLeaves;
    });

    const formatted = paginated.map((emp: any) => {
      const scores = performanceMap[emp.userId] || [];
      const userIdStr = emp.userId?.toString() || "";

      const avgPerformance =
        scores.length > 0
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;
          
      const attStats = attendanceMap[userIdStr] || { attendancePercent: 0, lateMarks: 0 };
      const totalLeaves = leaveMap[userIdStr] || 0;

      return {
        ...emp,
        attendance: attStats.attendancePercent,
        leaves: totalLeaves,
        lateMarks: attStats.lateMarks,
        compliance: avgPerformance,
        performanceScore: avgPerformance,
        grade:
          avgPerformance > 85
            ? "A"
            : avgPerformance > 70
              ? "B"
              : avgPerformance > 50
                ? "C"
                : "D",
      };
    });

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: filtered.length,
        page: Number(page),
        pages: Math.ceil(filtered.length / Number(limit)),
      },
    });

  } catch (error) {
    console.error("getEmployeePerformance error:", error);
    res.status(500).json({ success: false });
  }
};

export const getDepartmentWorkingHours = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { userIds } = await getFilteredEmployees( req.query, req.user );

    const match: any = { userId: { $in: userIds } };

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      match.date = { $gte: start, $lte: end };
    }

    const result = await Attendance.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "employees",
          localField: "userId",
          foreignField: "userId",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee.department",
          totalHours: { $sum: { $ifNull: ["$totalHours", 0] } },
          totalRecords: { $sum: 1 },
        },
      },
      {
        $project: {
          department: "$_id",
          totalHours: { $round: ["$totalHours", 1] },
          avgHoursPerDay: {
            $round: [{ $divide: ["$totalHours", "$totalRecords"] }, 1],
          },
        },
      },
    ]);

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("getDepartmentWorkingHours error:", error);
    res.status(500).json({ success: false });
  }
};

export const getExportData = async (req: Request, res: Response) => {
  
  try {
    const { type = "csv", startDate, endDate } = req.query as any;

    const { employees, userIds } = await getFilteredEmployees(
      req.query,
      req.user
    );

    const match: any = { userId: { $in: userIds } };

    if (startDate && endDate) {
      match.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const attendanceAgg = await Attendance.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$userId",
          totalHours: { $sum: { $ifNull: ["$totalHours", 0] } },
          totalDays: { $sum: 1 },
        },
      },
    ]);

    const attendanceMap: any = {};
    attendanceAgg.forEach((a: any) => {
      attendanceMap[a._id] = a;
    });

    const exportData = employees.map((emp: any) => {
      const att = attendanceMap[emp.userId] || {};

      return {
        Name: `${emp.firstName} ${emp.lastName}`,
        Department: emp.department,
        Role: emp.designation,
        Status: emp.status,
        TotalWorkingHours: att.totalHours || 0,
        TotalDays: att.totalDays || 0,
      };
    });

    if (type === "csv") {
      let csv =
        "Name,Department,Role,Status,TotalWorkingHours,TotalDays\n";

      exportData.forEach((row: any) => {
        csv += `${row.Name},${row.Department},${row.Role},${row.Status},${row.TotalWorkingHours},${row.TotalDays}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=reports.csv"
      );

      return res.send(csv);
    }

    if (type === "pdf") {
      const PDFDocument = require("pdfkit");
      const doc = new PDFDocument({ margin: 30 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=reports.pdf"
      );

      doc.pipe(res);

      doc.fontSize(20).text("HRMS Reports Export", {
        align: "center",
      });

      doc.moveDown();

      exportData.forEach((row: any, index: number) => {
        doc
          .fontSize(12)
          .text(
            `${index + 1}. ${row.Name} | ${row.Department} | ${row.Role} | ${row.Status} | Hours: ${row.TotalWorkingHours}`
          );
      });

      doc.end();
      return;
    }

    return res.status(400).json({
      success: false,
      message: "Invalid export type",
    });

  } catch (error) {
    console.error("getExportData error:", error);

    return res.status(500).json({
      success: false,
    });
  }
};

export const getProductivityMetrics = async (req: Request, res: Response) => {
  try {
    const { userIds } = await getFilteredEmployees( req.query, req.user );

    const attendance = await Attendance.find({
      userId: { $in: userIds },
    }).lean();

    let totalHours = 0;
    let totalBreakMinutes = 0;
    let totalDays = 0;

    attendance.forEach((a: any) => {
      if (a.totalHours) {
        totalHours += a.totalHours;
        totalBreakMinutes += a.totalBreakMinutes || 0;
        totalDays++;
      }
    });

    const avgWorkingHours =
      totalDays > 0 ? Number((totalHours / totalDays).toFixed(1)) : 0;

    const avgBreakHours =
      totalDays > 0
        ? Number((totalBreakMinutes / totalDays / 60).toFixed(1))
        : 0;

    const efficiency =
      avgWorkingHours > 0
        ? Number((((avgWorkingHours - avgBreakHours) / avgWorkingHours) * 100).toFixed(1))
        : 0;

    const productivity =
      avgWorkingHours > 0
        ? Number(Math.min((avgWorkingHours / 8) * 100, 100).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        avgWorkingHours,
        avgBreakHours,
        efficiency,
        productivity,
      },
    });
  } catch (error) {
    console.error("getProductivityMetrics error:", error);
    res.status(500).json({ success: false });
  }
};

export const getCEOInsights = async (req: Request, res: Response) => {
  try {
    const { employees } = await getFilteredEmployees( req.query, req.user );

    const reviews = await PerformanceReviewModel.find({
      employeeId: { $in: employees.map(e => e.userId).filter(Boolean) as mongoose.Types.ObjectId[] },
      status: { $in: ["completed", "approved"] },
    }).lean();

    const performanceMap: any = {};

    reviews.forEach((review: any) => {
      const score = (review.overallRating / 5) * 100;

      if (!performanceMap[review.employeeId]) {
        performanceMap[review.employeeId] = [];
      }

      performanceMap[review.employeeId].push(score);
    });

    const employeePerformance = employees.map((emp: any) => {
      const scores = performanceMap[emp.userId] || [];

      const avgPerformance =
        scores.length > 0
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0;

      return {
        name: `${emp.firstName} ${emp.lastName}`,
        performance: avgPerformance,
      };
    });

    const sorted = [...employeePerformance].sort((a, b) => b.performance - a.performance);

    const topPerformers = sorted.slice(0, 5);
    const lowPerformers = sorted.slice(-5);

    const distribution = {
      A: employeePerformance.filter(e => e.performance > 85).length,
      B: employeePerformance.filter(e => e.performance > 70 && e.performance <= 85).length,
      C: employeePerformance.filter(e => e.performance > 50 && e.performance <= 70).length,
      D: employeePerformance.filter(e => e.performance <= 50).length,
    };

    res.json({
      success: true,
      data: {
        topPerformers,
        lowPerformers,
        distribution,
      },
    });

  } catch (error) {
    console.error("getCEOInsights error:", error);
    res.status(500).json({ success: false });
  }
};