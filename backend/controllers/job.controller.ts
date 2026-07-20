import { Request, Response } from "express";
import Job from "../models/job.model";

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Auto-close jobs whose deadline day has ended
    await Job.updateMany(
      { status: "Published", deadline: { $exists: true, $ne: null, $lte: threshold } },
      { $set: { status: "Closed" } }
    );
    
    // Reopen jobs whose deadline day has not ended yet
    await Job.updateMany(
      { status: "Closed", deadline: { $exists: true, $ne: null, $gt: threshold } },
      { $set: { status: "Published" } }
    );

    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createJob = async (req: Request, res: Response) => {
  try {
    const role = (req as any).user?.role ? (req as any).user.role.toString().toUpperCase().replace(/\s+/g, "_") : "";
    const status = req.body.status || "Draft";
    if (status === "Published" && role !== "HR_MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Only HR Manager and Admins can publish jobs directly" });
    }

    console.log("Incoming Job Data:", req.body);

    const jobData = {
      jobTitle: req.body.jobTitle,
      department: req.body.department,
      positions: Number(req.body.positions),
      employmentType: req.body.employmentType,
      deadline: req.body.deadline,
      status: status
    };

    const job = await Job.create(jobData);

    res.status(201).json(job);

  } catch (error: any) {

    console.log("Create Job Error:", error); 

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const role = (req as any).user?.role ? (req as any).user.role.toString().toUpperCase().replace(/\s+/g, "_") : "";
    if (job.status === "Published" || job.status === "Closed" || job.status === "Open") {
      if (role !== "HR_MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied to update published/closed/open jobs" });
      }
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedJob);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publishJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "Published" }, 
      { new: true }
    );
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const closeJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const updateData: any = { status: "Closed" };
    if (job.deadline) {
      updateData.deadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedJob);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPublishedJobs = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Auto-close jobs whose deadline day has ended
    await Job.updateMany(
      { status: "Published", deadline: { $exists: true, $ne: null, $lte: threshold } },
      { $set: { status: "Closed" } }
    );

    // Reopen jobs whose deadline day has not ended yet
    await Job.updateMany(
      { status: "Closed", deadline: { $exists: true, $ne: null, $gt: threshold } },
      { $set: { status: "Published" } }
    );

    const jobs = await Job.find({ status: "Published" }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const role = (req as any).user?.role ? (req as any).user.role.toString().toUpperCase().replace(/\s+/g, "_") : "";

    const job = await Job.findById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.status === "Published" || job.status === "Open") {
      return res.status(400).json({ success: false, message: "Published/Open jobs cannot be deleted directly" });
    }

    if (job.status === "Closed") {
      if (role !== "HR_MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, message: "Only HR Manager and Admins can remove closed jobs" });
      }
    } else if (job.status === "Draft") {
      if (role !== "HR_OFFICER" && role !== "HR_MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied for deleting draft jobs" });
      }
    }

    await Job.findByIdAndDelete(id);
    res.json({ success: true, message: "Job deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};