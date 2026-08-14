import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth.middleware";
import Referral from "../models/Referral.model";
import ReferralReward from "../models/ReferralReward.model";
import Application from "../models/application.model";
import Employee from "../models/Employee.model";
import Job from "../models/job.model";
import { getOrCreateReferralPolicy } from "../services/referral.service";
import { parseResumeText, getFallbackCandidateProfile } from "../services/aiResume.service";
import { matchResumeToJob } from "../services/aiJobMatching.service";

/**
 * Calculates Referral Quality Score for HR operational reporting.
 * Cold-start handling:
 * - 0 referrals: "Not Available"
 * - 1-2 referrals: "Limited Data"
 * - 3+ referrals: Calculated score (0-100) + rating
 */
export const calculateReferralQualityScore = (row: {
  totalReferrals: number;
  applied: number;
  inProcess: number;
  selected: number;
  hired: number;
}) => {
  const { totalReferrals, applied, inProcess, hired } = row;

  if (!totalReferrals || totalReferrals === 0) {
    return {
      status: "Not_Available",
      scoreText: "Not Available",
      reason: "No referrals submitted yet",
      score: null,
      rating: "N/A",
    };
  }

  if (totalReferrals < 3) {
    return {
      status: "Limited_Data",
      scoreText: "Limited Data",
      reason: "Fewer than 3 referrals available for reliable scoring",
      score: null,
      rating: "N/A",
    };
  }

  // Calculate weighted outcome score
  const appRate = applied / totalReferrals;
  const processRate = (inProcess + hired) / totalReferrals;
  const hireRate = hired / totalReferrals;

  let score = Math.round(appRate * 25 + processRate * 35 + hireRate * 40 * 2.5);
  score = Math.max(30, Math.min(100, score));

  let rating = "Moderate";
  if (score >= 85) rating = "Strong";
  else if (score >= 70) rating = "Good";
  else if (score < 50) rating = "Needs Improvement";

  return {
    status: "Calculated",
    scoreText: `${score}/100`,
    score,
    rating,
    reason: `Based on ${hired} hires out of ${totalReferrals} referrals`,
  };
};

/**
 * HR Operational Referral Performance Report (Not a competitive leaderboard).
 * Paginated report grouping referral counts & Referral Quality Score by employee.
 */
export const getEmployeePerformanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = "1",
      limit = "15",
      search = "",
      department = "all",
      jobId = "all",
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 15));
    const skipNum = (pageNum - 1) * limitNum;

    const matchQuery: any = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate as string);
    }
    if (jobId && jobId !== "all" && mongoose.Types.ObjectId.isValid(jobId as string)) {
      matchQuery.jobId = new mongoose.Types.ObjectId(jobId as string);
    }

    const aggregationPipeline: any[] = [
      { $match: matchQuery },
      {
        $group: {
          _id: "$referredByEmployeeId",
          totalReferrals: { $sum: 1 },
          applied: { $sum: { $cond: [{ $eq: ["$status", "Applied"] }, 1, 0] } },
          inProcess: { $sum: { $cond: [{ $eq: ["$status", "In Process"] }, 1, 0] } },
          selected: { $sum: { $cond: [{ $eq: ["$status", "Selected"] }, 1, 0] } },
          hired: { $sum: { $cond: [{ $eq: ["$status", "Successful"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ["$status", "Expired"] }, 1, 0] } },
          withdrawn: { $sum: { $cond: [{ $eq: ["$status", "Withdrawn"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: { path: "$employee", preserveNullAndEmptyArrays: true } },
    ];

    if (department && department !== "all") {
      aggregationPipeline.push({
        $match: { "employee.department": department },
      });
    }

    if (search && (search as string).trim()) {
      const q = (search as string).trim();
      aggregationPipeline.push({
        $match: {
          $or: [
            { "employee.firstName": { $regex: q, $options: "i" } },
            { "employee.lastName": { $regex: q, $options: "i" } },
            { "employee.email": { $regex: q, $options: "i" } },
            { "employee.employeeCode": { $regex: q, $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...aggregationPipeline, { $count: "total" }];
    const countResult = await Referral.aggregate(countPipeline);
    const totalRecords = countResult[0]?.total || 0;

    aggregationPipeline.push({ $sort: { totalReferrals: -1 } });
    aggregationPipeline.push({ $skip: skipNum });
    aggregationPipeline.push({ $limit: limitNum });

    const results = await Referral.aggregate(aggregationPipeline);

    const formattedData = results.map((row) => {
      const qualityScore = calculateReferralQualityScore({
        totalReferrals: row.totalReferrals,
        applied: row.applied,
        inProcess: row.inProcess,
        selected: row.selected,
        hired: row.hired,
      });

      return {
        employeeId: row._id,
        employeeName: row.employee
          ? `${row.employee.firstName || ""} ${row.employee.lastName || ""}`.trim()
          : "Unknown Employee",
        employeeCode: row.employee?.employeeCode || "N/A",
        department: row.employee?.department || "General",
        totalReferrals: row.totalReferrals,
        applied: row.applied,
        inProcess: row.inProcess,
        selected: row.selected,
        hired: row.hired,
        rejected: row.rejected,
        expired: row.expired,
        withdrawn: row.withdrawn,
        qualityScore,
      };
    });

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        totalRecords,
        currentPage: pageNum,
        totalPages: Math.ceil(totalRecords / limitNum),
        limit: limitNum,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AI Resume Parsing & Candidate Field Extraction Endpoint.
 * Parses raw text or resume input into structured candidate JSON with manual fallback.
 */
export const parseResumeEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { resumeText, jobId } = req.body;

    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return res.json({
        success: true,
        extracted: getFallbackCandidateProfile(),
        matchPreview: null,
        message: "No resume text provided. Manual entry mode enabled.",
      });
    }

    const extracted = parseResumeText(resumeText);

    let matchPreview = null;
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const job = await Job.findById(jobId).lean();
      if (job) {
        matchPreview = matchResumeToJob(
          extracted,
          (job as any).jobTitle || "",
          (job as any).description || (job as any).jobTitle || ""
        );
      }
    }

    res.json({
      success: true,
      extracted,
      matchPreview,
    });
  } catch (error: any) {
    console.error("[parseResumeEndpoint Error]:", error.message);
    res.json({
      success: true,
      extracted: getFallbackCandidateProfile(),
      matchPreview: null,
      message: "Automatic extraction temporarily unavailable. Manual entry enabled.",
    });
  }
};

/**
 * AI Resume ↔ Job Matching Endpoint.
 * Evaluates candidate resume against target job description and caches aiAnalysis on Referral.
 */
export const matchJobEndpoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resumeText, jobId } = req.body;

    const referral = await Referral.findById(id).populate("jobId");
    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral not found" });
    }

    const textToAnalyze = resumeText || referral.resumeText || referral.candidateName;
    const targetJob = referral.jobId as any;

    const extracted = parseResumeText(textToAnalyze);
    const matchResult = matchResumeToJob(
      extracted,
      targetJob?.jobTitle || "Position",
      targetJob?.description || targetJob?.jobTitle || ""
    );

    referral.resumeText = textToAnalyze;
    referral.aiAnalysis = {
      matchScore: matchResult.matchScore,
      skillsScore: matchResult.skillsScore,
      experienceScore: matchResult.experienceScore,
      roleRelevanceScore: matchResult.roleRelevanceScore,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      explanation: matchResult.explanation,
      analyzedAt: new Date(),
    };

    await referral.save();

    res.json({
      success: true,
      data: referral.aiAnalysis,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Advanced Referral Funnel Analytics with conversion percentages, status distribution, and 6-month trend.
 */
export const getAdvancedFunnelAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, department = "all" } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const referrals = await Referral.find(query)
      .populate("jobId", "department")
      .lean();

    const filteredReferrals = department && department !== "all"
      ? referrals.filter((r: any) => r.jobId?.department === department)
      : referrals;

    const totalReferrals = filteredReferrals.length;
    const applied = filteredReferrals.filter((r) => r.status === "Applied" || r.applicationId).length;
    const inProcess = filteredReferrals.filter((r) => r.status === "In Process").length;
    const selected = filteredReferrals.filter((r) => r.status === "Selected").length;
    const hired = filteredReferrals.filter((r) => r.status === "Successful").length;

    const expired = filteredReferrals.filter((r) => r.status === "Expired").length;
    const withdrawn = filteredReferrals.filter((r) => r.status === "Withdrawn").length;
    const rejected = filteredReferrals.filter((r) => r.status === "Rejected").length;

    const probationRewards = await ReferralReward.find({ isProbationCompleted: true }).select("referralId");
    const probationReferralIds = new Set(probationRewards.map((r: any) => String(r.referralId)));
    const probationPassed = filteredReferrals.filter((r) => probationReferralIds.has(String(r._id))).length;

    const referralToAppRate = totalReferrals > 0 ? ((applied / totalReferrals) * 100).toFixed(1) : "0.0";
    const appToProcessRate = applied > 0 ? (((inProcess + selected + hired) / applied) * 100).toFixed(1) : "0.0";
    const processToSelectRate = (inProcess + selected + hired) > 0 ? (((selected + hired) / (inProcess + selected + hired)) * 100).toFixed(1) : "0.0";
    const selectToHireRate = (selected + hired) > 0 ? ((hired / Math.max(1, selected + hired)) * 100).toFixed(1) : "0.0";
    const referralToHireRate = totalReferrals > 0 ? ((hired / totalReferrals) * 100).toFixed(1) : "0.0";

    // Build 6-Month Trend (Last 6 months)
    const monthlyTrend: Array<{ month: string; referrals: number; hires: number }> = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const mRefs = filteredReferrals.filter((r: any) => {
        const c = new Date(r.createdAt);
        return c >= startOfMonth && c <= endOfMonth;
      });

      const mHires = mRefs.filter((r: any) => r.status === "Successful").length;
      monthlyTrend.push({
        month: mLabel,
        referrals: mRefs.length,
        hires: mHires,
      });
    }

    res.json({
      success: true,
      data: {
        counts: {
          totalReferrals,
          applied,
          inProcess,
          selected,
          hired,
          rejected,
          expired,
          withdrawn,
          probationPassed,
        },
        conversionRates: {
          referralToAppRate: `${referralToAppRate}%`,
          appToProcessRate: `${appToProcessRate}%`,
          processToSelectRate: `${processToSelectRate}%`,
          selectToHireRate: `${selectToHireRate}%`,
          referralToHireRate: `${referralToHireRate}%`,
        },
        funnelStages: [
          { stage: "Referral", count: totalReferrals, percentage: "100%" },
          { stage: "Application", count: applied, percentage: `${referralToAppRate}%` },
          { stage: "Interview", count: inProcess + selected + hired, percentage: `${appToProcessRate}%` },
          { stage: "Selected", count: selected + hired, percentage: `${processToSelectRate}%` },
          { stage: "Hired", count: hired, percentage: `${referralToHireRate}%` },
          { stage: "Probation Passed", count: probationPassed, percentage: totalReferrals > 0 ? `${((probationPassed / totalReferrals) * 100).toFixed(1)}%` : "0.0%" },
        ],
        statusDistribution: [
          { status: "Applied", count: applied },
          { status: "In Process", count: inProcess },
          { status: "Selected", count: selected },
          { status: "Hired", count: hired },
          { status: "Rejected", count: rejected },
          { status: "Expired", count: expired },
          { status: "Withdrawn", count: withdrawn },
        ],
        monthlyTrend,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Job & Department Referral Analytics.
 */
export const getJobDepartmentAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const referrals = await Referral.find()
      .populate("jobId", "jobTitle department")
      .lean();

    const jobMap: Record<string, { jobTitle: string; department: string; referrals: number; hired: number }> = {};
    const deptMap: Record<string, { department: string; referrals: number; hired: number }> = {};

    for (const ref of referrals) {
      const job = ref.jobId as any;
      const jobTitle = job?.jobTitle || "General Opening";
      const dept = job?.department || "General";

      if (!jobMap[jobTitle]) {
        jobMap[jobTitle] = { jobTitle, department: dept, referrals: 0, hired: 0 };
      }
      jobMap[jobTitle].referrals += 1;
      if (ref.status === "Successful") {
        jobMap[jobTitle].hired += 1;
      }

      if (!deptMap[dept]) {
        deptMap[dept] = { department: dept, referrals: 0, hired: 0 };
      }
      deptMap[dept].referrals += 1;
      if (ref.status === "Successful") {
        deptMap[dept].hired += 1;
      }
    }

    const jobAnalytics = Object.values(jobMap).map((j) => ({
      ...j,
      hireRate: j.referrals > 0 ? `${((j.hired / j.referrals) * 100).toFixed(1)}%` : "0.0%",
    }));

    const deptAnalytics = Object.values(deptMap).map((d) => ({
      ...d,
      hireRate: d.referrals > 0 ? `${((d.hired / d.referrals) * 100).toFixed(1)}%` : "0.0%",
    }));

    res.json({
      success: true,
      data: {
        byJob: jobAnalytics.sort((a, b) => b.referrals - a.referrals),
        byDepartment: deptAnalytics.sort((a, b) => b.referrals - a.referrals),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Referral Review SLA Tracking Report.
 */
export const getSlaTrackingReport = async (req: AuthRequest, res: Response) => {
  try {
    const policy = await getOrCreateReferralPolicy();
    const slaHours = policy.reviewSlaHours || 48;
    const now = new Date();

    const referrals = await Referral.find({
      status: { $in: ["Invited", "Applied", "In Process"] },
    })
      .populate("jobId", "jobTitle department")
      .populate("referredByEmployeeId", "firstName lastName email department employeeCode")
      .sort({ createdAt: -1 })
      .lean();

    let pending24h = 0;
    let pending48h = 0;
    let slaBreached = 0;
    let reviewed = 0;

    const items = referrals.map((ref: any) => {
      const created = new Date(ref.createdAt);
      const elapsedHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

      let slaStatus: "Pending_24h" | "Pending_48h" | "SLA_Breached" | "Reviewed" = "Pending_24h";

      if (ref.firstReviewedAt || (ref.status !== "Invited" && ref.status !== "Applied")) {
        slaStatus = "Reviewed";
        reviewed++;
      } else if (elapsedHours > slaHours) {
        slaStatus = "SLA_Breached";
        slaBreached++;
      } else if (elapsedHours > 24) {
        slaStatus = "Pending_48h";
        pending48h++;
      } else {
        pending24h++;
      }

      return {
        _id: ref._id,
        candidateName: ref.candidateName,
        candidateEmail: ref.candidateEmail,
        jobTitle: ref.jobId?.jobTitle || "Job Opening",
        department: ref.jobId?.department || "General",
        referredBy: ref.referredByEmployeeId
          ? `${ref.referredByEmployeeId.firstName || ""} ${ref.referredByEmployeeId.lastName || ""}`.trim()
          : "Employee",
        submittedAt: ref.createdAt,
        elapsedHours: Math.round(elapsedHours),
        slaThresholdHours: slaHours,
        slaStatus,
        firstReviewedAt: ref.firstReviewedAt || null,
      };
    });

    res.json({
      success: true,
      data: {
        slaHoursConfigured: slaHours,
        summary: {
          pending24h,
          pending48h,
          slaBreached,
          reviewed,
          totalTracked: referrals.length,
        },
        items,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HR Read-only Unified Referral Timeline View.
 */
export const getReferralTimeline = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const referral = await Referral.findById(id)
      .populate("jobId")
      .populate("referredByEmployeeId", "firstName lastName email department employeeCode")
      .populate("applicationId")
      .populate("rewardId")
      .lean();

    if (!referral) {
      return res.status(404).json({ success: false, error: "Referral record not found" });
    }

    const timeline: any[] = [];

    timeline.push({
      timestamp: referral.createdAt,
      stage: "Referral Submitted",
      title: "Referral Invitation Created",
      description: `Referred by ${(referral.referredByEmployeeId as any)?.firstName || "Employee"} ${(referral.referredByEmployeeId as any)?.lastName || ""}`,
      actor: `${(referral.referredByEmployeeId as any)?.firstName || "Employee"}`,
      type: "referral",
    });

    if (Array.isArray(referral.resendHistory)) {
      referral.resendHistory.forEach((r: any) => {
        timeline.push({
          timestamp: r.resentAt,
          stage: "Invitation Resent",
          title: "Referral Invitation Resent",
          description: `Invitation link regenerated & email dispatched. New expiry: ${new Date(r.newExpiry).toLocaleDateString()}`,
          actor: "User / HR",
          type: "referral",
        });
      });
    }

    const app = referral.applicationId as any;
    if (app) {
      timeline.push({
        timestamp: app.createdAt || referral.updatedAt,
        stage: "Candidate Applied",
        title: "Candidate Application Submitted",
        description: `Candidate ${app.name || referral.candidateName} completed the job application form.`,
        actor: app.name || "Candidate",
        type: "application",
      });

      if (app.workflowState?.stageHistory?.length) {
        app.workflowState.stageHistory.forEach((stg: any) => {
          timeline.push({
            timestamp: stg.enteredAt || stg.completedAt,
            stage: stg.stageName || "ATS Stage",
            title: `ATS Stage: ${stg.stageName}`,
            description: stg.notes || `Candidate progressed to ${stg.stageName}`,
            actor: "Recruiting Team",
            type: "ats",
          });
        });
      }

      if (app.interviewDetails?.date) {
        timeline.push({
          timestamp: app.interviewDetails.date,
          stage: "Interview Scheduled",
          title: `Interview (${app.interviewDetails.mode || "Online"})`,
          description: `Scheduled interview on ${app.interviewDetails.date} ${app.interviewDetails.startTime || ""}`,
          actor: "HR / Interviewer",
          type: "interview",
        });
      }

      if (app.status === "Selected" || app.status === "Hired" || app.status === "Joined") {
        timeline.push({
          timestamp: app.updatedAt,
          stage: "Candidate Selected/Hired",
          title: `Candidate ${app.status}`,
          description: `Candidate was successfully ${app.status.toLowerCase()} for ${referral.jobId?.jobTitle || "the position"}.`,
          actor: "Hiring Manager",
          type: "hiring",
        });
      }
    }

    const reward = referral.rewardId as any;
    if (reward) {
      timeline.push({
        timestamp: reward.createdAt,
        stage: "Reward Logged",
        title: "Referral Bonus Logged (Pending Probation)",
        description: `Referral bonus of ${reward.currency || "INR"} ${reward.bonusAmount} created with ${reward.probationDays || 90} days probation.`,
        actor: "System Auto-Trigger",
        type: "reward",
      });

      if (reward.isProbationCompleted) {
        timeline.push({
          timestamp: reward.updatedAt,
          stage: "Probation Completed",
          title: "Probation Completed - Eligible for Bonus",
          description: `Candidate successfully completed probation. Reward status updated to Eligible.`,
          actor: "Automated Probation Cron",
          type: "reward",
        });
      }

      if (reward.approvedByHR?.approvedAt) {
        timeline.push({
          timestamp: reward.approvedByHR.approvedAt,
          stage: "HR Approved",
          title: "HR Bonus Approval Granted",
          description: "HR Manager authorized referral bonus eligibility.",
          actor: "HR Manager",
          type: "reward",
        });
      }

      if (reward.approvedByFinance?.approvedAt) {
        timeline.push({
          timestamp: reward.approvedByFinance.approvedAt,
          stage: "Finance Approved",
          title: "Finance Released & Linked to Payroll",
          description: `Assigned to payroll period ${reward.payrollPeriod?.month}/${reward.payrollPeriod?.year}. Status: ${reward.rewardStatus}`,
          actor: "Finance Manager",
          type: "reward",
        });
      }
    }

    timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    res.json({
      success: true,
      data: {
        referralId: referral._id,
        candidateName: referral.candidateName,
        candidateEmail: referral.candidateEmail,
        jobTitle: referral.jobId?.jobTitle || "Position",
        department: referral.jobId?.department || "General",
        referredBy: (referral.referredByEmployeeId as any)?.firstName
          ? `${(referral.referredByEmployeeId as any).firstName} ${(referral.referredByEmployeeId as any).lastName || ""}`.trim()
          : "Employee",
        currentReferralStatus: referral.status,
        rewardStatus: reward?.rewardStatus || "Not Created",
        aiAnalysis: referral.aiAnalysis || null,
        timeline,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * HR Employee Referral Detail Endpoint.
 * Returns employee KPI breakdown, calculated Referral Quality Score, and paginated referral history.
 */
export const getEmployeeReferralDetail = async (req: AuthRequest, res: Response) => {
  try {
    const empIdStr = (Array.isArray(req.params.employeeId) ? req.params.employeeId[0] : req.params.employeeId || "").toString();
    const { page = "1", limit = "10" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skipNum = (pageNum - 1) * limitNum;

    if (!empIdStr || !mongoose.Types.ObjectId.isValid(empIdStr)) {
      return res.status(400).json({ success: false, error: "Invalid employee ID" });
    }

    const employeeId = new mongoose.Types.ObjectId(empIdStr);

    const employee = await Employee.findById(employeeId).select("firstName lastName email employeeCode department designation").lean();
    if (!employee) {
      return res.status(404).json({ success: false, error: "Employee record not found" });
    }

    const totalReferrals = await Referral.countDocuments({ referredByEmployeeId: employeeId });
    const applied = await Referral.countDocuments({ referredByEmployeeId: employeeId, $or: [{ status: "Applied" }, { applicationId: { $ne: null } }] });
    const inProcess = await Referral.countDocuments({ referredByEmployeeId: employeeId, status: "In Process" });
    const selected = await Referral.countDocuments({ referredByEmployeeId: employeeId, status: "Selected" });
    const hired = await Referral.countDocuments({ referredByEmployeeId: employeeId, status: "Successful" });
    const rejected = await Referral.countDocuments({ referredByEmployeeId: employeeId, status: "Rejected" });

    const rewards = await ReferralReward.find({ employeeId, isProbationCompleted: true }).select("_id");
    const probationPassed = rewards.length;

    const qualityScore = calculateReferralQualityScore({
      totalReferrals,
      applied,
      inProcess,
      selected,
      hired,
    });

    const referrals = await Referral.find({ referredByEmployeeId: employeeId })
      .populate("jobId", "jobTitle department officeLocation employmentType")
      .populate("applicationId", "status currentRound")
      .populate("rewardId", "rewardStatus bonusAmount currency isProbationCompleted")
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    res.json({
      success: true,
      data: {
        employeeInfo: {
          _id: employee._id,
          employeeName: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
          employeeCode: employee.employeeCode || "N/A",
          department: employee.department || "General",
          email: employee.email,
          designation: employee.designation || "",
        },
        kpis: {
          totalReferrals,
          applied,
          inProcess,
          selected,
          hired,
          rejected,
          probationPassed,
        },
        qualityScore,
        referrals,
        pagination: {
          totalRecords: totalReferrals,
          currentPage: pageNum,
          totalPages: Math.ceil(totalReferrals / limitNum),
          limit: limitNum,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
