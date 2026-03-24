import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ResponseHandler } from "../utils/responseHandler";
import Requisition from "../models/Requisition.model";
import Job from "../models/job.model";
import Application from "../models/application.model";

const toDate = (v: any) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

export const getRecruitmentDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const department = req.query.department ? String(req.query.department) : null;
    const from = toDate(req.query.from);
    const to = toDate(req.query.to);

    let jobIds: any[] | null = null;
    if (department) {
      const jobs = await Job.find({ department }).select("_id");
      jobIds = jobs.map((j: any) => j._id);
    }

    const applicationFilter: any = {};
    if (jobIds) applicationFilter.jobId = { $in: jobIds };
    if (from || to) {
      applicationFilter.createdAt = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }

    const [requisitions, jobs, applications] = await Promise.all([
      Requisition.find(),
      Job.find(),
      Application.find(applicationFilter).populate("jobId").populate("candidateId"),
    ]);

    const requisitionStats = requisitions.reduce(
      (acc: any, r: any) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      },
      { Pending: 0, Approved: 0, Rejected: 0 }
    );

    const jobStats = jobs.reduce(
      (acc: any, j: any) => {
        acc[j.status] = (acc[j.status] || 0) + 1;
        return acc;
      },
      { Draft: 0, Published: 0, Closed: 0 }
    );

    const pipelineStats = applications.reduce(
      (acc: any, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      },
      { Applied: 0, Screening: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0 }
    );

    return ResponseHandler.success(
      res,
      {
        requisitionStats,
        jobStats,
        pipelineStats,
      },
      "Recruitment dashboard fetched"
    );
  } catch (error: any) {
    return ResponseHandler.serverError(res, error?.message || "Failed to fetch dashboard");
  }
};

