import { Request, Response } from "express";
import mongoose from "mongoose";
import Leave from "../models/leave.model";

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ success: false, message: "Start date cannot be after end date" });
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    const newLeave = await Leave.create({
      userId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: "Pending" 
    });

    res.status(201).json({ success: true, message: "Leave applied successfully", data: newLeave });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};
    
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate("userId", "firstName lastName email department")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; 

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave record not found" });
    }

    leave.status = status;
    
    if (req.user?.id) {
        leave.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    
    if (rejectionReason) leave.rejectionReason = rejectionReason;

    await leave.save();

    res.json({ success: true, message: `Leave ${status}`, data: leave });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};