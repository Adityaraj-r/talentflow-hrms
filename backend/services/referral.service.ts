import mongoose from "mongoose";
import ReferralPolicy from "../models/ReferralPolicy.model";
import Referral from "../models/Referral.model";
import ReferralReward from "../models/ReferralReward.model";
import Application from "../models/application.model";
import Employee from "../models/Employee.model";
import Job from "../models/job.model";
import User from "../models/User.model";
import AuditLog from "../models/AuditLog";
import { NotificationModel, NotificationType } from "../models/Notification";

export const getOrCreateReferralPolicy = async () => {
  let policy = await ReferralPolicy.findOne();
  if (!policy) {
    policy = await ReferralPolicy.create({});
  }
  return policy;
};

/**
 * Synchronize ATS Application status with the corresponding Referral status.
 */
export const syncReferralStatusFromApplication = async (
  applicationId: string | mongoose.Types.ObjectId,
  appStatus: string
) => {
  try {
    if (!applicationId) return;

    const referral = await Referral.findOne({ applicationId });
    if (!referral) return;

    const normalizedStatus = (appStatus || "").trim().toLowerCase();
    let simplifiedProgress = "Application Received";
    let referralStatus = referral.status;

    if (normalizedStatus === "applied" || normalizedStatus === "new") {
      simplifiedProgress = "Application Received";
      referralStatus = "Applied";
    } else if (
      normalizedStatus === "hr screening" ||
      normalizedStatus === "under review" ||
      normalizedStatus === "shortlisted" ||
      normalizedStatus === "screening" ||
      normalizedStatus.includes("interview")
    ) {
      simplifiedProgress = "In Process";
      referralStatus = "In Process";
    } else if (
      normalizedStatus === "selected" ||
      normalizedStatus === "approved" ||
      normalizedStatus === "offered" ||
      normalizedStatus === "offer accepted" ||
      normalizedStatus === "background verification"
    ) {
      simplifiedProgress = "Selected";
      referralStatus = "Selected";
    } else if (normalizedStatus === "hired" || normalizedStatus === "joined") {
      simplifiedProgress = "Successful (Hired)";
      referralStatus = "Successful";
    } else if (normalizedStatus === "rejected" || normalizedStatus === "declined") {
      simplifiedProgress = "Rejected";
      referralStatus = "Rejected";
    } else if (normalizedStatus === "cancelled" || normalizedStatus === "withdrawn") {
      simplifiedProgress = "Withdrawn";
      referralStatus = "Withdrawn";
    }

    if (referral.status !== referralStatus) {
      referral.status = referralStatus;

      // Stamp SLA firstReviewedAt timestamp when candidate moves into review/interview/selection stages
      if (!referral.firstReviewedAt && (referralStatus === "In Process" || referralStatus === "Selected" || referralStatus === "Successful")) {
        referral.firstReviewedAt = new Date();
      }

      await referral.save();
    }

    // In-app notification to the referring employee if available
    const employee = await Employee.findById(referral.referredByEmployeeId);
    if (employee && employee.userId) {
      await NotificationModel.create({
        userId: employee.userId,
        type: NotificationType.REFERRAL_STATUS_UPDATED,
        title: "Referral Candidate Progress Updated",
        body: `Your referral candidate ${referral.candidateName} status changed to '${simplifiedProgress}'.`,
        metadata: { referralId: referral._id, applicationId, status: simplifiedProgress },
      });
    }

    await AuditLog.create({
      userId: "System",
      userName: "System (ATS Sync)",
      userRole: "Automated Service",
      action: "REFERRAL_STATUS_SYNC",
      module: "Referral",
      details: `Synced referral ${referral._id} progress to '${simplifiedProgress}' (Status: ${referralStatus}) for app status '${appStatus}'.`,
      status: "Success",
    });
  } catch (err: any) {
    console.error("[syncReferralStatusFromApplication Error]:", err.message);
  }
};

/**
 * Idempotently create a ReferralReward when a referred candidate is hired.
 */
export const handleAutoRewardCreationOnHire = async (applicationDoc: any) => {
  try {
    if (!applicationDoc) return;

    let referral = null;

    if (applicationDoc.referralId) {
      referral = await Referral.findById(applicationDoc.referralId);
    }

    if (!referral && applicationDoc.email && applicationDoc.jobId) {
      const normEmail = applicationDoc.email.trim().toLowerCase();
      referral = await Referral.findOne({
        jobId: applicationDoc.jobId,
        candidateEmail: normEmail,
      });
    }

    if (!referral) return; // Not a referred applicant

    // Check idempotency: If reward already exists, DO NOT create a duplicate
    const existingReward = await ReferralReward.findOne({
      $or: [{ referralId: referral._id }, { applicationId: applicationDoc._id }],
    });

    if (existingReward) {
      console.log(`[ReferralAutoReward] Reward already exists for referral ${referral._id}`);
      return existingReward;
    }

    const policy = await getOrCreateReferralPolicy();
    const job = await Job.findById(applicationDoc.jobId).lean();

    const bonusAmount =
      (job as any)?.referralBonusAmount && (job as any)?.referralBonusAmount > 0
        ? (job as any).referralBonusAmount
        : policy.defaultBonusAmount || 10000;

    const probationDays = policy.probationDurationDays || 90;
    const hiredDate = new Date();
    const probationEndDate = new Date(hiredDate.getTime() + probationDays * 24 * 60 * 60 * 1000);

    const reward = await ReferralReward.create({
      referralId: referral._id,
      applicationId: applicationDoc._id,
      employeeId: referral.referredByEmployeeId,
      jobId: referral.jobId,
      candidateName: applicationDoc.name || referral.candidateName,
      bonusAmount,
      currency: policy.currency || "INR",
      probationDays,
      hiredDate,
      probationEndDate,
      isProbationCompleted: false,
      rewardStatus: "Pending_Probation",
      notes: "Auto-created upon candidate hiring via ATS workflow",
    });

    referral.rewardId = reward._id;
    referral.status = "Successful";
    await referral.save();

    // Create Audit Log
    await AuditLog.create({
      userId: "System",
      userName: "System (Recruitment Hired)",
      userRole: "Automated Service",
      action: "REWARD_CREATED",
      module: "Referral",
      details: `Auto-created ReferralReward ${reward._id} of ${policy.currency} ${bonusAmount} for referrer employee ${referral.referredByEmployeeId}.`,
      status: "Success",
    });

    // Notify HR Users
    const hrUsers = await User.find({
      role: { $in: ["HR_MANAGER", "HR_OFFICER"] },
      isDeleted: { $ne: true },
      isActive: { $ne: false },
    }).select("_id");
    for (const hr of hrUsers) {
      await NotificationModel.create({
        userId: hr._id,
        type: NotificationType.REFERRAL_REWARD_CREATED,
        title: "New Referral Reward Pending Probation",
        body: `Referred candidate ${reward.candidateName} was hired. A referral bonus of ${reward.currency} ${reward.bonusAmount} has been logged in Pending Probation.`,
        metadata: { rewardId: reward._id, referralId: referral._id },
      });
    }

    return reward;
  } catch (err: any) {
    console.error("[handleAutoRewardCreationOnHire Error]:", err.message);
  }
};

/**
 * Daily cron background check: Automatically verify if probation duration has elapsed for hired referred employees.
 */
export const processProbationCompletions = async () => {
  try {
    const policy = await getOrCreateReferralPolicy();
    if (!policy.programEnabled) return;

    const pendingRewards = await ReferralReward.find({
      rewardStatus: "Pending_Probation",
    }).populate("employeeId");

    const now = new Date();

    for (const reward of pendingRewards) {
      const emp = reward.employeeId as any;

      // Ensure referring employee is still active and not exited/terminated
      if (emp && emp.status === "Exited") {
        reward.rewardStatus = "Ineligible";
        reward.notes = "Referring employee has exited the organization prior to probation completion.";
        await reward.save();
        continue;
      }

      const hiredDate = new Date(reward.hiredDate || reward.createdAt);
      const probationDays = reward.probationDays || policy.probationDurationDays || 90;
      const probationDueDate = reward.probationEndDate || new Date(hiredDate.getTime() + probationDays * 24 * 60 * 60 * 1000);

      if (now >= probationDueDate) {
        reward.isProbationCompleted = true;
        reward.rewardStatus = "Eligible";
        reward.notes = `Probation of ${probationDays} days successfully completed on ${now.toLocaleDateString()}. Eligible for HR approval.`;
        await reward.save();

        // Audit Log
        await AuditLog.create({
          userId: "System",
          userName: "System (Probation Cron)",
          userRole: "Automated Service",
          action: "PROBATION_COMPLETED",
          module: "Referral",
          details: `Referral reward ${reward._id} marked Eligible after completion of ${probationDays} probation days.`,
          status: "Success",
        });

        // Notify HR Managers
        const hrUsers = await User.find({
          role: { $in: ["HR_MANAGER", "HR_OFFICER"] },
          isDeleted: { $ne: true },
          isActive: { $ne: false },
        }).select("_id");
        for (const hr of hrUsers) {
          await NotificationModel.create({
            userId: hr._id,
            type: NotificationType.REFERRAL_PROBATION_PASSED,
            title: "Referral Bonus Eligible for HR Approval",
            body: `Candidate ${reward.candidateName} completed ${probationDays} days probation. Bonus of ${reward.currency} ${reward.bonusAmount} is now Eligible for HR approval.`,
            metadata: { rewardId: reward._id },
          });
        }
      }
    }
  } catch (err: any) {
    console.error("[processProbationCompletions Error]:", err.message);
  }
};

/**
 * Daily cron background check: Warn employees if their pending referral invitations are nearing expiry (e.g. 3 days left).
 */
export const checkExpiringReferralInvitations = async () => {
  try {
    const policy = await getOrCreateReferralPolicy();
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiringReferrals = await Referral.find({
      status: "Invited",
      invitationExpiry: { $gt: now, $lte: threeDaysFromNow },
    });

    for (const ref of expiringReferrals) {
      const emp = await Employee.findById(ref.referredByEmployeeId);
      if (emp && emp.userId) {
        // Idempotency: avoid creating duplicate notification if one was created in last 24h
        const existing = await NotificationModel.findOne({
          userId: emp.userId,
          type: NotificationType.REFERRAL_EXPIRING_SOON,
          "metadata.referralId": ref._id,
        });

        if (!existing) {
          await NotificationModel.create({
            userId: emp.userId,
            type: NotificationType.REFERRAL_EXPIRING_SOON,
            title: "Referral Invitation Expiring Soon",
            body: `Your referral invitation for ${ref.candidateName} is expiring in less than 3 days.`,
            metadata: { referralId: ref._id },
          });
        }
      }
    }
  } catch (err: any) {
    console.error("[checkExpiringReferralInvitations Error]:", err.message);
  }
};
