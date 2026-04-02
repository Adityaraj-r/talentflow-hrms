import { Request, Response } from "express"
import mongoose from "mongoose"
import Application from "../models/application.model"

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