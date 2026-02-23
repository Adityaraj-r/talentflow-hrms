import { Request, Response } from "express";
import Employee from "../models/Employee.model";
import Attendance from "../models/Attendance.model";
import Leave from "../models/leave.model";

/* =========================================================
   SUMMARY (KPI SECTION)
========================================================= */
export const getSummary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, department, role } = req.query;

    const filter: any = {};

    if (department && department !== "all") {
      filter.department = department;
    }

    if (role && role !== "all") {
      filter.designation = role;
    }

    // Headcount
    const headcount = await Employee.countDocuments({
      status: "Active",
      ...filter,
    });

    const totalEmployees = await Employee.countDocuments(filter);
    const inactiveEmployees = await Employee.countDocuments({
      status: "Inactive",
      ...filter,
    });

    const attritionRate =
      totalEmployees > 0
        ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
        : 0;

    /* ================= ATTENDANCE ================= */
    const attendanceMatch: any = {};

    if (startDate && endDate) {
      attendanceMatch.date = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const attendanceData = await Attendance.aggregate([
      { $match: attendanceMatch },
      {
        $group: {
          _id: null,
          avgAttendance: {
            $avg: {
              $cond: [
                { $in: ["$status", ["Present", "Late", "Half Day"]] },
                100,
                0,
              ],
            },
          },
        },
      },
    ]);

    const avgAttendance =
      attendanceData[0]?.avgAttendance
        ? Number(attendanceData[0].avgAttendance.toFixed(1))
        : 0;

    /* ================= PAYROLL ================= */
    const payrollAgg = await Employee.aggregate([
        { $match: { status: "Active", ...filter } },
        {
          $group: {
            _id: null,
            totalPayroll: {
              $sum: {
                $cond: [
                  { $ifNull: ["$salary.basic", false] },
                  "$salary.basic",
                  0
                ]
              },
            },
          },
        },
      ]);

    const totalPayroll = payrollAgg[0]?.totalPayroll || 0;

    res.json({
      success: true,
      data: {
        headcount,
        activeEmployees: headcount,
        attritionRate,
        avgAttendance,
        totalPayroll,
        openPositions: 5, // Replace later with real recruitment data
      },
    });
  } catch (error) {
    console.error("getSummary error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================================================
   WORKFORCE TREND
========================================================= */
export const getWorkforceData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, department, role } = req.query;

    const filter: any = {};

    if (department && department !== "all") {
      filter.department = department;
    }

    if (role && role !== "all") {
      filter.designation = role;
    }

    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 12));

    const end = endDate ? new Date(endDate as string) : new Date();

    const employees = await Employee.find({
      ...filter,
      joiningDate: { $lte: end },
    }).lean();

    const monthlyData: any[] = [];
    const current = new Date(start);

    while (current <= end) {
      const monthEnd = new Date(current);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const count = employees.filter((emp: any) => {
        return (
          emp.joiningDate &&
          new Date(emp.joiningDate) <= monthEnd
        );
      }).length;

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
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   ATTENDANCE TREND
========================================================= */
export const getAttendanceData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const attendance = await Attendance.aggregate([
      {
        $group: {
          _id: {
            year: { $substr: ["$date", 0, 4] },
            month: { $substr: ["$date", 5, 2] },
          },
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
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
      "Jan","Feb","Mar","Apr","May","Jun",
      "Jul","Aug","Sep","Oct","Nov","Dec",
    ];

    const formatted = attendance.map((item: any) => {
      const monthIndex = parseInt(item._id.month) - 1;

      return {
        month: `${monthNames[monthIndex]} ${item._id.year}`,
        attendance:
          item.totalDays > 0
            ? Number(
                ((item.presentDays / item.totalDays) * 100).toFixed(1)
              )
            : 0,
      };
    });

    res.json({ success: true, data: formatted });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/* =========================================================
   DEPARTMENT DISTRIBUTION
========================================================= */
export const getDepartmentData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await Employee.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: "$department",
          employees: { $sum: 1 },
        },
      },
      { $sort: { employees: -1 } },
    ]);

    const formatted = data.map((d) => ({
      department: d._id,
      employees: d.employees,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("getDepartmentData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   LEAVE BREAKDOWN
========================================================= */
export const getLeaveData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data = await Leave.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: "$leaveType",
          value: { $sum: 1 },
        },
      },
    ]);

    const formatted = data.map((d) => ({
      name: d._id,
      value: d.value,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("getLeaveData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   EMPLOYEE PERFORMANCE TABLE
========================================================= */
export const getEmployeePerformance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      role,
      department,
      search,
      page = 1,
      limit = 10,
    } = req.query as any;

    const filter: any = {};

    // Use existing model fields
    if (department && department !== "all") {
      filter.department = department;
    }

    if (role && role !== "all") {
      filter.designation = role; // 🔥 FIXED
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const employees = await Employee.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Employee.countDocuments(filter);

    const formatted = employees.map((emp: any) => ({
      ...emp,
      attendance: 85,
      leaves: 2,
      lateMarks: 1,
      compliance: 90,
      performanceScore: 75,
      grade: "B",
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("getEmployeePerformance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};