import { z } from "zod";
import Application from "../../models/application.model";
import Job from "../../models/job.model";
import Candidate from "../../models/Candidate.model";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createLog } from "../../controllers/audit.controller";

const applyJobSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(3),
  email: z.string().email(),
  // Optional enhancements (not required by current UI)
  skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      if (Array.isArray(v)) return v;
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }),
  expectedSalary: z.preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().positive().optional()).optional(),
  noticePeriod: z.string().optional(),
  source: z.string().optional(),
});

const normalizeRole = (role?: string) => (role || "").toUpperCase().replace(/ /g, "_");
const isHRManager = (role?: string) => ["HR_MANAGER", "HRMANAGER"].includes(normalizeRole(role));
const isHROfficer = (role?: string) => ["HR_OFFICER", "HROFFICER"].includes(normalizeRole(role));

const mapLegacyStatusToPipeline = (status: string): string => {
  const s = status?.trim();
  if (!s) return "Applied";
  if (s === "Shortlisted") return "Screening";
  if (s === "Selected") return "Offer";
  return s;
};

const pipelineOrder = ["Applied", "Screening", "Interview", "Offer", "Hired"] as const;
type PipelineStatus = (typeof pipelineOrder)[number] | "Rejected";

export const applyJob = async (req: AuthRequest) => {
  const parsed = applyJobSchema.safeParse(req.body);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const fileName = (req as any).file?.filename as string | undefined;
  if (!fileName) return { ok: false as const, error: "Resume file is required" };

  const { jobId, name, email, skills, expectedSalary, noticePeriod, source } = parsed.data;

  const job = await Job.findById(jobId);
  if (!job) return { ok: false as const, error: "Job not found" };

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return { ok: false as const, error: "Full name must include first and last name" };
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  const normalizedEmail = email.toLowerCase().trim();

  let candidate = await Candidate.findOne({ email: normalizedEmail });
  if (!candidate) {
    candidate = await Candidate.create({
      firstName,
      lastName,
      email: normalizedEmail,
      position: job.jobTitle, // candidate applying for this job
      resume: fileName,
      skills: skills || [],
      expectedSalary: expectedSalary ?? null,
      noticePeriod: noticePeriod ?? null,
      source: source ?? null,
      stage: "Applied",
    });
  } else {
    // Update candidate resume for freshness; keep stage at Applied on re-application.
    candidate.firstName = firstName;
    candidate.lastName = lastName;
    candidate.position = job.jobTitle;
    candidate.resume = fileName;
    if (skills) candidate.skills = skills;
    if (expectedSalary !== undefined) candidate.expectedSalary = expectedSalary;
    if (noticePeriod !== undefined) candidate.noticePeriod = noticePeriod;
    if (source !== undefined) candidate.source = source;
    candidate.stage = "Applied";
    await candidate.save();
  }

  const existing = await Application.findOne({ candidateId: candidate._id, jobId });
  if (existing) return { ok: true as const, data: existing, alreadyExisted: true };

  const application = await Application.create({
    candidateId: candidate._id,
    jobId,
    name,
    email: normalizedEmail,
    resume: fileName,
    status: "Applied",
  });

  return { ok: true as const, data: application };
};

export const getApplications = async () => {
  return Application.find()
    .populate("jobId")
    .populate("candidateId");
};

export const updateApplicationStatus = async (req: AuthRequest) => {
  const nextRaw = String(req.body?.status ?? "").trim();
  if (!nextRaw) return { ok: false as const, error: "status is required" };

  const nextStatus = mapLegacyStatusToPipeline(nextRaw) as PipelineStatus;
  const allowedStatuses = new Set<PipelineStatus>([...pipelineOrder, "Rejected"] as PipelineStatus[]);
  if (!allowedStatuses.has(nextStatus)) return { ok: false as const, error: "Invalid status" };

  const app = await Application.findById(req.params.id).populate("candidateId").populate("jobId");
  if (!app) return { ok: false as const, error: "Application not found" };

  const beforeStatus = app.status as PipelineStatus;
  const afterStatus: PipelineStatus = nextStatus;

  // Always allow rejection as a terminal action
  if (afterStatus === "Rejected") {
    const roleOk = isHRManager(req.user?.role) || isHROfficer(req.user?.role);
    if (!roleOk) return { ok: false as const, error: "Not allowed to reject" };
  } else {
    const beforeIdx = pipelineOrder.indexOf(beforeStatus as any);
    const nextIdx = pipelineOrder.indexOf(afterStatus as any);

    if (beforeIdx === -1 || nextIdx === -1) return { ok: false as const, error: "Invalid pipeline state" };
    if (nextIdx !== beforeIdx + 1) return { ok: false as const, error: `Invalid transition ${beforeStatus} -> ${afterStatus}` };

    // HR Manager approves Offer/Hired transitions (approval gates)
    if (afterStatus === "Offer" || afterStatus === "Hired") {
      if (!isHRManager(req.user?.role)) return { ok: false as const, error: "Only HR Manager can approve this step" };
    } else {
      // Screening/Interview are HR Officer-driven
      const roleOk = isHRManager(req.user?.role) || isHROfficer(req.user?.role);
      if (!roleOk) return { ok: false as const, error: "Not allowed to move this step" };
    }
  }

  app.status = afterStatus;
  if (app.candidateId) {
    (app.candidateId as any).stage = afterStatus;
    await (app.candidateId as any).save();
  }
  await app.save();

  if (req.user?.id) {
    await createLog(
      req.user.id,
      req.user.email,
      "UPDATE_APPLICATION_STATUS",
      "recruitment",
      `applicationId=${app._id} ${beforeStatus} -> ${afterStatus}`,
      req.ip || "unknown",
      "Success"
    );
  }

  return { ok: true as const, data: app };
};

export const getApplicationStatus = async (req: AuthRequest) => {
  const email = String(req.params.email || "").toLowerCase().trim();
  if (!email) return [];

  // Prefer legacy email field; fallback to candidate.email
  const apps = await Application.find({
    $or: [{ email }, { "candidateId.email": email }],
  })
    .populate("jobId")
    .populate("candidateId");

  return apps;
};

