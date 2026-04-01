// import { Request, Response } from "express";
// import Employee from "../models/Employee.model";
// import Attendance from "../models/Attendance.model";
// import Leave from "../models/leave.model";

// /* =========================================================
//    SUMMARY (KPI SECTION)
// ========================================================= */
// export const getSummary = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { startDate, endDate, department, role } = req.query as any;

//     const filter: any = {};

//     if (department && department !== "all") {
//       filter.department = department;
//     }

//     if (role && role !== "all") {
//       filter.designation = role;
//     }

//     /* ================= HEADCOUNT ================= */

//     const headcount = await Employee.countDocuments({
//       status: "Active",
//       ...filter,
//     });

//     const totalEmployees = await Employee.countDocuments(filter);

//     const inactiveEmployees = await Employee.countDocuments({
//       status: "Inactive",
//       ...filter,
//     });

//     const attritionRate =
//       totalEmployees > 0
//         ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
//         : 0;

//     /* ================= PAYROLL ================= */

//     const payrollAgg = await Employee.aggregate([
//       { $match: { status: "Active", ...filter } },
//       {
//         $group: {
//           _id: null,
//           totalPayroll: {
//             $sum: { $ifNull: ["$salary.basic", 0] },
//           },
//         },
//       },
//     ]);

//     const totalPayroll = payrollAgg[0]?.totalPayroll || 0;

//     /* ================= WORKING HOURS ================= */

//     const employees = await Employee.find(filter)
//       .select("userId")
//       .lean();

//     const userIds = employees.map((e: any) => e.userId).filter(Boolean);

//     const attendanceMatch: any = {
//       userId: { $in: userIds },
//     };

//     if (startDate && endDate) {
//       attendanceMatch.date = {
//         $gte: startDate,
//         $lte: endDate,
//       };
//     }

//     const attendanceAgg = await Attendance.aggregate([
//       { $match: attendanceMatch },
//       {
//         $group: {
//           _id: null,
//           totalWorkingHours: { $sum: { $ifNull: ["$totalHours", 0] } },
//           totalDays: { $sum: 1 },
//         },
//       },
//     ]);

//     const totalWorkingHours =
//       attendanceAgg[0]?.totalWorkingHours
//         ? Number(attendanceAgg[0].totalWorkingHours.toFixed(1))
//         : 0;

//     const avgWorkingHours =
//       attendanceAgg[0]?.totalDays > 0
//         ? Number(
//             (totalWorkingHours / attendanceAgg[0].totalDays).toFixed(1)
//           )
//         : 0;

//     res.json({
//       success: true,
//       data: {
//         headcount,
//         activeEmployees: headcount,
//         attritionRate,
//         totalPayroll,
//         totalWorkingHours,
//         avgWorkingHours,
//         openPositions: 5,
//       },
//     });

//   } catch (error) {
//     console.error("getSummary error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// /* =========================================================
//    WORKFORCE TREND
// ========================================================= */
// export const getWorkforceData = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { startDate, endDate, department, role } = req.query as any;

//     const filter: any = {};

//     if (department && department !== "all") {
//       filter.department = department;
//     }

//     if (role && role !== "all") {
//       filter.designation = role;
//     }

//     const start = startDate
//       ? new Date(startDate)
//       : new Date(new Date().setMonth(new Date().getMonth() - 12));

//     const end = endDate ? new Date(endDate) : new Date();

//     const employees = await Employee.find({
//       ...filter,
//       joiningDate: { $lte: end },
//     }).lean();

//     const monthlyData: any[] = [];
//     const current = new Date(start);

//     while (current <= end) {
//       const monthEnd = new Date(current);
//       monthEnd.setMonth(monthEnd.getMonth() + 1);
//       monthEnd.setDate(0);

//       const count = employees.filter((emp: any) => {
//         return (
//           emp.joiningDate &&
//           new Date(emp.joiningDate) <= monthEnd
//         );
//       }).length;

//       monthlyData.push({
//         month: current.toLocaleString("default", {
//           month: "short",
//           year: "numeric",
//         }),
//         headcount: count,
//       });

//       current.setMonth(current.getMonth() + 1);
//     }

//     res.json({ success: true, data: monthlyData });

//   } catch (error) {
//     console.error("getWorkforceData error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /* =========================================================
//    ATTENDANCE TREND
// ========================================================= */
// export const getAttendanceData = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { startDate, endDate, department, role } = req.query as any;

//     const filter: any = {};

//     if (department && department !== "all") {
//       filter.department = department;
//     }

//     if (role && role !== "all") {
//       filter.designation = role;
//     }

//     const employees = await Employee.find(filter)
//       .select("userId")
//       .lean();

//     const userIds = employees.map((e: any) => e.userId).filter(Boolean);

//     const match: any = {
//       userId: { $in: userIds },
//     };

//     if (startDate && endDate) {
//       match.date = {
//         $gte: startDate,
//         $lte: endDate,
//       };
//     }

//     const attendance = await Attendance.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: {
//             year: { $substr: ["$date", 0, 4] },
//             month: { $substr: ["$date", 5, 2] },
//           },
//           totalDays: { $sum: 1 },
//           presentDays: {
//             $sum: {
//               $cond: [
//                 { $in: ["$status", ["Present", "Late", "Half Day"]] },
//                 1,
//                 0,
//               ],
//             },
//           },
//         },
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1 } },
//     ]);

//     const monthNames = [
//       "Jan","Feb","Mar","Apr","May","Jun",
//       "Jul","Aug","Sep","Oct","Nov","Dec",
//     ];

//     const formatted = attendance.map((item: any) => ({
//       month: `${monthNames[parseInt(item._id.month) - 1]} ${item._id.year}`,
//       attendance:
//         item.totalDays > 0
//           ? Number(((item.presentDays / item.totalDays) * 100).toFixed(1))
//           : 0,
//     }));

//     res.json({ success: true, data: formatted });

//   } catch (error) {
//     console.error("getAttendanceData error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /* =========================================================
//    DEPARTMENT DISTRIBUTION
// ========================================================= */
// export const getDepartmentData = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = await Employee.aggregate([
//       { $match: { status: "Active" } },
//       {
//         $group: {
//           _id: "$department",
//           employees: { $sum: 1 },
//         },
//       },
//       { $sort: { employees: -1 } },
//     ]);

//     const formatted = data.map((d) => ({
//       department: d._id,
//       employees: d.employees,
//     }));

//     res.json({ success: true, data: formatted });

//   } catch (error) {
//     console.error("getDepartmentData error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /* =========================================================
//    LEAVE BREAKDOWN
// ========================================================= */
// export const getLeaveData = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const data = await Leave.aggregate([
//       { $match: { status: "Approved" } },
//       {
//         $group: {
//           _id: "$leaveType",
//           value: { $sum: 1 },
//         },
//       },
//     ]);

//     const formatted = data.map((d) => ({
//       name: d._id,
//       value: d.value,
//     }));

//     res.json({ success: true, data: formatted });

//   } catch (error) {
//     console.error("getLeaveData error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

// /* =========================================================
//    EMPLOYEE PERFORMANCE TABLE
// ========================================================= */
// export const getEmployeePerformance = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const {
//       role,
//       department,
//       search,
//       page = 1,
//       limit = 10,
//     } = req.query as any;

//     const filter: any = {};

//     if (department && department !== "all") {
//       filter.department = department;
//     }

//     if (role && role !== "all") {
//       filter.designation = role;
//     }

//     if (search) {
//       filter.$or = [
//         { firstName: { $regex: search, $options: "i" } },
//         { lastName: { $regex: search, $options: "i" } },
//       ];
//     }

//     const skip = (Number(page) - 1) * Number(limit);

//     const employees = await Employee.find(filter)
//       .skip(skip)
//       .limit(Number(limit))
//       .lean();

//     const total = await Employee.countDocuments(filter);

//     const formatted = employees.map((emp: any) => ({
//       ...emp,
//       attendance: 85,
//       leaves: 2,
//       lateMarks: 1,
//       compliance: 90,
//       performanceScore: 75,
//       grade: "B",
//     }));

//     res.json({
//       success: true,
//       data: formatted,
//       pagination: {
//         total,
//         page: Number(page),
//         pages: Math.ceil(total / Number(limit)),
//       },
//     });

//   } catch (error) {
//     console.error("getEmployeePerformance error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// export const getDepartmentWorkingHours = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const { startDate, endDate, department, role } = req.query as any;

//     const filter: any = {};

//     if (department && department !== "all") {
//       filter.department = department;
//     }

//     if (role && role !== "all") {
//       filter.designation = role;
//     }

//     // Step 1: Get employees
//     const employees = await Employee.find(filter)
//       .select("userId department")
//       .lean();

//     const userIds = employees.map((e: any) => e.userId).filter(Boolean);

//     const attendanceMatch: any = {
//       userId: { $in: userIds },
//     };

//     if (startDate && endDate) {
//       attendanceMatch.date = {
//         $gte: startDate,
//         $lte: endDate,
//       };
//     }

//     // Step 2: Aggregate by department
//     const result = await Attendance.aggregate([
//       { $match: attendanceMatch },
//       {
//         $lookup: {
//           from: "employees",
//           localField: "userId",
//           foreignField: "userId",
//           as: "employee",
//         },
//       },
//       { $unwind: "$employee" },
//       {
//         $group: {
//           _id: "$employee.department",
//           totalHours: { $sum: { $ifNull: ["$totalHours", 0] } },
//           totalRecords: { $sum: 1 },
//         },
//       },
//       {
//         $project: {
//           department: "$_id",
//           totalHours: { $round: ["$totalHours", 1] },
//           avgHoursPerDay: {
//             $round: [
//               { $divide: ["$totalHours", "$totalRecords"] },
//               1,
//             ],
//           },
//         },
//       },
//     ]);

//     res.json({
//       success: true,
//       data: result,
//     });

//   } catch (error) {
//     console.error("getDepartmentWorkingHours error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

import { Request, Response } from "express";
import Employee from "../models/Employee.model";
import Attendance from "../models/Attendance.model";
import Leave from "../models/leave.model";

/* =========================================================
   HELPER: Build Employee Filter
========================================================= */
const buildEmployeeFilter = (query: any) => {
  const { department, role } = query;
  const filter: any = {};

  if (department && department !== "all") {
    filter.department = department;
  }

  if (role && role !== "all") {
    filter.designation = role;
  }

  return filter;
};

/* =========================================================
   HELPER: Get Filtered Employees
========================================================= */
const getFilteredEmployees = async (query: any) => {
  const filter = buildEmployeeFilter(query);

  const employees = await Employee.find(filter)
    .select("userId department status salary.basic joiningDate firstName lastName designation")
    .lean();

  const userIds = employees.map((e: any) => e.userId).filter(Boolean);

  return { employees, userIds, filter };
};

/* =========================================================
   1️⃣ SUMMARY (KPI)
========================================================= */
export const getSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { employees, userIds } = await getFilteredEmployees(req.query);

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === "Active").length;
    const inactiveEmployees = employees.filter(e => e.status === "Inactive").length;

    const attritionRate =
      totalEmployees > 0
        ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
        : 0;

    const totalPayroll = employees
      .filter(e => e.status === "Active")
      .reduce((sum, e) => sum + (e.salary?.basic || 0), 0);

    const match: any = { userId: { $in: userIds } };

    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
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

    const totalHours = attendanceAgg[0]?.totalHours || 0;
    const totalDays = attendanceAgg[0]?.totalDays || 0;
    const presentDays = attendanceAgg[0]?.presentDays || 0;

    const avgWorkingHours =
      totalDays > 0 ? Number((totalHours / totalDays).toFixed(1)) : 0;

    const avgAttendance =
      totalDays > 0
        ? Number(((presentDays / totalDays) * 100).toFixed(1))
        : 0;

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
        openPositions: 5,
      },
    });

  } catch (error) {
    console.error("getSummary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   2️⃣ WORKFORCE TREND
========================================================= */
export const getWorkforceData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { employees } = await getFilteredEmployees(req.query);

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
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   3️⃣ ATTENDANCE TREND
========================================================= */
export const getAttendanceData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { userIds } = await getFilteredEmployees(req.query);

    const match: any = { userId: { $in: userIds } };

    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
    }

    const attendance = await Attendance.aggregate([
      { $match: match },
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

    const formatted = attendance.map((item: any) => ({
      month: `${monthNames[parseInt(item._id.month) - 1]} ${item._id.year}`,
      attendance:
        item.totalDays > 0
          ? Number(((item.presentDays / item.totalDays) * 100).toFixed(1))
          : 0,
    }));

    res.json({ success: true, data: formatted });

  } catch (error) {
    console.error("getAttendanceData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   4️⃣ DEPARTMENT DISTRIBUTION
========================================================= */
export const getDepartmentData = async (req: Request, res: Response) => {
  try {
    const { employees } = await getFilteredEmployees(req.query);

    const grouped: any = {};

    employees
      .filter(e => e.status === "Active")
      .forEach((emp: any) => {
        if (!grouped[emp.department]) grouped[emp.department] = 0;
        grouped[emp.department]++;
      });

    const result = Object.keys(grouped).map(dep => ({
      department: dep,
      employees: grouped[dep],
    }));

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("getDepartmentData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   5️⃣ LEAVE BREAKDOWN
========================================================= */
export const getLeaveData = async (req: Request, res: Response) => {
  try {
    const { userIds } = await getFilteredEmployees(req.query);

    const data = await Leave.aggregate([
      { $match: { status: "Approved", userId: { $in: userIds } } },
      {
        $group: {
          _id: "$leaveType",
          value: { $sum: 1 },
        },
      },
    ]);

    const formatted = data.map((d: any) => ({
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
   6️⃣ EMPLOYEE PERFORMANCE
========================================================= */
export const getEmployeePerformance = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 10 } = req.query as any;
    const { employees } = await getFilteredEmployees(req.query);

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

    const formatted = paginated.map((emp: any) => ({
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
        total: filtered.length,
        page: Number(page),
        pages: Math.ceil(filtered.length / Number(limit)),
      },
    });

  } catch (error) {
    console.error("getEmployeePerformance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   7️⃣ DEPARTMENT WORKING HOURS
========================================================= */
export const getDepartmentWorkingHours = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { userIds } = await getFilteredEmployees(req.query);

    const match: any = { userId: { $in: userIds } };

    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
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
            $round: [
              { $divide: ["$totalHours", "$totalRecords"] },
              1,
            ],
          },
        },
      },
    ]);

    res.json({ success: true, data: result });

  } catch (error) {
    console.error("getDepartmentWorkingHours error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   8️⃣ EXPORT DATA (CSV / PDF)
========================================================= */
export const getExportData = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as any;
    const { employees, userIds } = await getFilteredEmployees(req.query);

    const match: any = { userId: { $in: userIds } };

    if (startDate && endDate) {
      match.date = { $gte: startDate, $lte: endDate };
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

    res.json({ success: true, data: exportData });

  } catch (error) {
    console.error("getExportData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};