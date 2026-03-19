import { Request, Response } from "express";
import Shift from "../models/shift.model";
import User from "../models/User.model"; 

export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, graceMinutes } = req.body;

    const existing = await Shift.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Shift name already exists" });
    }

    const newShift = await Shift.create({
      name,
      startTime,
      endTime,
      graceMinutes
    });

    res.status(201).json({ success: true, message: "Shift created successfully", data: newShift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllShifts = async (req: Request, res: Response) => {
  try {
    const shifts = await Shift.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Shift.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: "Shift deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
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

    await Shift.findByIdAndUpdate(shiftId, {
      $addToSet: { assignedTo: { $each: employeeIds } }
    });

    res.json({ success: true, message: "Shift assigned successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};