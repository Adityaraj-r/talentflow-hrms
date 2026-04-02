import { Request, Response } from "express";
import mongoose from "mongoose";
import Leave from "../models/leave.model";
import LeavePolicy from "../models/LeavePolicy.model";
import LeaveBalance from "../models/LeaveBalance.model";
import User from "../models/User.model";

const getCurrentYear = () => new Date().getFullYear();

const normalizeRole = (role: string) =>
  role?.toUpperCase().replace(/[\s_]/g, "");

const ensureLeaveBalance = async (
  userId: mongoose.Types.ObjectId | string,
  year: number
) => {
  const policies = await LeavePolicy.find({ isActive: true });

  let balance = await LeaveBalance.findOne({ userId, year });

  if (!balance) {
    const user = await User.findById(userId).select("gender");
    const balances = policies
      .filter((p) => {
        if (p.applicableTo === "All") return true;
        if (!user?.gender) return false;
        const g = user.gender.toLowerCase();
        if (p.applicableTo === "Male" && g === "male") return true;
        if (p.applicableTo === "Female" && g === "female") return true;
        return false;
      })
      .map((p) => ({
        leaveType: p.leaveType,
        allocated: p.annualLimit,
        used: 0,
        remaining: p.annualLimit,
        carriedForward: 0,
      }));

    balance = await LeaveBalance.create({ userId, year, balances });
  } else {
    const user = await User.findById(userId).select("gender");
    const existingTypes = balance.balances.map((b) => b.leaveType);
    let updated = false;

    for (const p of policies) {
      if (existingTypes.includes(p.leaveType)) continue;

      if (p.applicableTo !== "All") {
        if (!user?.gender) continue;
        const g = user.gender.toLowerCase();
        if (p.applicableTo === "Male" && g !== "male") continue;
        if (p.applicableTo === "Female" && g !== "female") continue;
      }

      balance.balances.push({
        leaveType: p.leaveType,
        allocated: p.annualLimit,
        used: 0,
        remaining: p.annualLimit,
        carriedForward: 0,
      });
      updated = true;
    }

    if (updated) {
      balance.lastSyncedAt = new Date();
      await balance.save();
    }
  }
  return balance;
};

export const createLeavePolicy = async (req: Request, res: Response) => {
  try {
    const {
      leaveType,
      description,
      annualLimit,
      carryForward,
      maxCarryForwardDays,
      applicableTo,
    } = req.body;

    if (!leaveType || annualLimit === undefined) {
      return res.status(400).json({
        success: false,
        message: "leaveType and annualLimit are required",
      });
    }

    const existing = await LeavePolicy.findOne({ leaveType });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A policy for "${leaveType}" already exists. Use update to modify it.`,
      });
    }

    const policy = await LeavePolicy.create({
      leaveType,
      description: description || "",
      annualLimit: Number(annualLimit),
      carryForward: carryForward ?? false,
      maxCarryForwardDays: Number(maxCarryForwardDays || 0),
      applicableTo: applicableTo || "All",
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(req.user?.id),
    });

    res.status(201).json({
      success: true,
      message: "Leave policy created successfully",
      data: policy,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllLeavePolicies = async (req: Request, res: Response) => {
  try {
    const policies = await LeavePolicy.find()
      .populate("createdBy", "firstName lastName")
      .sort({ leaveType: 1 });

    res.json({ success: true, data: policies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      description,
      annualLimit,
      carryForward,
      maxCarryForwardDays,
      applicableTo,
      isActive,
    } = req.body;

    const policy = await LeavePolicy.findById(id);
    if (!policy) {
      return res
        .status(404)
        .json({ success: false, message: "Leave policy not found" });
    }

    if (description !== undefined) policy.description = description;
    if (annualLimit !== undefined) policy.annualLimit = Number(annualLimit);
    if (carryForward !== undefined) policy.carryForward = carryForward;
    if (maxCarryForwardDays !== undefined)
      policy.maxCarryForwardDays = Number(maxCarryForwardDays);
    if (applicableTo !== undefined) policy.applicableTo = applicableTo;
    if (isActive !== undefined) policy.isActive = isActive;
    policy.updatedBy = new mongoose.Types.ObjectId(req.user?.id);

    await policy.save();

    res.json({
      success: true,
      message: "Leave policy updated",
      data: policy,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLeavePolicy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const policy = await LeavePolicy.findById(id);
    if (!policy) {
      return res
        .status(404)
        .json({ success: false, message: "Leave policy not found" });
    }

    policy.isActive = false;
    policy.updatedBy = new mongoose.Types.ObjectId(req.user?.id);
    await policy.save();

    res.json({ success: true, message: "Leave policy deactivated" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMyLeaveBalance = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const year = getCurrentYear();

    const balance = await ensureLeaveBalance(userId!, year);

    res.json({ success: true, data: balance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllLeaveBalances = async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || getCurrentYear();

    const balances = await LeaveBalance.find({ year })
      .populate("userId", "firstName lastName email department employeeCode")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: balances });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const initializeBalancesForAllEmployees = async (
  req: Request,
  res: Response
) => {
  try {
    const year = Number(req.query.year) || getCurrentYear();
    const employees = await User.find({
      isActive: true,
      isDeleted: false,
    }).select("_id");

    let initialized = 0;
    for (const emp of employees) {
      await ensureLeaveBalance(emp._id as mongoose.Types.ObjectId, year);
      initialized++;
    }

    res.json({
      success: true,
      message: `Balances initialized for ${initialized} employees for year ${year}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const applyLeave = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    let totalDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) totalDays++;
      current.setDate(current.getDate() + 1);
    }

    if (totalDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected date range falls on weekends only",
      });
    }

    const policy = await LeavePolicy.findOne({ leaveType, isActive: true });
    if (!policy) {
      return res.status(400).json({
        success: false,
        message: `No active policy found for "${leaveType}"`,
      });
    }

    const user = await User.findById(userId).select("gender");
    if (policy.applicableTo !== "All") {
      const gender = user?.gender?.toLowerCase();
      if (
        (policy.applicableTo === "Male" && gender !== "male") ||
        (policy.applicableTo === "Female" && gender !== "female")
      ) {
        return res.status(403).json({
          success: false,
          message: `"${leaveType}" leave is not applicable for your gender`,
        });
      }
    }

    const year = start.getFullYear();
    const balance = await ensureLeaveBalance(userId!, year);
    const entry = balance.balances.find((b) => b.leaveType === leaveType);

    if (!entry) {
      return res.status(400).json({
        success: false,
        message: `No balance entry found for "${leaveType}"`,
      });
    }

    if (entry.remaining < totalDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${leaveType} leave balance. You have ${entry.remaining} day(s) remaining but requested ${totalDays} day(s).`,
      });
    }

    const overlap = await Leave.findOne({
      userId,
      status: { $in: ["Pending", "Approved"] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request that overlaps with these dates",
      });
    }

    const newLeave = await Leave.create({
      userId,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: newLeave,
    });
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
    const userRole = normalizeRole(req.user?.role || "");
    const userId = req.user?.id;
    const { status } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    let leaves;

    if (["HRMANAGER", "ADMIN", "SUPERADMIN"].includes(userRole)) {
      leaves = await Leave.find(filter)
        .populate("userId", "firstName lastName email department")
        .sort({ createdAt: -1 });
    } else if (["DEPARTMENTMANAGER", "DIRECTMANAGER"].includes(userRole)) {
      const currentUser = await User.findById(userId);
      const teamMembers = await User.find({
        department: currentUser?.department,
        isActive: true,
        isDeleted: false,
      }).select("_id");

      const teamIds = teamMembers.map((m) => m._id);
      filter.userId = { $in: teamIds };

      leaves = await Leave.find(filter)
        .populate("userId", "firstName lastName email department")
        .sort({ createdAt: -1 });
    } else if (userRole === "HROFFICER") {
      leaves = await Leave.find(filter)
        .populate("userId", "firstName lastName email department")
        .sort({ createdAt: -1 });
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, count: leaves.length, data: leaves });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    if (status === "Rejected" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required when rejecting",
      });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "Leave record not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be actioned",
      });
    }

   const previousStatus = leave.status as "Pending" | "Approved" | "Rejected";
    leave.status = status;
    leave.approvedBy = new mongoose.Types.ObjectId(req.user?.id);
    if (rejectionReason) leave.rejectionReason = rejectionReason;
    await leave.save();

    const year = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      userId: leave.userId,
      year,
    });

    if (balance) {
      const entry = balance.balances.find(
        (b) => b.leaveType === leave.leaveType
      );
      if (entry) {
        if (status === "Approved") {
          entry.used = Math.min(
            entry.allocated + entry.carriedForward,
            entry.used + leave.totalDays
          );
          entry.remaining = Math.max(
            0,
            entry.allocated + entry.carriedForward - entry.used
          );
        } else if (
          status === "Rejected" &&
          previousStatus === "Approved"
        ) {
          entry.used = Math.max(0, entry.used - leave.totalDays);
          entry.remaining =
            entry.allocated + entry.carriedForward - entry.used;
        }
        balance.lastSyncedAt = new Date();
        await balance.save();
      }
    }

    res.json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      data: leave,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const leave = await Leave.findById(id);
    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "Leave not found" });
    }

    if (leave.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: "You can only cancel your own leave" });
    }

    if (!["Pending", "Approved"].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or approved leaves can be cancelled",
      });
    }

    const wasApproved = leave.status === "Approved";
    leave.status = "Rejected";
    leave.rejectionReason = "Cancelled by employee";
    await leave.save();
    if (wasApproved) {
      const year = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({
        userId: leave.userId,
        year,
      });
      if (balance) {
        const entry = balance.balances.find(
          (b) => b.leaveType === leave.leaveType
        );
        if (entry) {
          entry.used = Math.max(0, entry.used - leave.totalDays);
          entry.remaining =
            entry.allocated + entry.carriedForward - entry.used;
          balance.lastSyncedAt = new Date();
          await balance.save();
        }
      }
    }

    res.json({ success: true, message: "Leave cancelled successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};