import { Request, Response } from "express";
import mongoose from "mongoose";
import Leave from "../models/leave.model";

export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    // Basic check to ensure we don't save empty requests.
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Logic guard: Prevent users from accidentally picking an end date that comes before the start.
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: "Start date cannot be after end date" });
    }

    const newLeave = await Leave.create({
      userId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: "Pending" // All new requests start as Pending by default.
    });

    res.status(201).json({ success: true, message: "Leave applied successfully", data: newLeave });
  } catch (error) {
    console.error("applyLeave error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    // Show the most recent applications first so the user sees their latest status immediately.
    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error("getMyLeaves error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = {};
    
    // Allows filtering (e.g., HR only wants to see 'Pending' requests).
    if (status) query.status = status;

    const leaves = await Leave.find(query)
      .populate("userId", "firstName lastName email department")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error("getAllLeaves error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminComment } = req.body; 

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave record not found" });
    }

    leave.status = status;
    
    // Explicitly casting the ID to ObjectId to maintain schema consistency 
    // and avoid "string vs object" comparison issues later.
    if (req.user?.id) {
        leave.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    }
    
    if (adminComment) leave.adminComment = adminComment;

    await leave.save();

    res.json({ success: true, message: `Leave ${status}`, data: leave });
  } catch (error) {
    console.error("updateLeaveStatus error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};