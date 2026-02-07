import { Request, Response } from "express";
import Attendance from "../models/Attendance.model";

// Define shift timings here. 
// If your HR policy changes (e.g., 10:00 AM start), update these constants.
const OFFICE_START_HOUR = 9;
const OFFICE_START_MINUTE = 30;

// Returns YYYY-MM-DD. Using a string for dates avoids timezone 
// shifts that often happen with full ISO objects in MongoDB.
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // We fetch the last 30 entries to show a standard "Monthly View" on the frontend.
    const records = await Attendance.find({ userId })
      .sort({ createdAt: -1 }) 
      .limit(30);

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error("getMyAttendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clockIn = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const todayDateString = getTodayString();
    const now = new Date();

    // Prevent double clock-ins for the same day.
    const existingRecord = await Attendance.findOne({
      userId,
      date: todayDateString
    });

    if (existingRecord) {
      return res.status(400).json({ success: false, message: "Already clocked in today" });
    }

    // Flag the user as 'Late' if they clock in even 1 second after the threshold.
    const officeStartTime = new Date();
    officeStartTime.setHours(OFFICE_START_HOUR, OFFICE_START_MINUTE, 0, 0);

    const status = now > officeStartTime ? "Late" : "Present";

    const newAttendance = await Attendance.create({
      userId,
      date: todayDateString,
      checkIn: now,
      status: status
    });

    res.json({
      success: true,
      message: `Clock-in successful (${status})`,
      data: newAttendance
    });

  } catch (error) {
    console.error("clockIn error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const clockOut = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Look for the active session. If checkOut is null, the shift is still ongoing.
    const attendance = await Attendance.findOne({
      userId,
      checkOut: null 
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active session found. Did you forget to clock in?"
      });
    }

    const now = new Date();
    attendance.checkOut = now;

    // Standard duration calculation. We store this as a decimal (e.g., 8.5 hours).
    if (attendance.checkIn) {
        const checkInTime = new Date(attendance.checkIn).getTime();
        const checkOutTime = now.getTime();
        
        const diffMs = checkOutTime - checkInTime;
        const hoursWorked = diffMs / (1000 * 60 * 60);

        attendance.totalHours = Number(hoursWorked.toFixed(2));
    } else {
        // Fallback for data integrity; shouldn't be hit if clockIn logic is followed.
        attendance.totalHours = 0;
    }

    await attendance.save();

    res.json({
      success: true,
      message: "Clock-out successful",
      data: attendance
    });
  } catch (error) {
    console.error("clockOut error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const { date, userId } = req.query;
    const query: any = {};

    // Allow admins to filter by specific date (YYYY-MM-DD) or specific employee.
    if (date) {
      query.date = date; 
    }

    if (userId) {
      query.userId = userId;
    }

    const records = await Attendance.find(query)
      .populate("userId", "firstName lastName email employeeId department")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error("getAllAttendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};