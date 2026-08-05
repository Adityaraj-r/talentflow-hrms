import { Response } from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import { AuthRequest } from "../middleware/auth.middleware";
import Referral from "../models/Referral.model";
import Job from "../models/job.model";
import Application from "../models/application.model";
import Employee from "../models/Employee.model";
import User from "../models/User.model";
import { sendReferralEmail } from "../utils/sendEmail";

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

    const user = await User.findById(userId).select("employeeId firstName lastName email");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    if (!employeeId) {
      return res.status(400).json({ success: false, error: "No employee profile found for logged-in user" });
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
        error: "Already applied for this role",
        message: "Already applied for this role",
      });
    }

    const refPhoneCondition = last10Phone
      ? [{ candidatePhone: { $regex: new RegExp(last10Phone) } }]
      : [];

    const existingRef = await Referral.findOne({
      jobId,
      status: { $in: ["Invited", "Applied"] },
      $or: [
        { candidateEmail: normEmail },
        ...refPhoneCondition,
      ],
    }).lean();

    if (existingRef) {
      return res.status(400).json({
        success: false,
        error: "Already referred for this role",
        message: "Already referred for this role",
      });
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

    const frontendBaseUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const applyLink = `${frontendBaseUrl}/careers/apply/${jobId}?referralToken=${invitationToken}`;

    const referrerName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "A colleague";

    let emailResult: any = null;
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

      if (!emailResult?.success) {
        console.warn("[ReferralEmailWarning] Email not sent:", emailResult?.reason);
      } else {
        console.log("[ReferralEmailSuccess] Invitation sent to:", normEmail);
      }
    } catch (emailErr: any) {
      console.error("[ReferralEmailError]", emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: emailResult?.success
        ? "Referral created and invitation email sent successfully"
        : `Referral created successfully. (Email notification status: ${emailResult?.reason || "Check SMTP configuration"})`,
      emailSent: Boolean(emailResult?.success),
      emailReason: emailResult?.reason,
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
      .populate("applicationId", "status currentRound")
      .sort({ createdAt: -1 })
      .lean();

    const safeReferrals = referrals.map((ref: any) => {
      let progress = "Application Pending";

      if (ref.status === "Cancelled") {
        progress = "Cancelled";
      } else if (ref.status === "Expired") {
        progress = "Expired";
      } else if (ref.applicationId) {
        const appStatus = (ref.applicationId.status || "").toLowerCase();
        if (appStatus === "applied" || appStatus === "new") {
          progress = "Application Received";
        } else if (appStatus === "shortlisted" || appStatus === "under review" || appStatus === "screening") {
          progress = "Under Review";
        } else if (appStatus.includes("interview") || appStatus === "interview scheduled") {
          progress = "Interview Process";
        } else if (appStatus === "selected" || appStatus === "offered") {
          progress = "Selected";
        } else if (appStatus === "hired" || appStatus === "joined") {
          progress = "Hired";
        } else if (appStatus === "rejected" || appStatus === "declined") {
          progress = "Not Selected";
        } else {
          progress = "Under Review";
        }
      }

      return {
        _id: ref._id,
        candidateName: ref.candidateName,
        candidateEmail: ref.candidateEmail,
        candidatePhone: ref.candidatePhone,
        jobTitle: ref.jobId?.jobTitle || "Job Position",
        department: ref.jobId?.department || "",
        location: ref.jobId?.officeLocation || "",
        referralDate: ref.createdAt,
        status: ref.status,
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

    const user = await User.findById(userId).select("employeeId email");
    let employeeId = user?.employeeId;
    if (!employeeId) {
      const emp = await Employee.findOne({ email: { $regex: new RegExp(`^${user?.email}$`, "i") } });
      employeeId = emp?._id;
    }

    const referral = await Referral.findOne({ _id: id, referredByEmployeeId: employeeId });
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    if (referral.status !== "Invited") {
      return res.status(400).json({ success: false, error: "Only pending invited referrals can be cancelled" });
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
    const token = (req.query.token || "").toString().trim();
    if (!token) {
      return res.status(400).json({ success: false, error: "Token parameter required" });
    }

    const referral = await Referral.findOne({ invitationToken: token })
      .populate("jobId")
      .populate("referredByEmployeeId", "name employeeCode email department");

    if (!referral) {
      return res.status(404).json({ success: false, error: "Invalid referral invitation link" });
    }

    if (referral.status === "Applied") {
      return res.status(400).json({ success: false, error: "This referral invitation has already been used" });
    }

    if (referral.status === "Cancelled") {
      return res.status(400).json({ success: false, error: "This referral invitation has been cancelled" });
    }

    if (new Date() > new Date(referral.invitationExpiry)) {
      referral.status = "Expired";
      await referral.save();
      return res.status(400).json({ success: false, error: "This referral invitation link has expired" });
    }

    res.json({
      success: true,
      data: {
        referralId: referral._id,
        jobId: referral.jobId?._id,
        candidateName: referral.candidateName,
        candidateEmail: referral.candidateEmail,
        candidatePhone: referral.candidatePhone,
        referredBy: referral.referredByEmployeeId
          ? {
              name: (referral.referredByEmployeeId as any).name,
              employeeCode: (referral.referredByEmployeeId as any).employeeCode,
            }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
