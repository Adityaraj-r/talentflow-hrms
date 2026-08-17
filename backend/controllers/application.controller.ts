import { Request, Response } from "express"
import mongoose from "mongoose"
import Application from "../models/application.model"
import Job from "../models/job.model"
import Task from "../models/task.model"
import Employee from "../models/Employee.model"
import User from "../models/User.model"
import Offer from "../models/Offer.model"
import Referral from "../models/Referral.model"
import { getHrSenderEmail, sendInterviewScheduleEmail } from "../utils/sendEmail"
import { sendApplicationStatusEmail } from "../utils/sendEmail";
import { calculateResumeFit } from "../utils/resumeFit"
import { WorkflowEngine } from '../services/workflowEngine';
import { notifyReferralApplied } from "../services/notification.service";

const selectedStatuses = ["selected", "hired"];

const recomputeHiringProgress = async (jobId?: any) => {
  if (!jobId || !mongoose.Types.ObjectId.isValid(String(jobId))) return;

  const job: any = await Job.findById(jobId);
  if (!job || !Array.isArray(job.hiringRoles) || job.hiringRoles.length === 0) return;

  const selectedApplications = await Application.find({
    jobId,
    status: { $in: ["Selected", "Hired"] },
  }).lean();

  job.hiringRoles.forEach((role: any) => {
    const roleId = String(role._id);
    const filled = selectedApplications.filter((application: any) =>
      String(application.hiringRoleId || "") === roleId ||
      (!application.hiringRoleId && application.hiringRoleName && application.hiringRoleName === role.roleName)
    ).length;
    role.filled = Math.min(Number(role.openings) || 0, filled);
    role.status = role.filled >= (Number(role.openings) || 0) ? "Closed" : "Open";
  });

  const allRolesClosed = job.hiringRoles.every((role: any) => role.status === "Closed");
  if (allRolesClosed && job.hiringRoles.length > 0) {
    job.status = "Closed";
    job.autoClosedByHiringProgress = true;
  } else if (job.status === "Closed" && job.autoClosedByHiringProgress) {
    job.status = "Published";
    job.autoClosedByHiringProgress = false;
  }

  await job.save();
};

export const applyJob = async (req: Request, res: Response) => {

  try {

    const { 
      jobId, 
      hiringRoleId, 
      name, 
      email, 
      phone,
      currentLocation,
      yearsOfExperience,
      currentCompany,
      currentCtc,
      expectedCtc,
      noticePeriod,
      linkedin,
      portfolio,
      coverLetter,
      currentDesignation,
      highestEducation,
      employmentTypePreference,
      githubProfile,
      referralToken
    } = req.body

    const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } | undefined
    const resume = files?.resume?.[0]?.filename || (req as any).file?.filename
    const additionalDocuments = files?.additionalDocuments?.[0]?.filename
    const job = jobId && mongoose.Types.ObjectId.isValid(jobId)
      ? await Job.findById(jobId).lean()
      : null

    if (job && job.deadline) {
      const d = new Date(job.deadline);
      d.setHours(23, 59, 59, 999);
      if (new Date() > d) {
        res.status(400).json({
          success: false,
          message: "Applications for this position are closed because the deadline has passed."
        });
        return;
      }
    }

    const normEmail = (email || "").trim().toLowerCase();
    const normPhone = (phone || "").trim().toLowerCase();

    // Job-specific duplicate check
    if (jobId && normEmail) {
      const existingApplication = await Application.findOne({
        jobId,
        $or: [
          { email: { $regex: new RegExp(`^${normEmail}$`, "i") } },
          ...(normPhone ? [{ phone: { $regex: new RegExp(`^${normPhone}$`, "i") } }] : []),
        ],
      }).lean();

      if (existingApplication) {
        res.status(400).json({
          success: false,
          message: "You have already submitted an application for this position.",
        });
        return;
      }
    }

    // Resolve Referral Record if Token provided or candidate was referred
    let referralRecord: any = null;
    if (referralToken) {
      referralRecord = await Referral.findOne({ invitationToken: String(referralToken).trim() });
    }
    if (!referralRecord && jobId && normEmail) {
      referralRecord = await Referral.findOne({
        jobId,
        status: "Invited",
        $or: [
          { candidateEmail: normEmail },
          ...(normPhone ? [{ candidatePhone: normPhone }] : []),
        ],
      });
    }

    const applicationSource = referralRecord ? "Employee Referral" : "Career Portal";
    const referralId = referralRecord ? referralRecord._id : null;
    const referredByEmployeeId = referralRecord ? referralRecord.referredByEmployeeId : null;

    const hiringRole = Array.isArray((job as any)?.hiringRoles)
      ? (job as any).hiringRoles.find((role: any) => String(role._id) === String(hiringRoleId))
      : null

    if (Array.isArray((job as any)?.hiringRoles) && (job as any).hiringRoles.length > 0 && !hiringRole) {
      res.status(400).json({
        success: false,
        message: "A valid hiring role is required for this job opening",
      })
      return
    }

    const fit = await calculateResumeFit({
      resume,
      candidateName: name,
      candidateEmail: email,
      job: job as any,
    })

    const application = await Application.create({
      jobId,
      hiringRoleId: hiringRole ? String((hiringRole as any)._id) : "",
      hiringRoleName: hiringRole ? (hiringRole as any).roleName : "",
      selectedPositionId: hiringRole ? String((hiringRole as any)._id) : "",
      selectedPositionTitle: hiringRole ? (hiringRole as any).roleName : "",
      name,
      email,
      phone,
      currentLocation,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : 0,
      currentCompany,
      currentCtc,
      expectedCtc,
      noticePeriod,
      linkedin,
      portfolio,
      coverLetter,
      resume,
      currentDesignation,
      highestEducation,
      employmentTypePreference,
      githubProfile,
      additionalDocuments,
      source: applicationSource,
      referralId,
      referredByEmployeeId,
      ...fit,
    })

    if (referralRecord) {
      referralRecord.status = "Applied";
      referralRecord.applicationId = application._id;
      await referralRecord.save();
      await notifyReferralApplied(
        referralRecord._id.toString(),
        application._id.toString(),
        referralRecord.referredByEmployeeId,
        name,
        (job as any)?.jobTitle || "the position"
      );
    }

    // Initialize workflow state if job has workflow configured
    const jobRecord = await Job.findById(application.jobId);
    if (jobRecord && (jobRecord as any).workflow?.stages?.length > 0) {
      WorkflowEngine.initializeWorkflow(jobRecord, application);
      await application.save();
    }

    res.status(201).json(application)

  } catch (error:any) {

    res.status(400).json({
      success:false,
      message:error.message
    })

  }

}

export const getApplications = async (req: Request, res: Response) => {

  try {

    const applications = await Application
      .find()
      .populate("jobId")
      .populate("referredByEmployeeId", "name employeeCode email department designation") 

    await Promise.all(
      applications.map(async (application: any) => {
        const needsFitRefresh =
          !Number(application.aiFitScore) ||
          !application.aiRecommendationLabel ||
          !Number(application.resumeQualityScore) ||
          !application.suggestedNextAction ||
          ["Interview", "Screening", "Review"].includes(String(application.recommendationStage || "")) ||
          (
            ["Interview", "Offer", "Hired", "Selected"].includes(String(application.status || "")) &&
            Number(application.matchScore || application.aiFitScore || 0) < 60
          )

        if (!needsFitRefresh) return

        const fit = await calculateResumeFit({
          resume: application.resume,
          candidateName: application.name,
          candidateEmail: application.email,
          job: application.jobId,
          status: application.status,
        })
        Object.assign(application, fit)
        await application.save()
      })
    )

    const ranked = [...applications].sort((a: any, b: any) => {
      const scoreDelta = Number(b.aiFitScore || b.matchScore || 0) - Number(a.aiFitScore || a.matchScore || 0)
      if (scoreDelta) return scoreDelta
      const experienceDelta = Number(b.experienceScore || 0) - Number(a.experienceScore || 0)
      if (experienceDelta) return experienceDelta
      return Number(b.skillsScore || 0) - Number(a.skillsScore || 0)
    })

    await Promise.all(
      ranked.map(async (application: any, index) => {
        const nextRank = index + 1
        if (application.aiRank === nextRank) return
        application.aiRank = nextRank
        await application.save()
      })
    )

    res.json(ranked)

  } catch (error:any) {

    res.status(500).json({
      success:false,
      message:error.message
    })

  }

}

export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("jobId")
      .populate("referredByEmployeeId", "name employeeCode email department designation")
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" })
      return
    }
    res.json(application)
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const application = await Application.findById(req.params.id)
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" })
      return
    }

    const beforeStatus = application.status;
    if (status) {
      application.status = status;
    }

    if (req.body.assignmentStatus !== undefined) {
      (application as any).assignmentStatus = req.body.assignmentStatus;
      (application as any).assignmentCleared = req.body.assignmentStatus === "Cleared";
    }
    if (req.body.assignmentCleared !== undefined) {
      (application as any).assignmentCleared = Boolean(req.body.assignmentCleared);
      (application as any).assignmentStatus = req.body.assignmentCleared ? "Cleared" : "Pending";
    }
    if (req.body.currentRound !== undefined) {
      (application as any).currentRound = req.body.currentRound;
    }
    if (req.body.currentRoundIndex !== undefined) {
      (application as any).currentRoundIndex = Number(req.body.currentRoundIndex);
    }

    // Automations:
    if (status === "HR Screening" && !application.taskId) {
      const newTask = await Task.create({
        title: `HR Screening: ${application.name}`,
        description: `Conduct initial HR screening call for position ${application.selectedPositionTitle || "Position"}.`,
        assignedTo: (req as any).user?.id || (application as any).createdBy || (req as any).user?.id,
        assignedBy: (req as any).user?.id || (req as any).user?.id,
        createdBy: (req as any).user?.id || (req as any).user?.id,
        status: "TO_DO",
        priority: "MEDIUM",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      });
      application.taskId = newTask._id as any;
    }

    if (status === "Approved" || status === "Selected") {
      application.set('offerEnabled', true);

      try {
        const existingOffer = await Offer.findOne({
          $or: [
            { candidateId: application._id },
            ...(application.email ? [{ candidateEmail: application.email }] : [])
          ]
        });

        if (!existingOffer) {
          const defaultSalary = application.expectedCtc ? Number(application.expectedCtc) : (application.currentCtc ? Number(application.currentCtc) : 500000);
          const joining = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const pos = application.selectedPositionTitle || application.hiringRoleName || "Position";

          let dept = "General";
          let jobCode = "";
          if (application.jobId) {
            const job = await Job.findById(application.jobId).lean();
            if (job) {
              if ((job as any).department) dept = (job as any).department;
              if ((job as any).jobCode) jobCode = (job as any).jobCode;
            }
          }

          const offerId = `OFF-${Date.now()}`;
          const userId = (req as any).user?.id || (req as any).user?._id || new mongoose.Types.ObjectId();

          await Offer.create({
            offerId,
            candidateId: application._id,
            jobId: application.jobId,
            jobCode: jobCode,
            candidateEmail: application.email || "",
            candidateName: application.name || "Candidate",
            position: pos,
            department: dept,
            salary: defaultSalary > 0 ? defaultSalary : 500000,
            joiningDate: joining,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: "Offered",
            approvalStage: "Approved",
            createdBy: userId,
            compensation: {
              fixedSalary: defaultSalary > 0 ? defaultSalary : 500000,
              bonus: Math.round((defaultSalary > 0 ? defaultSalary : 500000) * 0.1),
              allowances: Math.round((defaultSalary > 0 ? defaultSalary : 500000) * 0.12),
              benefitsValue: Math.round((defaultSalary > 0 ? defaultSalary : 500000) * 0.06),
              joiningBonus: 0,
              stockOptions: 0,
              totalCtc: (defaultSalary > 0 ? defaultSalary : 500000) * 1.28
            }
          });
        }
      } catch (offerErr) {
        console.error("Failed to auto-create offer record for selected candidate:", offerErr);
      }
    }

    if (status === "Offer Accepted") {
      application.status = "Background Verification";
      application.set('backgroundVerification', {
        status: "In Progress",
        initiatedAt: new Date(),
        checks: {
          identity: "Pending",
          education: "Pending",
          employment: "Pending",
          criminal: "Pending"
        }
      });
    }

    await application.save()

    const beforeWasSelected = selectedStatuses.includes(String(beforeStatus || "").toLowerCase())
    const afterIsSelected = selectedStatuses.includes(String(status || "").toLowerCase())
    if (beforeWasSelected !== afterIsSelected) {
      await recomputeHiringProgress(application.jobId)
    }

    // ✅ EMAIL TRIGGER (NEW ADD)
    if (["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"].includes(status)) {
      let positionTitle = application.selectedPositionTitle 
        || (application as any).positionTitle 
        || (application as any).selectedPositionName;
      if (!positionTitle && application.jobId) {
        const job = await mongoose.model('Job').findById(application.jobId);
        positionTitle = job ? (job as any).jobTitle : '';
      }
      await sendApplicationStatusEmail(
        application.email,
        application.name,
        status,
        positionTitle || 'the position'
      )
    }

    // Task Cancellation
    if (["Rejected", "Cancelled"].includes(status)) {
      if (application.taskId) {
        await Task.findByIdAndDelete(application.taskId);
        application.taskId = null;
        await application.save();
      }
    }

    res.json(application)
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
}
/** Public lookup: requires matching email query so addresses cannot be enumerated alone. */
export const getPublicApplicationStatus = async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id
    const idParam = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : ""
    const emailQ = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : ""

    if (!emailQ || !idParam || !mongoose.Types.ObjectId.isValid(idParam)) {
      res.status(400).json({
        success: false,
        message: "Valid application ID and email query are required",
      })
      return
    }

    const application = await Application.findById(idParam).populate("jobId")
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" })
      return
    }

    const appEmail = String((application as any).email || "")
      .trim()
      .toLowerCase()
    if (appEmail !== emailQ) {
      res.status(404).json({ success: false, message: "Application not found" })
      return
    }

    res.json([application])
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const scheduleInterviewAndSendMail = async (req: Request, res: Response) => {
  try {
    const {
      interviewDate,
      startTime,
      endTime,
      mode,
      location = "",
      meetingLink = "",
      interviewers = [],
      instructions = [],
    } = req.body

    if (!interviewDate || !startTime || !endTime || !mode) {
      res.status(400).json({ success: false, message: "interviewDate, startTime, endTime and mode are required" })
      return
    }
    const normalizedMode =
      String(mode).toLowerCase() === "inperson" ? "Offline" : String(mode)

    if (normalizedMode !== "Online" && normalizedMode !== "Offline") {
      res.status(400).json({ success: false, message: "mode must be Online or Offline" })
      return
    }

    const application = await Application.findById(req.params.id).populate("jobId")
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" })
      return
    }

    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ success: false, message: "Unauthorized: User not found in request" });
      return;
    }

    const hrName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "HR Team"
    const configuredSenderEmail = await getHrSenderEmail()
    const hrEmail = user.email || configuredSenderEmail || ""
    const hrPhone = user.phoneNumber || ""

    const jobTitle = (application as any)?.selectedPositionTitle
      || (application as any)?.positionTitle
      || (application as any)?.selectedPositionName
      || (application as any)?.jobId?.jobTitle
      || "Position"
    const department = (application as any)?.jobId?.department || "General"

    const payload = {
      candidateName: (application as any).name || "",
      jobTitle,
      department,
      interviewDate: String(interviewDate),
      startTime: String(startTime),
      endTime: String(endTime),
      mode: normalizedMode as "Online" | "Offline",
      location: String(location),
      meetingLink: String(meetingLink),
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      instructions: Array.isArray(instructions)
        ? instructions.map((x: any) => String(x)).filter(Boolean)
        : [],
      hrContact: {
        name: hrName,
        email: hrEmail,
        phone: hrPhone,
      },
    } as const

    const mailResult = await sendInterviewScheduleEmail((application as any).email, payload as any)

    const appDoc: any = application

    // Prevent duplicate interviews
    if (
      appDoc.interviewDetails &&
      appDoc.interviewDetails.date === payload.interviewDate &&
      appDoc.interviewDetails.startTime === payload.startTime
    ) {
      res.status(400).json({ success: false, message: "An interview is already scheduled for this candidate at this exact date and time." })
      return
    }

    if (appDoc.status !== "Interview") {
      appDoc.status = "Interview"
    }

    if (interviewers.length > 0 && interviewers[0].id) {
      const empId = interviewers[0].id;
      const employeeQuery = mongoose.Types.ObjectId.isValid(empId) ? { _id: empId } : { employeeCode: empId };
      const employee = await Employee.findOne(employeeQuery);
      
      if (employee && employee.userId) {
        const description = `Interview scheduled with candidate.`;
        const interviewerName = interviewers.length > 0 && interviewers[0].name 
          ? interviewers[0].name 
          : employee.firstName + " " + (employee.lastName || "");
          
        const interviewDetailsForTask = {
          candidateName: payload.candidateName,
          interviewerName: interviewerName.trim(),
          interviewDate: payload.interviewDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          mode: payload.mode,
          meetingLink: payload.mode === 'Online' ? payload.meetingLink : 'N/A',
          instructions: payload.instructions,
          interviewStatus: "Upcoming",
          applicationId: appDoc._id,
          resume: appDoc.resume,
          candidateEmail: appDoc.email,
          candidatePhone: appDoc.phone,
          jobTitle,
          department
        };

        if (appDoc.taskId) {
          await Task.findByIdAndUpdate(appDoc.taskId, {
            title: `Interview: ${payload.candidateName}`,
            description,
            dueDate: new Date(payload.interviewDate),
            assignedTo: employee.userId,
            assignedBy: user.id,
            interviewDetails: interviewDetailsForTask
          });
        } else {
          const newTask = await Task.create({
            title: `Interview: ${payload.candidateName}`,
            description,
            assignedTo: employee.userId,
            assignedBy: user.id,
            createdBy: user.id,
            status: "TO_DO",
            priority: "HIGH",
            dueDate: new Date(payload.interviewDate),
            interviewDetails: interviewDetailsForTask
          });
          appDoc.taskId = newTask._id;
        }

        // Save interview details in the database natively
        appDoc.interviewDetails = {
          interviewerId: employee._id,
          date: payload.interviewDate,
          startTime: payload.startTime,
          endTime: payload.endTime,
          mode: payload.mode,
          meetingLink: payload.mode === 'Online' ? payload.meetingLink : "",
          location: payload.mode === 'Offline' ? payload.location : "",
          instructions: payload.instructions,
          status: "Upcoming"
        }
      }
    }

    await appDoc.save()

    res.status(200).json({
      success: true,
      message: mailResult?.sent
        ? "Interview scheduled and email sent"
        : "Interview scheduled, but email could not be sent",
      data: {
        ...payload,
        emailDelivery: mailResult?.sent ? "sent" : "failed",
        emailReason: mailResult?.reason || null,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to schedule interview and send email",
    })
  }
}

export const evaluateCandidate = async (req: Request, res: Response) => {
  try {
    const { round, rating, feedback, recommendation } = req.body;
    const user = (req as any).user;

    if (!round || !rating || !recommendation) {
      res.status(400).json({ success: false, message: "round, rating, and recommendation are required" });
      return;
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" });
      return;
    }

    const appDoc: any = application;
    appDoc.interviewEvaluations = appDoc.interviewEvaluations || [];
    appDoc.interviewEvaluations.push({
      round,
      interviewerId: user?.id,
      interviewerName: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Interviewer",
      rating: Number(rating),
      feedback: String(feedback || ""),
      recommendation,
      evaluatedAt: new Date()
    });

    await appDoc.save();
    res.status(200).json({ success: true, data: appDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to submit evaluation" });
  }
};

export const updateBgvDetails = async (req: Request, res: Response) => {
  try {
    const { checks, notes, status } = req.body;
    const user = (req as any).user;

    const application = await Application.findById(req.params.id);
    if (!application) {
      res.status(404).json({ success: false, message: "Application not found" });
      return;
    }

    const appDoc: any = application;
    if (!appDoc.backgroundVerification) {
      appDoc.backgroundVerification = { status: "Pending", checks: { identity: "Pending", education: "Pending", employment: "Pending", criminal: "Pending" } };
    }

    if (checks) {
      if (checks.identity) appDoc.backgroundVerification.checks.identity = checks.identity;
      if (checks.education) appDoc.backgroundVerification.checks.education = checks.education;
      if (checks.employment) appDoc.backgroundVerification.checks.employment = checks.employment;
      if (checks.criminal) appDoc.backgroundVerification.checks.criminal = checks.criminal;
    }

    if (notes) {
      appDoc.backgroundVerification.notes = notes;
    }

    if (status) {
      appDoc.backgroundVerification.status = status;
    } else {
      // Auto-compute status if all sub-checks are passed
      const ch = appDoc.backgroundVerification.checks;
      if (ch.identity === "Passed" && ch.education === "Passed" && ch.employment === "Passed" && ch.criminal === "Passed") {
        appDoc.backgroundVerification.status = "Passed";
      } else if (ch.identity === "Failed" || ch.education === "Failed" || ch.employment === "Failed" || ch.criminal === "Failed") {
        appDoc.backgroundVerification.status = "Failed";
      }
    }

    // Add audit history
    appDoc.bgvHistory = appDoc.bgvHistory || [];
    appDoc.bgvHistory.push({
      updatedBy: user?.id,
      notes: `BGV status updated: ${appDoc.backgroundVerification.status}. Notes: ${notes || "No notes."}`,
      timestamp: new Date()
    });

    if (appDoc.backgroundVerification.status === "Passed") {
      appDoc.backgroundVerification.completedAt = new Date();
      appDoc.backgroundVerification.verifiedBy = user?.id;

      // Auto Handover to Document Collection & Onboarding
      // Check if employee already exists
      const existingEmployee = await Employee.findOne({ email: appDoc.email });
      if (!existingEmployee) {
        // Auto-generate EMP Code
        const lastEmployee = await Employee.findOne({
          employeeCode: { $regex: /^EMP-\d+/ }
        }).sort({ createdAt: -1 });

        let newEmployeeCode = "EMP-0001";
        if (lastEmployee && lastEmployee.employeeCode) {
          const lastIdParts = lastEmployee.employeeCode.split('-');
          if (lastIdParts.length === 2) {
            const lastNumber = parseInt(lastIdParts[1], 10);
            if (!isNaN(lastNumber)) {
              newEmployeeCode = `EMP-${(lastNumber + 1).toString().padStart(4, '0')}`;
            }
          }
        }

        const nameParts = (appDoc.name || "").trim().split(" ");
        const firstName = nameParts[0] || "Candidate";
        const lastName = nameParts.slice(1).join(" ") || "";

        await Employee.create({
          firstName,
          lastName,
          email: appDoc.email.toLowerCase().trim(),
          phoneNumber: appDoc.phone,
          employeeCode: newEmployeeCode,
          department: appDoc.selectedPositionTitle || appDoc.hiringRoleName || "Engineering",
          designation: appDoc.selectedPositionTitle || appDoc.hiringRoleName || "Associate",
          status: "Inactive",
          onboardingStatus: "Personal",
          gender: "Male",
          Documents: {
            resumePath: appDoc.resume
          }
        });
      }

      appDoc.status = "Hired";
    }

    await appDoc.save();
    res.status(200).json({ success: true, data: appDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update BGV details" });
  }
};

export const advanceApplication = async (req: Request, res: Response) => {
  try {
    const { score, notes } = req.body;
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const job = application.jobId;
    if (!job || !(job as any).workflow?.stages?.length) {
      return res.status(400).json({ success: false, message: 'Job has no workflow configured' });
    }
    const result = WorkflowEngine.advanceCandidate(job, application, { score: Number(score) || 0, notes: notes || '' });
    if (!result.advanced) {
      return res.status(400).json({ success: false, message: 'Cannot advance from current stage' });
    }
    await application.save();
    res.json({ success: true, data: application, newStage: result.newStage, isComplete: result.isComplete });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getApplicationWorkflowStatus = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const job = application.jobId;
    if (!job || !(job as any).workflow?.stages?.length) {
      return res.json({ success: true, data: { hasWorkflow: false } });
    }
    const progress = WorkflowEngine.getWorkflowProgress(job, application);
    const currentStage = WorkflowEngine.getCurrentStage(job, application);
    const nextStage = WorkflowEngine.getNextStage(job, application);
    const activeStages = WorkflowEngine.getActiveStages(job);
    res.json({
      success: true,
      data: {
        hasWorkflow: true,
        progress,
        currentStage,
        nextStage,
        activeStages,
        workflowState: (application as any).workflowState,
        scoringFormula: (job as any).workflow.scoringFormula,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
