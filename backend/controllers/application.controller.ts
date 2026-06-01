import { Request, Response } from "express"
import mongoose from "mongoose"
import Application from "../models/application.model"
import Job from "../models/job.model"
import { getHrSenderEmail, sendInterviewScheduleEmail } from "../utils/sendEmail"
import { sendApplicationStatusEmail } from "../utils/sendEmail";
import { calculateResumeFit } from "../utils/resumeFit"
export const applyJob = async (req: Request, res: Response) => {

  try {

    const { jobId, name, email } = req.body

    const resume = (req as any).file?.filename
    const job = jobId && mongoose.Types.ObjectId.isValid(jobId)
      ? await Job.findById(jobId).lean()
      : null
    const fit = await calculateResumeFit({
      resume,
      candidateName: name,
      candidateEmail: email,
      job: job as any,
    })

    const application = await Application.create({
      jobId,
      name,
      email,
      resume,
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

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    // ✅ EMAIL TRIGGER (NEW ADD)
    if (application && ["Shortlisted", "Rejected", "Selected"].includes(status)) {
      await sendApplicationStatusEmail(
        (application as any).email,
        (application as any).name,
        status
      )
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

    const user = (req as any).user || {}
    const hrName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || "HR Team"
    const configuredSenderEmail = await getHrSenderEmail()
    const hrEmail = user.email || configuredSenderEmail || ""
    const hrPhone = user.phoneNumber || ""

    const jobTitle = (application as any)?.jobId?.jobTitle || "Position"
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
    if (appDoc.status !== "Interview") {
      appDoc.status = "Interview"
      await appDoc.save()
    }

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
