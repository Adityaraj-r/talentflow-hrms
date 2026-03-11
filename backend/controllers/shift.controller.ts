import { Request, Response } from "express";
import Shift from "../models/shift.model";
import User from "../models/User.model"; 

export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, lateBuffer } = req.body;

    const existing = await Shift.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Shift name already exists" });
    }

    const newShift = await Shift.create({
      name,
      startTime,
      endTime,
      lateBuffer
    });

    res.status(201).json({ success: true, message: "Shift created successfully", data: newShift });
  } catch (error) {
    console.error("createShift error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: shifts });
  } catch (error) {
    console.error("getAllShifts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Shift.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: "Shift deleted successfully" });
  } catch (error) {
    console.error("deleteShift error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const assignShift = async (req: Request, res: Response) => {
  try {
    const { shiftId, employeeIds } = req.body;

    if (!shiftId || !employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }
    
    await User.updateMany(
      { _id: { $in: employeeIds } },
      { $set: { currentShift: shiftId } }
    );

    res.json({ success: true, message: "Shift assigned successfully" });
  } catch (error) {
    console.error("assignShift error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};