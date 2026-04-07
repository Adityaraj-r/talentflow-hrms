import { Request, Response } from "express"
import mongoose from "mongoose"
import Application from "../models/application.model"
import { getHrSenderEmail, sendInterviewScheduleEmail } from "../utils/sendEmail"

export const applyJob = async (req: Request, res: Response) => {

  try {

    const { jobId, name, email } = req.body

    const resume = (req as any).file?.filename

    const application = await Application.create({
      jobId,
      name,
      email,
      resume
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

    res.json(applications)

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