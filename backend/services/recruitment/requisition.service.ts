import { z } from "zod";
import Requisition from "../../models/Requisition.model";
import { AuthRequest } from "../../middleware/auth.middleware";
import { createLog } from "../../controllers/audit.controller";

const normalizeRole = (role?: string) => (role || "").toUpperCase().replace(/ /g, "_");
const isHRManager = (role?: string) => ["HR_MANAGER", "HRMANAGER"].includes(normalizeRole(role));

const createRequisitionSchema = z.object({
  position: z.string().min(1),
  department: z.string().min(1),
  experience: z.string().optional(),
  salaryRange: z.string().optional(),
  reason: z.string().optional(),
  urgency: z.enum(["High", "Normal", "Low"]).optional(),
});

export const createRequisition = async (req: AuthRequest) => {
  const parsed = createRequisitionSchema.safeParse(req.body);
  if (!parsed.success) return { ok: false as const, error: parsed.error.flatten() };

  const data = parsed.data;
  const requisition = await Requisition.create({
    ...data,
    status: "Pending",
    requestedBy: req.user?.id,
  });

  return { ok: true as const, data: requisition };
};

export const getPendingRequisitions = async () => {
  return Requisition.find({ status: "Pending" }).sort({ createdAt: -1 });
};

export const getRequisitionHistory = async () => {
  return Requisition.find({ status: { $ne: "Pending" } }).sort({ createdAt: -1 });
};

export const approveRequisition = async (req: AuthRequest) => {
  if (!isHRManager(req.user?.role)) {
    return { ok: false as const, error: "Only HR Manager can approve requisitions" };
  }

  const requisitionId = req.params.id;
  const before = await Requisition.findById(requisitionId);
  if (!before) return { ok: false as const, error: "Requisition not found" };

  before.status = "Approved";
  (before as any).approvalDate = new Date();
  (before as any).approvedBy = req.user?.id;
  await before.save();

  await createLog(
    req.user!.id,
    req.user!.email,
    "APPROVE_REQUISITION",
    "recruitment",
    `requisitionId=${requisitionId} Pending -> Approved`,
    req.ip || "unknown",
    "Success"
  );

  return { ok: true as const, data: before };
};

export const rejectRequisition = async (req: AuthRequest) => {
  if (!isHRManager(req.user?.role)) {
    return { ok: false as const, error: "Only HR Manager can reject requisitions" };
  }

  const requisitionId = req.params.id;
  const before = await Requisition.findById(requisitionId);
  if (!before) return { ok: false as const, error: "Requisition not found" };

  before.status = "Rejected";
  (before as any).approvalDate = new Date();
  (before as any).approvedBy = req.user?.id;
  await before.save();

  await createLog(
    req.user!.id,
    req.user!.email,
    "REJECT_REQUISITION",
    "recruitment",
    `requisitionId=${requisitionId} Pending -> Rejected`,
    req.ip || "unknown",
    "Success"
  );

  return { ok: true as const, data: before };
};

export const getRequisitionStats = async () => {
  const totalOpen = await Requisition.countDocuments({
    status: { $in: ["Pending", "Approved"] },
  });

  const pending = await Requisition.countDocuments({ status: "Pending" });
  const approved = await Requisition.countDocuments({ status: "Approved" });
  const rejected = await Requisition.countDocuments({ status: "Rejected" });

  return { totalOpen, pending, approved, rejected };
};

