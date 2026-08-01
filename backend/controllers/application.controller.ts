import { Request, Response } from "express"
import mongoose from "mongoose"
import Application from "../models/application.model"
import Job from "../models/job.model"
import Task from "../models/task.model"
import Employee from "../models/Employee.model"
import { getHrSenderEmail, sendInterviewScheduleEmail } from "../utils/sendEmail"
import { sendApplicationStatusEmail } from "../utils/sendEmail";
import { calculateResumeFit } from "../utils/resumeFit"

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
      githubProfile
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
      ...fit,
    })

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

export const updateApplicationStatus = async (req: Request, res: Response) => {

  try {

    const { status } = req.body
    const before = await Application.findById(req.params.id).lean()

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    const beforeWasSelected = selectedStatuses.includes(String((before as any)?.status || "").toLowerCase())
    const afterIsSelected = selectedStatuses.includes(String(status || "").toLowerCase())
    if (application && beforeWasSelected !== afterIsSelected) {
      await recomputeHiringProgress((application as any).jobId)
    }

    // ✅ EMAIL TRIGGER (NEW ADD)
    if (application && ["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"].includes(status)) {
      let positionTitle = (application as any).selectedPositionTitle 
        || (application as any).positionTitle 
        || (application as any).selectedPositionName;
      if (!positionTitle && (application as any).jobId) {
        const job = await mongoose.model('Job').findById((application as any).jobId);
        positionTitle = job ? (job as any).jobTitle : '';
      }
      await sendApplicationStatusEmail(
        (application as any).email,
        (application as any).name,
        status,
        positionTitle || 'the position'
      )
    }

    // Task Cancellation
    if (application && ["Rejected", "Cancelled"].includes(status)) {
      if ((application as any).taskId) {
        await Task.findByIdAndDelete((application as any).taskId);
        (application as any).taskId = null;
        await application.save();
      }
    }

    res.json(application)

  } catch (error:any) {

    res.status(400).json({
      success:false,
      message:error.message
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
          interviewStatus: "Upcoming"
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
