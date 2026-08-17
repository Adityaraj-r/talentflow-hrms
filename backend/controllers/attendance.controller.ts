import { Request, Response } from "express";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.model";
import CorrectionRequest from "../models/CorrectionRequest.model";
import User from "../models/User.model";
import { notifyOvertimeApproved, notifyCorrectionRequestApproved, notifyCorrectionRequestRejected } from "../services/notification.service";

const OFFICE_LAT = 19.8767;
const OFFICE_LON = 75.3243;
const MAX_RADIUS_KM = 2000;

const getTodayString = () => {
  return new Date().toISOString().split("T")[0];
};

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const recalculateHours = (
  clockIn: Date,
  clockOut: Date,
  totalBreakMinutes: number
) => {
  const grossMinutes = Math.round(
    (clockOut.getTime() - clockIn.getTime()) / 60000
  );
  const netMinutes = Math.max(0, grossMinutes - totalBreakMinutes);
  const totalHours = Number((netMinutes / 60).toFixed(2));
  return { totalHours };
};

const calculateOvertimeHours = (
  clockOut: Date,
  date: string,
  shiftEndTime: string | null
): number => {
  if (!shiftEndTime) return 0;

  const [endHour, endMin] = shiftEndTime.split(":").map(Number);
  const shiftEnd = new Date(`${date}T00:00:00`);
  shiftEnd.setHours(endHour, endMin, 0, 0);

  if (clockOut <= shiftEnd) return 0;

  const otMinutes = Math.round(
    (clockOut.getTime() - shiftEnd.getTime()) / 60000
  );
  return Number((otMinutes / 60).toFixed(2));
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });

    const records = await Attendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });

    const { latitude, longitude } = req.body;

    if (latitude && longitude) {
      const distance = getDistanceKm(
        latitude,
        longitude,
        OFFICE_LAT,
        OFFICE_LON
      );
      if (distance > MAX_RADIUS_KM) {
        return res.status(400).json({
          success: false,
          message: `Outside geofence radius. Distance: ${distance.toFixed(2)}km`,
        });
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "GPS coordinates required" });
    }

    const todayDateString = getTodayString();
    const now = new Date();

    const existingRecord = await Attendance.findOne({
      userId,
      date: todayDateString,
    });

    if (existingRecord?.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Attendance is locked for payroll",
      });
    }

    if (existingRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Already clocked in today" });
    }

    const user = await User.findById(userId).populate("currentShift");
    let status: "Present" | "Late" = "Present";

    if (user && user.currentShift) {
      const shift: any = user.currentShift;
      if (shift.startTime && typeof shift.startTime === "string") {
        const parts = shift.startTime.split(":");
        if (parts.length === 2) {
          const expectedTime = new Date();
          const grace = shift.graceMinutes || 0;
          expectedTime.setHours(
            Number(parts[0]),
            Number(parts[1]) + grace,
            0,
            0
          );
          if (now > expectedTime) {
            status = "Late";
          }
        }
      }
    }

    const newAttendance = await Attendance.create({
      userId,
      date: todayDateString,
      clockIn: now,
      location: { latitude, longitude, address: "Captured via GPS" },
      status,
      state: "CHECKED_IN",
      breaks: [],
      totalBreakMinutes: 0,
      isLocked: false,
      isOtApproved: false,
      overtimeHours: 0,
    });

    res.json({ success: true, data: newAttendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startBreak = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({
      userId,
      date: todayDateString,
    });

    if (!attendance || attendance.state !== "CHECKED_IN") {
      return res
        .status(400)
        .json({ success: false, message: "Must be clocked in" });
    }

    if (attendance.isLocked) {
      return res
        .status(403)
        .json({ success: false, message: "Attendance is locked" });
    }

    attendance.state = "ON_BREAK";
    attendance.breaks.push({ startTime: new Date() });
    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const endBreak = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({
      userId,
      date: todayDateString,
    });

    if (!attendance || attendance.state !== "ON_BREAK") {
      return res
        .status(400)
        .json({ success: false, message: "Not on a break" });
    }

    if (attendance.isLocked) {
      return res
        .status(403)
        .json({ success: false, message: "Attendance is locked" });
    }

    const now = new Date();
    const activeBreak = attendance.breaks[attendance.breaks.length - 1];

    activeBreak.endTime = now;
    const breakMinutes = Math.round(
      (now.getTime() - activeBreak.startTime.getTime()) / 60000
    );
    activeBreak.totalMinutes = breakMinutes;

    attendance.totalBreakMinutes += breakMinutes;
    attendance.state = "CHECKED_IN";
    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({
      userId,
      date: todayDateString,
      state: { $in: ["CHECKED_IN", "ON_BREAK"] },
    });

    if (!attendance) {
      return res
        .status(400)
        .json({ success: false, message: "No active session" });
    }

    if (attendance.isLocked) {
      return res
        .status(403)
        .json({ success: false, message: "Attendance is locked" });
    }

    const now = new Date();

    if (attendance.state === "ON_BREAK") {
      const activeBreak = attendance.breaks[attendance.breaks.length - 1];
      activeBreak.endTime = now;
      const breakMinutes = Math.round(
        (now.getTime() - activeBreak.startTime.getTime()) / 60000
      );
      activeBreak.totalMinutes = breakMinutes;
      attendance.totalBreakMinutes += breakMinutes;
    }

    attendance.clockOut = now;
    attendance.state = "CHECKED_OUT";

    if (attendance.clockIn) {
      const { totalHours } = recalculateHours(
        attendance.clockIn,
        now,
        attendance.totalBreakMinutes
      );
      attendance.totalHours = totalHours;
    }

    const user = await User.findById(userId).populate("currentShift");
    const shiftEndTime =
      user?.currentShift ? (user.currentShift as any).endTime : null;

    const otHours = calculateOvertimeHours(
      now,
      todayDateString,
      shiftEndTime
    );

    attendance.overtimeHours = otHours;
    attendance.isOtApproved = otHours > 0 ? false : attendance.isOtApproved;

    await attendance.save();

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runAutoCheckout = async (req: Request, res: Response) => {
  try {
    const todayDateString = getTodayString();

    const openRecords = await Attendance.find({
      date: { $ne: todayDateString },
      state: { $in: ["CHECKED_IN", "ON_BREAK"] },
      isLocked: false,
    }).populate({
      path: "userId",
      populate: { path: "currentShift" },
    });

    let closedCount = 0;

    for (const record of openRecords) {
      const autoOutTime = new Date(record.date);
      autoOutTime.setHours(23, 59, 59);

      record.clockOut = autoOutTime;
      record.state = "AUTO_CLOSED";

      if (record.clockIn) {
        const { totalHours } = recalculateHours(
          record.clockIn,
          autoOutTime,
          record.totalBreakMinutes
        );
        record.totalHours = totalHours;
      }

      const user = record.userId as any;
      const shiftEndTime = user?.currentShift?.endTime || null;
      const otHours = calculateOvertimeHours(
        autoOutTime,
        record.date,
        shiftEndTime
      );
      record.overtimeHours = otHours;
      record.isOtApproved = false;

      await record.save();
      closedCount++;
    }

    res.json({
      success: true,
      message: `Auto-closed ${closedCount} abandoned shifts.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { date, userId } = req.query;
    const query: any = {};

    if (date) query.date = date;
    if (userId) query.userId = userId;

    const records = await Attendance.find(query)
      .populate("userId", "firstName lastName email employeeCode department")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markManualAttendance = async (req: Request, res: Response) => {
  try {
    const {
      employeeEmail,
      date,
      clockIn,
      clockOut,
      breakMinutes,
      status,
      notes,
    } = req.body;

    if (!employeeEmail || !date || !status) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = await User.findOne({ email: employeeEmail }).populate(
      "currentShift"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const existingRecord = await Attendance.findOne({
      userId: user._id,
      date,
    });
    if (existingRecord?.isLocked) {
      return res
        .status(403)
        .json({ success: false, message: "Record is locked" });
    }

    let checkInDate = null;
    let checkOutDate = null;
    let totalHours = 0;
    let otHours = 0;

    if (clockIn) checkInDate = new Date(`${date}T${clockIn}`);
    if (clockOut) checkOutDate = new Date(`${date}T${clockOut}`);

    if (checkInDate && checkOutDate) {
      const result = recalculateHours(
        checkInDate,
        checkOutDate,
        Number(breakMinutes || 0)
      );
      totalHours = result.totalHours;

      const shiftEndTime = user.currentShift
        ? (user.currentShift as any).endTime
        : null;
      otHours = calculateOvertimeHours(checkOutDate, date, shiftEndTime);
    }

    const attendanceData = {
      userId: user._id,
      date,
      clockIn: checkInDate,
      clockOut: checkOutDate,
      totalBreakMinutes: Number(breakMinutes || 0),
      totalHours,
      overtimeHours: otHours,
      isOtApproved: false,
      status,
      state: checkOutDate
        ? "CHECKED_OUT"
        : checkInDate
        ? "CHECKED_IN"
        : "NOT_STARTED",
      notes: notes || "Manual entry",
    };

    const record = await Attendance.findOneAndUpdate(
      { userId: user._id, date },
      { $set: attendanceData },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No CSV file uploaded" });
    }

    const csvData = req.file.buffer.toString("utf-8");
    const lines = csvData.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "CSV file is empty" });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const checkInIdx = headers.findIndex(
      (h) =>
        h.includes("checkin") ||
        h.includes("clockin") ||
        h.includes("clock in")
    );
    const checkOutIdx = headers.findIndex(
      (h) =>
        h.includes("checkout") ||
        h.includes("clockout") ||
        h.includes("clock out")
    );
    const breakIdx = headers.findIndex((h) => h.includes("break"));
    const statusIdx = headers.findIndex((h) => h.includes("status"));

    let processedCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const email = cols[emailIdx];
      const date = cols[dateIdx];
      const clockIn = checkInIdx !== -1 ? cols[checkInIdx] : null;
      const clockOut = checkOutIdx !== -1 ? cols[checkOutIdx] : null;
      const breakMinutes =
        breakIdx !== -1 ? Number(cols[breakIdx]) || 0 : 0;
      const status = cols[statusIdx];

      if (!email || !date || !status) {
        errorCount++;
        continue;
      }

      const user = await User.findOne({ email }).populate("currentShift");
      if (!user) {
        errorCount++;
        continue;
      }

      const existingRecord = await Attendance.findOne({
        userId: user._id,
        date,
      });
      if (existingRecord?.isLocked) {
        errorCount++;
        continue;
      }

      let checkInDate = null;
      let checkOutDate = null;
      let totalHours = 0;
      let otHours = 0;

      if (clockIn && clockIn !== "-")
        checkInDate = new Date(`${date}T${clockIn}`);
      if (clockOut && clockOut !== "-")
        checkOutDate = new Date(`${date}T${clockOut}`);

      if (checkInDate && checkOutDate) {
        const result = recalculateHours(
          checkInDate,
          checkOutDate,
          breakMinutes
        );
        totalHours = result.totalHours;

        const shiftEndTime = user.currentShift
          ? (user.currentShift as any).endTime
          : null;
        otHours = calculateOvertimeHours(checkOutDate, date, shiftEndTime);
      }

      await Attendance.findOneAndUpdate(
        { userId: user._id, date },
        {
          $set: {
            clockIn: checkInDate,
            clockOut: checkOutDate,
            totalBreakMinutes: breakMinutes,
            totalHours,
            overtimeHours: otHours,
            isOtApproved: false,
            status,
            state: checkOutDate
              ? "CHECKED_OUT"
              : checkInDate
              ? "CHECKED_IN"
              : "NOT_STARTED",
            notes: "Bulk Upload",
          },
        },
        { new: true, upsert: true }
      );
      processedCount++;
    }

    res.json({
      success: true,
      message: `Inserted/Updated: ${processedCount}, Skipped: ${errorCount}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await Attendance.findById(id);

    if (!record)
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    if (record.isLocked)
      return res
        .status(403)
        .json({ success: false, message: "Record is locked" });

    record.approvedBy = new mongoose.Types.ObjectId(req.user?.id);
    await record.save();

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const lockAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ success: false, message: "Dates required" });

    await Attendance.updateMany(
      { date: { $gte: startDate, $lte: endDate } },
      { $set: { isLocked: true } }
    );

    res.json({ success: true, message: "Attendance locked for period" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unlockAttendance = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate)
      return res
        .status(400)
        .json({ success: false, message: "Dates required" });

    await Attendance.updateMany(
      { date: { $gte: startDate, $lte: endDate } },
      { $set: { isLocked: false } }
    );

    res.json({ success: true, message: "Attendance unlocked for period" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkLockStatus = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as {
      startDate: string;
      endDate: string;
    };

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const totalRecords = await Attendance.countDocuments({
      date: { $gte: startDate, $lte: endDate },
    });

    const lockedRecords = await Attendance.countDocuments({
      date: { $gte: startDate, $lte: endDate },
      isLocked: true,
    });

    const isLocked = totalRecords > 0 && lockedRecords === totalRecords;

    res.json({
      success: true,
      data: { isLocked, totalRecords, lockedRecords, startDate, endDate },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const correctAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, status, notes, breakMinutes } = req.body;

    const record = await Attendance.findById(id).populate({
      path: "userId",
      populate: { path: "currentShift" },
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    if (record.isLocked) {
      return res.status(403).json({
        success: false,
        message:
          "This record is locked for payroll. Contact Admin to unlock.",
      });
    }

    if (clockIn) record.clockIn = new Date(clockIn);
    if (clockOut) record.clockOut = new Date(clockOut);
    if (status) record.status = status;
    if (notes) record.notes = notes;
    if (breakMinutes !== undefined)
      record.totalBreakMinutes = Number(breakMinutes);

    if (record.clockIn && record.clockOut) {
      const { totalHours } = recalculateHours(
        record.clockIn,
        record.clockOut,
        record.totalBreakMinutes
      );
      record.totalHours = totalHours;
      record.state = "CHECKED_OUT";

      const user = record.userId as any;
      const shiftEndTime = user?.currentShift?.endTime || null;
      const otHours = calculateOvertimeHours(
        record.clockOut,
        record.date,
        shiftEndTime
      );
      record.overtimeHours = otHours;
      record.isOtApproved = otHours > 0 ? false : record.isOtApproved;
    }

    await record.save();

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCorrectionRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const { attendanceId, requestedClockIn, requestedClockOut, reason } =
      req.body;

    if (!attendanceId || !reason) {
      return res.status(400).json({
        success: false,
        message: "attendanceId and reason are required",
      });
    }

    const attendanceRecord = await Attendance.findById(attendanceId);
    if (!attendanceRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    if (attendanceRecord.isLocked) {
      return res.status(403).json({
        success: false,
        message:
          "This record is locked for payroll and cannot be corrected.",
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const requestsThisMonth = await CorrectionRequest.countDocuments({
      requestedBy: userId,
      month: currentMonth,
      year: currentYear,
    });

    if (requestsThisMonth >= 3) {
      return res.status(429).json({
        success: false,
        message:
          "You have reached the maximum of 3 correction requests for this month.",
      });
    }

    const correctionRequest = await CorrectionRequest.create({
      attendanceId,
      requestedBy: userId,
      requestedClockIn: requestedClockIn
        ? new Date(requestedClockIn)
        : undefined,
      requestedClockOut: requestedClockOut
        ? new Date(requestedClockOut)
        : undefined,
      reason,
      month: currentMonth,
      year: currentYear,
    });

    res.status(201).json({ success: true, data: correctionRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCorrectionRequests = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role?.toUpperCase().replace(/[\s_]/g, "");
    const userId = req.user?.id;
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    let requests;

    if (
      ["HRMANAGER", "ADMIN", "SUPERADMIN", "HROFFICER", "CEO", "EXECUTIVE", "FINANCEMANAGER", "COUNTRYMANAGER"].includes(
        userRole || ""
      )
    ) {
      requests = await CorrectionRequest.find(filter)
        .populate("requestedBy", "firstName lastName email department employeeCode")
        .populate("attendanceId")
        .populate("reviewedBy", "firstName lastName")
        .sort({ createdAt: -1 });
    } else if (
      ["DEPARTMENTMANAGER", "DIRECTMANAGER", "PROJECTMANAGER", "TEAMLEAD"].includes(userRole || "")
    ) {
      const currentUser = await User.findById(userId);
      const teamMembers = await User.find({
        department: currentUser?.department,
        isActive: true,
        isDeleted: false,
      }).select("_id");

      const teamIds = teamMembers.map((m) => m._id);
      filter.requestedBy = { $in: teamIds };

      requests = await CorrectionRequest.find(filter)
        .populate("requestedBy", "firstName lastName email department employeeCode")
        .populate("attendanceId")
        .populate("reviewedBy", "firstName lastName")
        .sort({ createdAt: -1 });
    } else {
      filter.requestedBy = userId;
      requests = await CorrectionRequest.find(filter)
        .populate("requestedBy", "firstName lastName email department employeeCode")
        .populate("attendanceId")
        .populate("reviewedBy", "firstName lastName")
        .sort({ createdAt: -1 });
    }

    res.json({ success: true, count: requests.length, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewCorrectionRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;
    const reviewerId = req.user?.id;

    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "action must be either Approved or Rejected",
      });
    }

    if (action === "Rejected" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "rejectionReason is required when rejecting",
      });
    }

    const correctionRequest = await CorrectionRequest.findById(id);
    if (!correctionRequest) {
      return res
        .status(404)
        .json({ success: false, message: "Correction request not found" });
    }

    if (correctionRequest.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been reviewed",
      });
    }

    correctionRequest.status = action;
    correctionRequest.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
    if (action === "Rejected") {
      correctionRequest.rejectionReason = rejectionReason;
    }

    await correctionRequest.save();
    if (action === "Approved") {
      await notifyCorrectionRequestApproved(
        correctionRequest.requestedBy,
        correctionRequest._id.toString(),
        correctionRequest.attendanceId.toString()
      );
    } else {
      await notifyCorrectionRequestRejected(
        correctionRequest.requestedBy,
        correctionRequest._id.toString(),
        correctionRequest.attendanceId.toString(),
        rejectionReason
      );
    }
    if (action === "Approved") {
      const attendanceRecord = await Attendance.findById(
        correctionRequest.attendanceId
      ).populate({
        path: "userId",
        populate: { path: "currentShift" },
      });

      if (attendanceRecord && !attendanceRecord.isLocked) {
        if (correctionRequest.requestedClockIn) {
          attendanceRecord.clockIn = correctionRequest.requestedClockIn;
        }
        if (correctionRequest.requestedClockOut) {
          attendanceRecord.clockOut = correctionRequest.requestedClockOut;
        }

        if (attendanceRecord.clockIn && attendanceRecord.clockOut) {
          const { totalHours } = recalculateHours(
            attendanceRecord.clockIn,
            attendanceRecord.clockOut,
            attendanceRecord.totalBreakMinutes
          );
          attendanceRecord.totalHours = totalHours;
          attendanceRecord.state = "CHECKED_OUT";

          const user = attendanceRecord.userId as any;
          const shiftEndTime = user?.currentShift?.endTime || null;
          const otHours = calculateOvertimeHours(
            attendanceRecord.clockOut,
            attendanceRecord.date,
            shiftEndTime
          );
          attendanceRecord.overtimeHours = otHours;
          attendanceRecord.isOtApproved =
            otHours > 0 ? false : attendanceRecord.isOtApproved;
        }

        attendanceRecord.approvedBy = new mongoose.Types.ObjectId(reviewerId);
        await attendanceRecord.save();
      }
    }

    res.json({ success: true, data: correctionRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyCorrectionRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const requests = await CorrectionRequest.find({ requestedBy: userId })
      .populate("attendanceId")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const usedThisMonth = await CorrectionRequest.countDocuments({
      requestedBy: userId,
      month: currentMonth,
      year: currentYear,
    });

    res.json({
      success: true,
      data: requests,
      meta: {
        usedThisMonth,
        remainingThisMonth: Math.max(0, 3 - usedThisMonth),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOvertimePending = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role?.toUpperCase().replace(/[\s_]/g, "");
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    const filter: any = {
      overtimeHours: { $gt: 0 },
      isOtApproved: false,
      isLocked: false,
    };

    if (startDate) filter.date = { ...filter.date, $gte: startDate };
    if (endDate) filter.date = { ...filter.date, $lte: endDate };

    let records;

    if (
      ["HRMANAGER", "ADMIN", "SUPERADMIN"].includes(userRole || "")
    ) {
      records = await Attendance.find(filter)
        .populate("userId", "firstName lastName email department employeeCode")
        .populate("otApprovedBy", "firstName lastName")
        .sort({ date: -1 });
    } else if (
      ["DEPARTMENTMANAGER", "DIRECTMANAGER"].includes(userRole || "")
    ) {
      const currentUser = await User.findById(userId);
      const teamMembers = await User.find({
        department: currentUser?.department,
        isActive: true,
        isDeleted: false,
      }).select("_id");

      const teamIds = teamMembers.map((m) => m._id);
      filter.userId = { $in: teamIds };

      records = await Attendance.find(filter)
        .populate("userId", "firstName lastName email department employeeCode")
        .populate("otApprovedBy", "firstName lastName")
        .sort({ date: -1 });
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveOvertime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const managerId = req.user?.id;

    const record = await Attendance.findById(id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Attendance record not found" });
    }

    if (record.isLocked) {
      return res.status(403).json({
        success: false,
        message: "Record is locked for payroll. Cannot approve OT.",
      });
    }

    if (!record.overtimeHours || record.overtimeHours <= 0) {
      return res.status(400).json({
        success: false,
        message: "This record has no overtime hours to approve.",
      });
    }

    if (record.isOtApproved) {
      return res.status(400).json({
        success: false,
        message: "Overtime for this record has already been approved.",
      });
    }

    record.isOtApproved = true;
    record.otApprovedBy = new mongoose.Types.ObjectId(managerId);
    await record.save();
    await notifyOvertimeApproved(
      record.userId,
      record._id.toString(),
      record.date,
      record.overtimeHours
    );
    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};