import { Request, Response } from "express";
import Job from "../models/job.model";

const normalizeHiringRoles = (roles: any, fallbackRoleName: string, fallbackOpenings: any) => {
  const rows = Array.isArray(roles) ? roles : [];
  const normalized = rows
    .map((role) => {
      const openings = Number(role?.openings);
      const filled = Math.min(Math.max(0, Number(role?.filled) || 0), Math.max(0, openings || 0));
      return {
        _id: role?._id,
        roleName: (role?.roleName || role?.name || "").toString().trim(),
        openings,
        minSalary: role?.minSalary !== undefined && role?.minSalary !== null ? Number(role.minSalary) : undefined,
        maxSalary: role?.maxSalary !== undefined && role?.maxSalary !== null ? Number(role.maxSalary) : undefined,
        experience: (role?.experience || "").toString().trim(),
        skills: (role?.skills || role?.requirements || "").toString().trim(),
        filled,
        status: filled >= openings ? "Closed" : (role?.status === "Closed" ? "Closed" : "Open"),
      };
    })
    .filter((role) => role.roleName && Number.isInteger(role.openings) && role.openings > 0);

  if (normalized.length > 0) return normalized;

  return [
    {
      roleName: fallbackRoleName || "Hiring Role",
      openings: Math.max(1, Number(fallbackOpenings) || 1),
      experience: "",
      skills: "",
      filled: 0,
      status: "Open",
    },
  ];
};

const totalOpenings = (roles: any[]) =>
  roles.reduce((sum, role) => sum + (Number(role.openings) || 0), 0);

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

    const hiringRoles = normalizeHiringRoles(req.body.hiringRoles, req.body.jobTitle, req.body.positions);
    
    // Auto-generate job code if not provided
    let jobCode = req.body.jobCode;
    if (!jobCode) {
      const datePart = new Date().toISOString().slice(0, 7).replace("-", ""); // YYYYMM
      const randomPart = Math.floor(1000 + Math.random() * 9000); // 4 digit random
      jobCode = `JOB-${datePart}-${randomPart}`;
    }

    let uploadJd = "";
    let supportingDocuments = "";
    if (req.files) {
      if ((req.files as any)["uploadJd"]) uploadJd = (req.files as any)["uploadJd"][0].path;
      if ((req.files as any)["supportingDocuments"]) supportingDocuments = (req.files as any)["supportingDocuments"][0].path;
    }

    const jobData = {
      ...req.body,
      jobCode,
      positions: totalOpenings(hiringRoles),
      hiringRoles,
      status: status,
      uploadJd: uploadJd || req.body.uploadJd,
      supportingDocuments: supportingDocuments || req.body.supportingDocuments
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
    if (job.status === "Published" || job.status === "Closed" || String(job.status) === "Open") {
      if (role !== "HR_MANAGER" && role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, message: "Access denied to update published/closed/open jobs" });
      }
    }

    const updateData: any = { ...req.body };
    
    let uploadJd = "";
    let supportingDocuments = "";
    if (req.files) {
      if ((req.files as any)["uploadJd"]) {
        uploadJd = (req.files as any)["uploadJd"][0].path;
        updateData.uploadJd = uploadJd;
      }
      if ((req.files as any)["supportingDocuments"]) {
        supportingDocuments = (req.files as any)["supportingDocuments"][0].path;
        updateData.supportingDocuments = supportingDocuments;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "hiringRoles")) {
      updateData.hiringRoles = normalizeHiringRoles(req.body.hiringRoles, req.body.jobTitle || job.jobTitle, req.body.positions || job.positions);
      updateData.positions = totalOpenings(updateData.hiringRoles);
    } else if (Object.prototype.hasOwnProperty.call(req.body, "positions")) {
      updateData.positions = Number(req.body.positions);
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

    const updateData: any = { status: "Closed", autoClosedByHiringProgress: false };
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

    if (job.status === "Published" || String(job.status) === "Open") {
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
