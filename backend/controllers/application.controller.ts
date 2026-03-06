import { Request, Response } from "express"
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
export const getApplicationStatus = async (req: Request, res: Response) => {

  try {

    const email = req.params.email

    const applications = await Application.find({ email }).populate("jobId")

    res.json(applications)

  } catch (error:any) {

    res.status(500).json({
      success:false,
      message:error.message
    })

  }

}