import { Request, Response } from "express";
import Shift from "../models/Shift.model";
import User from "../models/User.model";

export const createShift = async (req: Request, res: Response) => {
  try {
    const { name, startTime, endTime, graceMinutes } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "name, startTime and endTime are required" });
    }

    const existing = await Shift.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Shift name already exists" });
    }

    const newShift = await Shift.create({
      name,
      startTime,
      endTime,
      graceMinutes: Number(graceMinutes) >= 0 ? Number(graceMinutes) : 15,
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

export const updateShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, startTime, endTime, graceMinutes } = req.body;

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    if (name && name !== shift.name) {
      const duplicate = await Shift.findOne({ name, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Another shift with this name already exists" });
      }
      shift.name = name;
    }

    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (graceMinutes !== undefined) {
      const grace = Number(graceMinutes);
      if (grace < 0 || grace > 120) {
        return res.status(400).json({ success: false, message: "graceMinutes must be between 0 and 120" });
      }
      shift.graceMinutes = grace;
    }

    await shift.save();

    res.json({ success: true, message: "Shift updated successfully", data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteShift = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id);
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

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
      return res.status(400).json({ success: false, message: "shiftId and employeeIds array are required" });
    }

    const shift = await Shift.findById(shiftId);
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }

    await User.updateMany(
      { _id: { $in: employeeIds } },
      { $set: { currentShift: shiftId } }
    );

    await Shift.findByIdAndUpdate(shiftId, {
      $addToSet: { assignedTo: { $each: employeeIds } },
    });

    res.json({ success: true, message: "Shift assigned successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};