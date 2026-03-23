import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import Offer from "../../models/Offer.model";
import Application from "../../models/application.model";
import Candidate from "../../models/Candidate.model";
import Job from "../../models/job.model";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createLog } from "../../controllers/audit.controller";
import { autoCreateEmployeeFromOffer } from "../onboarding/onboarding.service";

const normalizeRole = (role?: string) => (role || "").toUpperCase().replace(/ /g, "_");
const isHRManager = (role?: string) => ["HR_MANAGER", "HRMANAGER"].includes(normalizeRole(role));

const agreedSalaryPackageSchema = z
  .object({
    basic: z.number().optional(),
    hra: z.number().optional(),
    transport: z.number().optional(),
    medical: z.number().optional(),
    otherAllowance: z.number().optional(),
    pf: z.number().optional(),
    tax: z.number().optional(),
    insurance: z.number().optional(),
  })
  .partial();

const createOfferSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1),
  salary: z.preprocess((v) => Number(v), z.number().positive()),
  joiningDate: z.string().min(1),
  agreedSalaryPackage: agreedSalaryPackageSchema.optional(),
});

const updateOfferStatusSchema = z.object({
  status: z.enum(["Offered", "Accepted", "Declined"]),
});

export const createOffer = async (req: AuthRequest) => {
  if (!isHRManager(req.user?.role)) {
    return { ok: false as const, error: "Only HR Manager can generate offers" };
  }

  const parsed = createOfferSchema.safeParse(req.body);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const { candidateId, jobId, salary, joiningDate, agreedSalaryPackage } = parsed.data;

  const application = await Application.findOne({ candidateId, jobId }).populate("candidateId").populate("jobId");
  if (!application) return { ok: false as const, error: "Application not found for candidate+job" };
  if (application.status !== "Interview") {
    return { ok: false as const, error: "Offer can be generated only after Interview stage" };
  }

  const offerId = `OFF-${uuidv4()}`;

  const candidate = await Candidate.findById(candidateId);
  const job = await Job.findById(jobId);
  if (!candidate || !job) return { ok: false as const, error: "Candidate or job not found" };

  const offer = await Offer.create({
    offerId,
    candidateId,
    jobId,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    salary,
    agreedSalaryPackage: {
      basic: agreedSalaryPackage?.basic ?? salary,
      hra: agreedSalaryPackage?.hra ?? 0,
      transport: agreedSalaryPackage?.transport ?? 0,
      medical: agreedSalaryPackage?.medical ?? 0,
      otherAllowance: agreedSalaryPackage?.otherAllowance ?? 0,
      pf: agreedSalaryPackage?.pf ?? 0,
      tax: agreedSalaryPackage?.tax ?? 0,
      insurance: agreedSalaryPackage?.insurance ?? 0,
    },
    joiningDate,
    status: "Offered",
    createdBy: req.user!.id,
  });

  application.status = "Offer";
  await application.save();

  await createLog(
    req.user!.id,
    req.user!.email,
    "UPDATE_APPLICATION_STATUS",
    "recruitment",
    `applicationId=${application._id} Interview -> Offer`,
    req.ip || "unknown",
    "Success"
  );

  // Keep candidate.stage aligned with pipeline status for easier auditing
  if ((candidate as any).stage) {
    (candidate as any).stage = "Offer";
    await candidate.save();
  }

  await createLog(
    req.user!.id,
    req.user!.email,
    "GENERATE_OFFER",
    "recruitment",
    `offerId=${offerId} applicationId=${application._id}`,
    req.ip || "unknown",
    "Success"
  );

  return { ok: true as const, data: offer };
};

export const updateOfferStatus = async (req: AuthRequest) => {
  const parsed = updateOfferStatusSchema.safeParse(req.body);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const offerId = req.params.id;
  const offer = await Offer.findOne({ _id: offerId }).populate("candidateId").populate("jobId");
  if (!offer) return { ok: false as const, error: "Offer not found" };

  const current = offer.status;
  const next = parsed.data.status;

  // Only HR Manager performs stateful transitions in this module.
  if (!isHRManager(req.user?.role)) {
    return { ok: false as const, error: "Only HR Manager can update offer status" };
  }

  offer.status = next;
  await offer.save();

  await createLog(
    req.user!.id,
    req.user!.email,
    "UPDATE_OFFER_STATUS",
    "recruitment",
    `offerId=${offer.offerId} ${current} -> ${next}`,
    req.ip || "unknown",
    "Success"
  );

  if (next === "Accepted") {
    // Update pipeline to Hired and auto-onboard the employee.
    const application = await Application.findOne({ candidateId: offer.candidateId, jobId: offer.jobId });
    if (application && application.status !== "Hired") {
      const before = application.status;
      application.status = "Hired";
      await application.save();

      await createLog(
        req.user!.id,
        req.user!.email,
        "UPDATE_APPLICATION_STATUS",
        "recruitment",
        `applicationId=${application._id} ${before} -> Hired`,
        req.ip || "unknown",
        "Success"
      );
    }

    const candidate = await Candidate.findById(offer.candidateId);
    if (candidate) {
      (candidate as any).stage = "Hired";
      await candidate.save();
    }

    // Payroll sync (initialize salaryStructure) + Employee record create.
    await autoCreateEmployeeFromOffer({
      offer,
      candidate: await Candidate.findById(offer.candidateId),
      job: await Job.findById(offer.jobId),
      salaryPackage: offer.agreedSalaryPackage || undefined,
      salary: offer.salary,
    });

  }

  return { ok: true as const, data: offer };
};

