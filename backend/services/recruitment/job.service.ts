import { z } from "zod";
import Job from "../../models/job.model";
import Requisition from "../../models/Requisition.model";
import { createLog } from "../../controllers/audit.controller";
import { AuthRequest } from "../../middleware/auth.middleware";

const createJobSchema = z.object({
  requisitionId: z.string().min(1),
  jobTitle: z.string().min(1),
  department: z.string().min(1),
  positions: z.preprocess((v) => Number(v), z.number().int().positive()),
  employmentType: z.string().min(1),
  deadline: z
    .preprocess((v) => (v ? new Date(v as any) : undefined), z.date().optional())
    .optional(),
  status: z.enum(["Draft", "Published", "Closed"]).optional(),
});

export const getAllJobs = async () => {
  return Job.find().sort({ createdAt: -1 });
};

export const getPublishedJobs = async () => {
  return Job.find({ status: "Published" }).sort({ createdAt: -1 });
};

export const createJob = async (req: AuthRequest) => {
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  const data = parsed.data;

  const requisition = await Requisition.findById(data.requisitionId);
  if (!requisition) {
    return { ok: false as const, error: "Requisition not found" };
  }
  if (requisition.status !== "Approved") {
    return { ok: false as const, error: "Only approved requisitions can be posted" };
  }

  const job = await Job.create({
    requisitionId: data.requisitionId,
    jobTitle: data.jobTitle,
    department: data.department,
    positions: data.positions,
    employmentType: data.employmentType,
    deadline: data.deadline ?? undefined,
    status: data.status ?? "Draft",
  });

  return { ok: true as const, data: job };
};

export const publishJob = async (req: AuthRequest) => {
  const jobId = req.params.id;

  const before = await Job.findById(jobId);
  if (!before) return { ok: false as const, error: "Job not found" };

  if (before.status !== "Draft") {
    return { ok: false as const, error: "Only Draft jobs can be published" };
  }

  before.status = "Published";
  await before.save();

  if (req.user?.id) {
    await createLog(
      req.user.id,
      req.user.email,
      "UPDATE_JOB_STATUS",
      "recruitment",
      `jobId=${jobId} status=${before.status}`,
      req.ip || "unknown",
      "Success"
    );
  }

  return { ok: true as const, data: before };
};

export const closeJob = async (req: AuthRequest) => {
  const jobId = req.params.id;

  const before = await Job.findById(jobId);
  if (!before) return { ok: false as const, error: "Job not found" };

  if (before.status === "Closed") {
    return { ok: false as const, error: "Job already closed" };
  }

  before.status = "Closed";
  await before.save();

  if (req.user?.id) {
    await createLog(
      req.user.id,
      req.user.email,
      "UPDATE_JOB_STATUS",
      "recruitment",
      `jobId=${jobId} status=${before.status}`,
      req.ip || "unknown",
      "Success"
    );
  }

  return { ok: true as const, data: before };
};

export const updateJob = async (req: AuthRequest) => {
  const jobId = req.params.id;
  const before = await Job.findById(jobId);
  if (!before) return { ok: false as const, error: "Job not found" };

  // Allow edits only while job is in Draft to keep workflow consistent.
  if (before.status !== "Draft") {
    return { ok: false as const, error: "Only Draft jobs can be updated" };
  }

  const parsed = z
    .object({
      jobTitle: z.string().min(1).optional(),
      department: z.string().min(1).optional(),
      positions: z.preprocess((v) => Number(v), z.number().int().positive()).optional(),
      employmentType: z.string().min(1).optional(),
      deadline: z
        .preprocess((v) => (v ? new Date(v as any) : undefined), z.date().optional())
        .optional(),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  Object.assign(before, parsed.data);
  await before.save();
  return { ok: true as const, data: before };
};

