import { Request, Response } from "express";
import Job from "../models/job.model";

// GET ALL JOBS (Admin Dashboard)
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE JOB (As Draft)
export const createJob = async (req: Request, res: Response) => {
  try {

    console.log("Incoming Job Data:", req.body); // DEBUG

    const jobData = {
      jobTitle: req.body.jobTitle,
      department: req.body.department,
      positions: Number(req.body.positions),
      employmentType: req.body.employmentType,
      deadline: req.body.deadline,
      status: req.body.status || "Draft"
    };

    const job = await Job.create(jobData);

    res.status(201).json(job);

  } catch (error: any) {

    console.log("Create Job Error:", error); // DEBUG

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE JOB
export const updateJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUBLISH JOB
export const publishJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "Published" }, // 'P' capital rakha hai frontend filter ke hisaab se
      { new: true }
    );
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// CLOSE JOB
export const closeJob = async (req: Request, res: Response) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "Closed" }, // 'C' capital rakha hai frontend filter ke hisaab se
      { new: true }
    );
    res.json(job);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET PUBLISHED JOBS (Public View)
export const getPublishedJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ status: "Published" }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};