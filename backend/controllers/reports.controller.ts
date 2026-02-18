import { Request, Response } from "express";
import Employee, { IEmployee } from "../models/Employee.model";
import Attendance from "../models/Attendance.model";
import Leave from "../models/leave.model";

/* =========================================================
   GET SUMMARY (KPI SECTION)
========================================================= */
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, department } = req.query;

    const deptFilter: any =
      department && department !== "all" ? { department } : {};

    // Headcount & Active
    const headcount = await Employee.countDocuments({
      status: "Active",
      ...deptFilter,
    });

    const activeEmployees = headcount;

    // Attrition
    const totalEmployees = await Employee.countDocuments(deptFilter);
    const inactiveEmployees = await Employee.countDocuments({
      status: "Inactive",
      ...deptFilter,
    });

    const attritionRate =
      totalEmployees > 0
        ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
        : 0;

    /* ---------- Attendance Default Range (Last 30 Days) ---------- */
    const start =
      startDate ||
      new Date(
        new Date().setDate(new Date().getDate() - 30)
      ).toISOString().split("T")[0];

    const end =
      endDate || new Date().toISOString().split("T")[0];

    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          date: { 
            $gte: start as string,
            $lte: end as string
          }
        },
      },
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

    // Payroll
    const employees = await Employee.find({
      status: "Active",
      ...deptFilter,
    });

    const payrollData = await Employee.aggregate([
  {
    $match: {
      status: "Active",
      ...(department && department !== "all" ? { department } : {}),
    },
  },
  {
    $group: {
      _id: null,
      totalPayroll: {
        $sum: { $ifNull: ["$salary.basic", 0] },
      },
    },
  },
]);

const totalPayroll = payrollData[0]?.totalPayroll || 0;


    res.json({
      success: true,
      data: {
        headcount,
        activeEmployees,
        attritionRate,
        avgAttendance,
        totalPayroll,
        openPositions: 5,
      },
    });
  } catch (error) {
    console.error("getSummary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   WORKFORCE ANALYTICS
========================================================= */
export const getWorkforceData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, department } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().setMonth(new Date().getMonth() - 12));

    const end = endDate ? new Date(endDate as string) : new Date();

    start.setDate(1);

    // Fetch only necessary field
    const employees = await Employee.find(
      {
        ...(department && department !== "all" ? { department } : {}),
        joiningDate: { $lte: end },
      },
      { joiningDate: 1 } // projection (important optimization)
    ).lean();

    const monthlyData: any[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const monthStart = new Date(currentDate);
      const monthEnd = new Date(currentDate);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      const headcount = employees.filter((emp) => {
        if (!emp.joiningDate) return false;
        return new Date(emp.joiningDate) <= monthEnd;
      }).length;

      monthlyData.push({
        month: monthStart.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        headcount,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error("getWorkforceData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* =========================================================
   ATTENDANCE ANALYTICS
========================================================= */
export const getAttendanceData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, department } = req.query;

    const pipeline: any[] = [
      // Convert string date to real Date first
      {
        $addFields: {
          parsedDate: {
            $dateFromString: {
              dateString: "$date",
              format: "%Y-%m-%d",
              onError: null,
              onNull: null,
            },
          },
        },
      },

      // Remove invalid dates
      {
        $match: {
          parsedDate: { $ne: null },
        },
      },
    ];

    /* ======================
       DATE RANGE FILTER
    ======================= */
    if (startDate && endDate) {
      pipeline.push({
        $match: {
          parsedDate: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        },
      });
    }

    /* ======================
       DEPARTMENT FILTER
    ======================= */
    if (department && department !== "all") {
      pipeline.push(
        {
          $lookup: {
            from: "employees",
            localField: "userId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },
        {
          $match: {
            "employee.department": department,
          },
        }
      );
    }

    /* ======================
       GROUP BY MONTH
    ======================= */
    pipeline.push(
      {
        $group: {
          _id: {
            year: { $year: "$parsedDate" },
            month: { $month: "$parsedDate" },
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
          lateMarks: {
            $sum: {
              $cond: [{ $eq: ["$status", "Late"] }, 1, 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  [
                    "Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec",
                  ],
                  { $subtract: ["$_id.month", 1] },
                ],
              },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          totalDays: 1,
          presentDays: 1,
          lateMarks: 1,
          attendance: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$presentDays", "$totalDays"] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      }
    );

    const attendanceData = await Attendance.aggregate(pipeline);

    /* ======================
       LEAVE DATA PER MONTH
    ======================= */
    const leaveData = await Leave.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" },
          },
          leavesTaken: { $sum: 1 },
        },
      },
    ]);

    /* ======================
       MERGE ATTENDANCE + LEAVE
    ======================= */
    const finalData = attendanceData.map((month) => {
      const [mon, yr] = month.month.split(" ");

      const monthIndex = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ].indexOf(mon) + 1;

      const leaveMatch = leaveData.find(
        (l) =>
          l._id.year === parseInt(yr) &&
          l._id.month === monthIndex
      );

      const leavesTaken = leaveMatch?.leavesTaken || 0;

      let compliance =
        month.attendance -
        month.lateMarks * 0.5 -
        leavesTaken * 0.3;

      compliance = Math.max(0, Math.min(100, compliance));

      return {
        ...month,
        leavesTaken,
        complianceScore: Number(compliance.toFixed(1)),
      };
    });

    res.json({
      success: true,
      data: finalData,
    });

  } catch (error: any) {
    console.error("🔥 getAttendanceData error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
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
    const totalActive = await Employee.countDocuments({
      status: "Active",
    });

    const deptData = await Employee.aggregate([
      { $match: { status: "Active" } },
      {
        $group: {
          _id: "$department",
          employees: { $sum: 1 },
          totalSalary: {
            $sum: { $ifNull: ["$salary.basic", 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          employees: 1,
          totalSalary: 1,
          avgSalary: {
            $cond: [
              { $eq: ["$employees", 0] },
              0,
              { $round: [{ $divide: ["$totalSalary", "$employees"] }, 0] },
            ],
          },
          percentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$employees", totalActive] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { employees: -1 } },
    ]);

    res.json({ success: true, data: deptData });
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
    const { startDate, endDate, department } = req.query;

    const pipeline: any[] = [];

    /* ------------------ LOOKUP USER ------------------ */
    pipeline.push(
      {
        $lookup: {
          from: "users", // ✅ correct collection
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }
    );

    /* ------------------ DEPARTMENT FILTER ------------------ */
    if (department && department !== "all") {
      pipeline.push({
        $match: { "user.department": department },
      });
    }

    /* ------------------ DATE RANGE FILTER ------------------ */
    if (startDate && endDate) {
      pipeline.push({
        $match: {
          startDate: { $lte: new Date(endDate as string) },
          endDate: { $gte: new Date(startDate as string) },
        },
      });
    }

    /* ------------------ GROUP BY LEAVE TYPE ------------------ */
    pipeline.push(
      {
        $group: {
          _id: "$leaveType",
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      }
    );

    const leaveData = await Leave.aggregate(pipeline);

    res.json({ success: true, data: leaveData });
  } catch (error) {
    console.error("getLeaveData error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

