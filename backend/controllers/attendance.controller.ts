import { Request, Response } from "express";
import Attendance from "../models/Attendance.model";

const OFFICE_START_HOUR = 9;
const OFFICE_START_MINUTE = 30;

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const records = await Attendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, data: records });
  } catch (error) {
    console.error("getMyAttendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clockIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const todayDateString = getTodayString();
    const now = new Date();

    const existingRecord = await Attendance.findOne({ userId, date: todayDateString });
    if (existingRecord) {
      return res.status(400).json({ success: false, message: "Already clocked in today" });
    }

    const officeStartTime = new Date();
    officeStartTime.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);
    const status = now > officeStartTime ? "Late" : "Present";

    const newAttendance = await Attendance.create({
      userId,
      date: todayDateString,
      checkIn: now,
      status: status,
      state: "CHECKED_IN",
      breaks: [],
      totalBreakMinutes: 0
    });

    res.json({ success: true, message: `Clock-in successful (${status})`, data: newAttendance });
  } catch (error) {
    console.error("clockIn error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const startBreak = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({ userId, date: todayDateString });

    if (!attendance || attendance.state !== "CHECKED_IN") {
      return res.status(400).json({ success: false, message: "Cannot start break. You must be clocked in." });
    }

    attendance.state = "ON_BREAK";
    attendance.breaks.push({ startTime: new Date() });
    await attendance.save();

    res.json({ success: true, message: "Break started", data: attendance });
  } catch (error) {
    console.error("startBreak error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const endBreak = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({ userId, date: todayDateString });

    if (!attendance || attendance.state !== "ON_BREAK") {
      return res.status(400).json({ success: false, message: "You are not currently on a break." });
    }

    const now = new Date();
    const activeBreak = attendance.breaks[attendance.breaks.length - 1];

    activeBreak.endTime = now;
    const breakMinutes = Math.round((now.getTime() - activeBreak.startTime.getTime()) / 60000);
    activeBreak.totalMinutes = breakMinutes;

    attendance.totalBreakMinutes += breakMinutes;
    attendance.state = "CHECKED_IN";
    await attendance.save();

    res.json({ success: true, message: "Break ended", data: attendance });
  } catch (error) {
    console.error("endBreak error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const todayDateString = getTodayString();

    const attendance = await Attendance.findOne({
      userId,
      date: todayDateString,
      state: { $in: ["CHECKED_IN", "ON_BREAK"] }
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: "No active session found to clock out." });
    }

    const now = new Date();

    if (attendance.state === "ON_BREAK") {
      const activeBreak = attendance.breaks[attendance.breaks.length - 1];
      activeBreak.endTime = now;
      const breakMinutes = Math.round((now.getTime() - activeBreak.startTime.getTime()) / 60000);
      activeBreak.totalMinutes = breakMinutes;
      attendance.totalBreakMinutes += breakMinutes;
    }

    attendance.checkOut = now;
    attendance.state = "CHECKED_OUT";

    if (attendance.checkIn) {
      const grossMinutes = Math.round((now.getTime() - attendance.checkIn.getTime()) / 60000);
      const netMinutes = grossMinutes - attendance.totalBreakMinutes;
      attendance.totalHours = Number((netMinutes / 60).toFixed(2));
    }

    await attendance.save();

    res.json({ success: true, message: "Clock-out successful", data: attendance });
  } catch (error) {
    console.error("clockOut error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const runAutoCheckout = async (req: Request, res: Response) => {
  try {
    const todayDateString = getTodayString();

    const openRecords = await Attendance.find({
      date: { $ne: todayDateString },
      state: { $in: ["CHECKED_IN", "ON_BREAK"] }
    });

    let closedCount = 0;

    for (const record of openRecords) {
      const autoOutTime = new Date(record.date);
      autoOutTime.setHours(23, 59, 59);

      record.checkOut = autoOutTime;
      record.state = "AUTO_CLOSED";

      if (record.checkIn) {
        const grossMinutes = Math.round((autoOutTime.getTime() - record.checkIn.getTime()) / 60000);
        const netMinutes = grossMinutes - record.totalBreakMinutes;
        record.totalHours = Number((netMinutes / 60).toFixed(2));
      }

      await record.save();
      closedCount++;
    }

    res.json({ success: true, message: `Auto-closed ${closedCount} abandoned shifts.` });
  } catch (error) {
    console.error("runAutoCheckout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { date, userId } = req.query;
    const query: any = {};

    if (date) query.date = date;
    if (userId) query.userId = userId;

    const records = await Attendance.find(query)
      .populate("userId", "firstName lastName email employeeId department")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error("getAllAttendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};