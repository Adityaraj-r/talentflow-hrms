import { Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { AuthRequest } from "../middleware/auth.middleware";
import Referral from "../models/Referral.model";
import Job from "../models/job.model";
import Application from "../models/application.model";
import Employee from "../models/Employee.model";
import User from "../models/User.model";
import AuditLog from "../models/AuditLog";
import ReferralPolicy from "../models/ReferralPolicy.model";
import { sendReferralEmail } from "../utils/sendEmail";
import { getOrCreateReferralPolicy } from "../services/referral.service";

const normalizeStr = (str?: string) => (str || "").trim().toLowerCase();

export const getOpenJobsForReferral = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.find({ status: "Published" })
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();
    const availableJobs = jobs.filter((job: any) => {
      if (!job.deadline) return true;
      const d = new Date(job.deadline);
      d.setHours(23, 59, 59, 999);
      return now <= d;
    });

    res.json({ success: true, data: availableJobs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createReferral = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const policy = await getOrCreateReferralPolicy();
    if (!policy.programEnabled) {
      return res.status(400).json({ success: false, error: "Employee referral program is currently disabled by HR" });
    }

    const user = await User.findById(userId).select("employeeId firstName lastName email");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, error: "No employee profile found for logged-in user" });
    }

    // Validate active referral limit per employee
    const activeCount = await Referral.countDocuments({
      referredByEmployeeId: employeeId,
      status: "Invited",
    });

    if (policy.maxActiveReferralsPerEmployee && activeCount >= policy.maxActiveReferralsPerEmployee) {
      return res.status(400).json({
        success: false,
        error: `You have reached the maximum limit of ${policy.maxActiveReferralsPerEmployee} active pending referrals.`,
      });
    }

    const {
      jobId,
      candidateName,
      candidateEmail,
      candidatePhone,
      resume,
      relationship,
      referralNote,
    } = req.body;

    if (!jobId || !candidateName || !candidateEmail || !candidatePhone) {
      return res.status(400).json({
        success: false,
        error: "Job ID, Candidate Name, Email, and Phone number are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== "Published") {
      return res.status(400).json({ success: false, error: "Referrals can only be made for open, published jobs" });
    }

    if (job.deadline) {
      const d = new Date(job.deadline);
      d.setHours(23, 59, 59, 999);
      if (new Date() > d) {
        return res.status(400).json({ success: false, error: "Referrals are closed for this position because the application deadline has passed" });
      }
    }

    const normEmail = (candidateEmail || "").trim().toLowerCase();
    const phoneDigits = (candidatePhone || "").replace(/\D/g, "");
    const last10Phone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;

    const appPhoneCondition = last10Phone
      ? [{ phone: { $regex: new RegExp(last10Phone) } }]
      : [];

    const existingApp = await Application.findOne({
      jobId,
      $or: [
        { email: { $regex: new RegExp(`^${normEmail}$`, "i") } },
        ...appPhoneCondition,
      ],
    }).lean();

    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: "This candidate has already submitted an application for this position.",
        message: "Candidate already exists in ATS for this position",
      });
    }

    const refPhoneCondition = last10Phone
      ? [{ candidatePhone: { $regex: new RegExp(last10Phone) } }]
      : [];

    // Check if another employee already referred this candidate
    const existingRef = await Referral.findOne({
      jobId,
      status: { $in: ["Invited", "Applied"] },
      $or: [
        { candidateEmail: normEmail },
        ...refPhoneCondition,
      ],
    });

    if (existingRef) {
      // Conflict Handling: Store secondary referral attempt in conflictDetails
      if (String(existingRef.referredByEmployeeId) !== String(employeeId)) {
        existingRef.conflictStatus = "Conflict_Detected";
        existingRef.conflictDetails = existingRef.conflictDetails || [];
        existingRef.conflictDetails.push({
          referredByEmployeeId: employeeId as any,
          referredAt: new Date(),
          relationship: relationship || "",
          referralNote: referralNote || "",
          notes: `Secondary referral claim submitted by ${user?.firstName} ${user?.lastName}`,
        });
        await existingRef.save();

        await AuditLog.create({
          userId: userId as string,
          userName: `${user?.firstName} ${user?.lastName}`.trim(),
          userRole: req.user?.role || "Employee",
          action: "REFERRAL_CONFLICT_LOGGED",
          module: "Referral",
          details: `Logged referral conflict for candidate ${normEmail} on job ${jobId}. First referrer: ${existingRef.referredByEmployeeId}, Second referrer: ${employeeId}.`,
          status: "Success",
        });

        return res.status(400).json({
          success: false,
          error: "This candidate was already referred by another employee for this position. A referral conflict record has been logged for HR review.",
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "You have already referred this candidate for this position.",
        });
      }
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const referral = await Referral.create({
      jobId,
      referredByEmployeeId: employeeId,
      candidateName: candidateName.trim(),
      candidateEmail: normEmail,
      candidatePhone: (candidatePhone || "").trim(),
      resume: resume || "",
      relationship: relationship || "",
      referralNote: referralNote || "",
      status: "Invited",
      invitationToken,
      invitationExpiry,
    });

    const frontendBaseUrl = (process.env.FRONTEND_URL || process.env.NGROK_URL || "http://localhost:5173").trim().replace(/\/$/, "");
    const applyLink = `${frontendBaseUrl}/referral/apply/${invitationToken}`;

    const referrerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "A colleague";

    let emailResult: any = null;
    if (req.body.invitationType !== "ShareableLink") {
      try {
        emailResult = await sendReferralEmail(normEmail, {
          companyName: "InternsLand",
          candidateName: candidateName.trim(),
          referrerName,
          jobTitle: job.jobTitle,
          department: job.department,
          location: job.officeLocation || "On-site",
          employmentType: job.employmentType,
          applicationDeadline: job.deadline ? new Date(job.deadline).toLocaleDateString() : undefined,
          applyLink,
        });
      } catch (emailErr: any) {
        console.error("[ReferralEmailError]", emailErr.message);
      }
    }

    const isEmailSent = Boolean(emailResult?.success);
    const message = isEmailSent
      ? "Referral submitted successfully. An invitation has been sent to the candidate."
      : "Referral submitted successfully, but the candidate invitation could not be sent. Please retry the invitation.";

    res.status(201).json({
      success: true,
      message,
      shareableLink: applyLink,
      emailSent: isEmailSent,
      emailReason: emailResult?.reason,
      data: referral,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateShareableLink = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, error: "Job ID required" });
    }

    const user = await User.findById(userId).select("employeeId email");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    const job = await Job.findById(jobId);
    if (!job || job.status !== "Published") {
      return res.status(400).json({ success: false, error: "Job opening is not active" });
    }

    const invitationToken = crypto.randomBytes(32).toString("hex");
    const invitationExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const referral = await Referral.create({
      jobId,
      referredByEmployeeId: employeeId,
      candidateName: "Shareable Link Candidate",
      candidateEmail: `shareable_${Date.now()}@placeholder.local`,
      status: "Invited",
      invitationToken,
      invitationExpiry,
    });

    const frontendBaseUrl = (process.env.FRONTEND_URL || process.env.NGROK_URL || "http://localhost:5173").trim().replace(/\/$/, "");
    const shareableLink = `${frontendBaseUrl}/referral/apply/${invitationToken}`;

    res.status(201).json({
      success: true,
      message: "Shareable referral link generated successfully",
      shareableLink,
      token: invitationToken,
      data: referral,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyReferrals = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const user = await User.findById(userId).select("employeeId email");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    if (!employeeId) {
      return res.json({ success: true, data: [] });
    }

    const referrals = await Referral.find({ referredByEmployeeId: employeeId })
      .populate("jobId", "jobTitle department officeLocation employmentType")
      .populate("applicationId", "status currentRound updatedAt createdAt backgroundVerification workflowState")
      .populate("rewardId", "rewardStatus isProbationCompleted probationDays probationEndDate hiredDate")
      .sort({ createdAt: -1 })
      .lean();

    const safeReferrals = referrals.map((ref: any) => {
      let progress = ref.status || "Invited";

      if (ref.status === "Withdrawn" || ref.status === "Cancelled") {
        progress = "Withdrawn";
      } else if (ref.status === "Expired") {
        progress = "Expired";
      } else if (ref.status === "Conflict") {
        progress = "Conflict Review";
      } else if (ref.applicationId) {
        const appStatus = (ref.applicationId.status || "").toLowerCase();
        if (appStatus === "applied" || appStatus === "new") {
          progress = "Applied";
        } else if (
          appStatus === "hr screening" ||
          appStatus === "under review" ||
          appStatus === "shortlisted" ||
          appStatus === "screening" ||
          appStatus.includes("interview")
        ) {
          progress = "In Process";
        } else if (
          appStatus === "selected" ||
          appStatus === "approved" ||
          appStatus === "offered" ||
          appStatus === "offer accepted" ||
          appStatus === "background verification"
        ) {
          progress = "Selected";
        } else if (appStatus === "hired" || appStatus === "joined") {
          progress = "Successful";
        } else if (appStatus === "rejected" || appStatus === "declined") {
          progress = "Rejected";
        }
      }

      return {
        ...ref,
        referralDate: ref.createdAt,
        lastUpdated: ref.applicationId?.updatedAt || ref.updatedAt,
        jobTitle: ref.jobId?.jobTitle || "Position",
        department: ref.jobId?.department || "General",
        progress,
      };
    });

    res.json({ success: true, data: safeReferrals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cancelReferral = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const user = await User.findById(userId).select("employeeId email role");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral record not found" });
    }

    const isAdmin = ["ADMIN", "SUPER ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes((user?.role || "").toUpperCase());
    if (!isAdmin && String(referral.referredByEmployeeId) !== String(employeeId)) {
      return res.status(403).json({ success: false, error: "You can only cancel your own referrals" });
    }

    if (referral.status === "Applied" || referral.applicationId) {
      return res.status(400).json({ success: false, error: "Cannot cancel a referral that has already submitted an application" });
    }

    referral.status = "Cancelled";
    await referral.save();

    res.json({ success: true, message: "Referral invitation cancelled", data: referral });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyReferralToken = async (req: AuthRequest, res: Response) => {
  try {
    const token = (req.query.token || req.params.token || "").toString().trim();
    if (!token) {
      return res.status(400).json({ success: false, error: "Token parameter required" });
    }

    const referral = await Referral.findOne({ invitationToken: token })
      .populate("jobId")
      .populate("referredByEmployeeId", "name firstName lastName employeeCode email department");

    if (!referral) {
      return res.status(404).json({ success: false, error: "This referral link is invalid or unavailable." });
    }

    if (referral.status === "Applied" || referral.applicationId) {
      return res.status(400).json({ success: false, error: "This referral invitation has already been used" });
    }

    if (referral.status === "Cancelled") {
      return res.status(400).json({ success: false, error: "This referral invitation is no longer active." });
    }

    if (new Date() > new Date(referral.invitationExpiry)) {
      referral.status = "Expired";
      await referral.save();
      return res.status(400).json({ success: false, error: "This referral invitation has expired. Please contact the person who referred you or the recruitment team." });
    }

    const emp = referral.referredByEmployeeId as any;
    const referrerName = emp ? (emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "An Employee") : "An Employee";

    const job = referral.jobId as any;

    res.json({
      success: true,
      data: {
        referralId: referral._id,
        jobId: job?._id,
        candidateName: referral.candidateName,
        candidateEmail: (referral.candidateEmail || "").includes("@placeholder.local") ? "" : referral.candidateEmail,
        candidatePhone: referral.candidatePhone || "",
        referredBy: {
          name: referrerName,
        },
        jobDetails: job ? {
          jobTitle: job.jobTitle,
          department: job.department,
          officeLocation: job.officeLocation || "On-site",
          employmentType: job.employmentType || "Full-Time",
          aboutRole: job.aboutRole || "",
          keyResponsibilities: job.keyResponsibilities || "",
          requiredSkills: job.requiredSkills || job.skills || [],
          hiringRoles: job.hiringRoles || [],
          deadline: job.deadline,
        } : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReferralPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const policy = await getOrCreateReferralPolicy();
    res.json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateReferralPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let policy = await getOrCreateReferralPolicy();

    const allowedFields = [
      "programEnabled",
      "invitationExpiryDays",
      "shareableLinkExpiryDays",
      "minEmployeeTenureDays",
      "probationDurationDays",
      "maxActiveReferralsPerEmployee",
      "defaultBonusAmount",
      "currency",
      "probationEligibilityRule",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (policy as any)[field] = req.body[field];
      }
    });

    if (userId) policy.updatedBy = userId as any;
    await policy.save();

    await AuditLog.create({
      userId: userId || "Unknown",
      userName: req.user?.email || "Admin",
      userRole: req.user?.role || "HR/Admin",
      action: "REFERRAL_POLICY_UPDATED",
      module: "Referral",
      details: "Updated Referral Policy settings.",
      status: "Success",
    });

    res.json({ success: true, message: "Referral policy updated successfully", data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getReferralConflicts = async (req: AuthRequest, res: Response) => {
  try {
    const conflicts = await Referral.find({ conflictStatus: "Conflict_Detected" })
      .populate("jobId", "jobTitle department")
      .populate("referredByEmployeeId", "firstName lastName email department employeeCode")
      .populate("conflictDetails.referredByEmployeeId", "firstName lastName email department employeeCode")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: conflicts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resolveReferralConflict = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { chosenReferrerId, notes } = req.body;
    const userId = req.user?.id;

    if (!chosenReferrerId) {
      return res.status(400).json({ success: false, error: "chosenReferrerId is required to resolve conflict" });
    }

    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral record not found" });
    }

    referral.referredByEmployeeId = chosenReferrerId;
    referral.conflictStatus = "Resolved";
    referral.resolvedBy = {
      userId: userId as any,
      resolvedAt: new Date(),
      chosenReferrerId: chosenReferrerId as any,
      notes: notes || "Resolved by HR Admin",
    };

    await referral.save();

    await AuditLog.create({
      userId: userId || "Unknown",
      userName: req.user?.email || "HR Admin",
      userRole: req.user?.role || "HR",
      action: "REFERRAL_CONFLICT_RESOLVED",
      module: "Referral",
      details: `Resolved referral conflict for ${referral.candidateEmail}. Chosen referrer: ${chosenReferrerId}.`,
      status: "Success",
    });

    res.json({ success: true, message: "Referral conflict resolved successfully", data: referral });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const resendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role || "";

    const user = await User.findById(userId).select("employeeId firstName lastName email role");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    const referral = await Referral.findById(id).populate("jobId");
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral record not found" });
    }

    // RBAC: Verify user owns the referral or has HR/Admin privileges
    const isOwner = employeeId && String(referral.referredByEmployeeId) === String(employeeId);
    const isHR = ["HR", "Admin", "HR Manager"].includes(userRole);
    if (!isOwner && !isHR) {
      return res.status(403).json({ success: false, error: "You are not authorized to resend this referral invitation" });
    }

    if (referral.status === "Applied" || referral.status === "Successful") {
      return res.status(400).json({ success: false, error: "Candidate has already applied. Invitation cannot be resent." });
    }

    const policy = await getOrCreateReferralPolicy();
    const expiryDays = policy.invitationExpiryDays || 14;

    // Secure Token Rotation & Hashing
    const oldToken = referral.invitationToken || "";
    const previousTokenHash = crypto.createHash("sha256").update(oldToken).digest("hex");

    const newToken = crypto.randomBytes(32).toString("hex");
    const newExpiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    referral.invitationToken = newToken;
    referral.invitationExpiry = newExpiry;
    if (referral.status === "Expired") {
      referral.status = "Invited";
    }

    referral.resendHistory = referral.resendHistory || [];
    referral.resendHistory.push({
      resentAt: new Date(),
      resentBy: userId as any,
      previousTokenHash,
      newExpiry,
    });

    await referral.save();

    const frontendBaseUrl = (process.env.FRONTEND_URL || process.env.NGROK_URL || "http://localhost:5173").trim().replace(/\/$/, "");
    const applyLink = `${frontendBaseUrl}/referral/apply/${newToken}`;

    const referrerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "A colleague";

    let emailResult: any = null;
    try {
      emailResult = await sendReferralEmail(referral.candidateEmail, {
        companyName: "HRMS Portal",
        candidateName: referral.candidateName,
        referrerName,
        jobTitle: referral.jobId?.jobTitle || "Position",
        department: referral.jobId?.department || "General",
        location: referral.jobId?.officeLocation || "On-site",
        employmentType: referral.jobId?.employmentType || "Full-time",
        applicationDeadline: referral.jobId?.deadline ? new Date(referral.jobId.deadline).toLocaleDateString() : undefined,
        applyLink,
      });
    } catch (emailErr: any) {
      console.error("[ReferralResendEmailError]", emailErr.message);
    }

    await AuditLog.create({
      userId: userId || "Unknown",
      userName: req.user?.email || "User",
      userRole: userRole || "Employee",
      action: "REFERRAL_INVITATION_RESENT",
      module: "Referral",
      details: `Resent referral invitation to ${referral.candidateEmail}. Token rotated and old token invalidated (Hash stored).`,
      status: "Success",
    });

    res.json({
      success: true,
      message: `Referral invitation resent to ${referral.candidateEmail}. Token refreshed.`,
      emailSent: Boolean(emailResult?.success),
      applyLink,
      data: referral,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
