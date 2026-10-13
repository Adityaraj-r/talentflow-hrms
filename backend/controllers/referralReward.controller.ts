import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import ReferralReward from "../models/ReferralReward.model";
import Referral from "../models/Referral.model";
import Application from "../models/application.model";
import AuditLog from "../models/AuditLog";
import User from "../models/User.model";
import { NotificationModel, NotificationType } from "../models/Notification";
import { notifyReferralRewardFinanceApproved } from "../services/notification.service";

export const getRewardQueue = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.rewardStatus = status;

    const rewards = await ReferralReward.find(filter)
      .populate("referralId", "candidateName candidateEmail relationship referralNote")
      .populate("employeeId", "firstName lastName email department designation employeeCode")
      .populate("jobId", "jobTitle department")
      .populate("applicationId", "status currentRound")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: rewards });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveRewardHR = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    const reward = await ReferralReward.findById(id);
    if (!reward) {
      return res.status(404).json({ success: false, error: "Referral reward record not found" });
    }

    if (reward.rewardStatus !== "Eligible" && reward.rewardStatus !== "Pending_Probation") {
      return res.status(400).json({
        success: false,
        error: `Cannot approve HR stage for reward in '${reward.rewardStatus}' status`,
      });
    }

    reward.rewardStatus = "HR_Approved";
    reward.approvedByHR = {
      userId: userId as any,
      approvedAt: new Date(),
    };
    if (notes) reward.notes = notes;

    await reward.save();

    await AuditLog.create({
      userId: userId || "Unknown",
      userName: req.user?.email || "HR Manager",
      userRole: req.user?.role || "HR",
      action: "REWARD_APPROVED_HR",
      module: "Referral",
      details: `Approved HR stage for Referral Reward ${reward._id} (Bonus: ${reward.currency} ${reward.bonusAmount}).`,
      status: "Success",
    });
    await notifyReferralRewardFinanceApproved(
      reward.employeeId,
      reward._id.toString(),
      reward.candidateName,
      reward.bonusAmount,
      reward.currency
    );

    res.json({
      success: true,
      message: "Referral bonus approved by Finance and linked to Payroll",
      data: reward,
    });

    const user = await User.findById(userId);
    const financeUsers = await User.find({ role: { $in: ["Finance", "Admin", "Finance Manager"] } }).select("_id");
    for (const fin of financeUsers) {
      await NotificationModel.create({
        userId: fin._id,
        type: NotificationType.REFERRAL_REWARD_APPROVED,
        title: "Referral Reward Ready for Finance Approval",
        body: `Referral bonus of ${reward.currency} ${reward.bonusAmount} for candidate ${reward.candidateName} was approved by HR and awaits Finance release.`,
        metadata: { rewardId: reward._id },
      });
    }

    res.json({
      success: true,
      message: "Referral bonus approved by HR",
      data: reward,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const approveRewardFinance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, payrollMonth, payrollYear } = req.body;
    const userId = req.user?.id;

    const reward = await ReferralReward.findById(id);
    if (!reward) {
      return res.status(404).json({ success: false, error: "Referral reward record not found" });
    }

    if (reward.rewardStatus !== "HR_Approved") {
      return res.status(400).json({
        success: false,
        error: "Finance approval requires prior HR approval",
      });
    }

    const now = new Date();
    reward.rewardStatus = "Finance_Approved";
    reward.approvedByFinance = {
      userId: userId as any,
      approvedAt: now,
    };
    reward.payrollPeriod = {
      month: payrollMonth || now.getMonth() + 1,
      year: payrollYear || now.getFullYear(),
    };
    if (notes) reward.notes = notes;

    await reward.save();

    await AuditLog.create({
      userId: userId || "Unknown",
      userName: req.user?.email || "Finance Admin",
      userRole: req.user?.role || "Finance",
      action: "REWARD_APPROVED_FINANCE",
      module: "Referral",
      details: `Approved Finance release for Referral Reward ${reward._id} assigned to payroll ${reward.payrollPeriod.month}/${reward.payrollPeriod.year}.`,
      status: "Success",
    });

    res.json({
      success: true,
      message: "Referral bonus approved by Finance and linked to Payroll",
      data: reward,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getRewardAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, department, jobId } = req.query;

    const rewardsQuery: any = {};
    if (startDate || endDate) {
      rewardsQuery.createdAt = {};
      if (startDate) rewardsQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) rewardsQuery.createdAt.$lte = new Date(endDate as string);
    }
    if (jobId) rewardsQuery.jobId = jobId;

    const rewards = await ReferralReward.find(rewardsQuery).lean();
    const referrals = await Referral.find().lean();

    const totalReferrals = referrals.length;
    const totalApplied = referrals.filter((r) => r.status === "Applied" || r.applicationId).length;

    const totalRewards = rewards.length;
    const totalPaid = rewards
      .filter((r) => r.rewardStatus === "Paid")
      .reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    const totalPending = rewards
      .filter((r) => ["Pending_Probation", "Eligible", "HR_Approved", "Finance_Approved"].includes(r.rewardStatus))
      .reduce((sum, r) => sum + (r.bonusAmount || 0), 0);

    const rewardsByStatus = rewards.reduce((acc: any, r) => {
      acc[r.rewardStatus] = (acc[r.rewardStatus] || 0) + 1;
      return acc;
    }, {});

    // Calculate Conversion Metrics
    const totalHired = rewards.length; // Referred candidates that reached Hired & logged rewards
    const applicationToHireRate = totalApplied > 0 ? ((totalHired / totalApplied) * 100).toFixed(1) : "0.0";
    const referralToHireRate = totalReferrals > 0 ? ((totalHired / totalReferrals) * 100).toFixed(1) : "0.0";

    res.json({
      success: true,
      data: {
        totalReferrals,
        totalApplied,
        totalHired,
        totalRewards,
        totalPaid,
        totalPending,
        rewardsByStatus,
        funnel: {
          referralsSent: totalReferrals,
          applied: totalApplied,
          hired: totalHired,
          probationEligible: rewards.filter((r) => ["Eligible", "HR_Approved", "Finance_Approved", "Paid"].includes(r.rewardStatus)).length,
          paid: rewards.filter((r) => r.rewardStatus === "Paid").length,
        },
        conversion: {
          referralToHireRate: `${referralToHireRate}%`,
          applicationToHireRate: `${applicationToHireRate}%`,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
