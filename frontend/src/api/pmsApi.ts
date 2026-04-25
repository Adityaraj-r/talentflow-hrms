import api from "@/services/apiClient";
import type { AppraisalRatingBand } from "@/constants/appraisalRatingBands";

/** Cycle lifecycle for appraisal wrapper (distinct from PerformanceCycle status). */
export type AppraisalCycleStatus = "draft" | "active" | "closed" | "processed";

export interface AppraisalCycle {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: AppraisalCycleStatus;
  performanceCycleId: string;
  createdBy: string;
  closedAt?: string | null;
  closedBy?: string | null;
  processedAt?: string | null;
  processedBy?: string | null;
  bonusRunId?: string | null;
  broadcastActiveSentAt?: string | null;
  broadcastProcessedSentAt?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType =
  | "appraisal_cycle_active"
  | "appraisal_result_published"
  | "team_appraisals_complete";

export interface NotificationItem {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  metadata?: {
    appraisalCycleId?: string;
    performanceCycleId?: string;
    [key: string]: unknown;
  };
  isDeleted?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationsPage {
  items: NotificationItem[];
  total: number;
}

export interface BonusPreviewRow {
  userId: string;
  reviewId: string;
  overallRating: number;
  ratingBand: AppraisalRatingBand;
  bonusPercent: number;
  basicSalary: number;
  bonusAmount: number;
  skippedReason?: string;
}

export interface BonusRunResult {
  bonusRunId: string;
  processed: number;
  skipped: number;
  errors: string[];
}

export interface CreateAppraisalCyclePayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  performanceCycleId: string;
}

export interface TransitionAppraisalCyclePayload {
  status: Exclude<AppraisalCycleStatus, "draft">;
}

export interface EmployeePublishedAppraisalResult {
  appraisalCycleId: string;
  performanceCycleId: string;
  cycleName: string;
  overallRating: number;
  ratingBand: AppraisalRatingBand;
  bonusPercent: number;
  bonusAmount: number;
  processedAt?: string | null;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

function unwrap<T>(res: unknown): T {
  if (res !== null && typeof res === "object" && "data" in res) {
    return (res as ApiEnvelope<T>).data;
  }
  return res as T;
}

/** GET /pms/cycles — list appraisal wrapper cycles */
export async function fetchAppraisalCycles(params?: {
  status?: AppraisalCycleStatus;
  includeDeleted?: boolean;
}): Promise<AppraisalCycle[]> {
  const res = await api.get<ApiEnvelope<AppraisalCycle[]>>("/pms/cycles", {
    params: {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.includeDeleted ? { includeDeleted: "true" } : {}),
    },
  });
  return unwrap<AppraisalCycle[]>(res);
}

/** GET /pms/cycles/:id */
export async function fetchAppraisalCycleById(id: string): Promise<AppraisalCycle> {
  const res = await api.get<ApiEnvelope<AppraisalCycle>>(`/pms/cycles/${id}`);
  return unwrap<AppraisalCycle>(res);
}

/** POST /pms/cycles */
export async function createAppraisalCycle(
  payload: CreateAppraisalCyclePayload
): Promise<AppraisalCycle> {
  const res = await api.post<ApiEnvelope<AppraisalCycle>>("/pms/cycles", payload);
  return unwrap<AppraisalCycle>(res);
}

/** PATCH /pms/cycles/:id/status */
export async function transitionAppraisalCycleStatus(
  id: string,
  payload: TransitionAppraisalCyclePayload
): Promise<AppraisalCycle> {
  const res = await api.patch<ApiEnvelope<AppraisalCycle>>(`/pms/cycles/${id}/status`, payload);
  return unwrap<AppraisalCycle>(res);
}

/** DELETE /pms/cycles/:id — soft delete */
export async function deleteAppraisalCycle(id: string): Promise<{ deleted: boolean }> {
  const res = await api.delete<ApiEnvelope<{ deleted: boolean }>>(`/pms/cycles/${id}`);
  return unwrap<{ deleted: boolean }>(res);
}

/** POST /pms/bonus/run/:cycleId */
export async function runBonusForCycle(cycleId: string): Promise<BonusRunResult> {
  const res = await api.post<ApiEnvelope<BonusRunResult>>(`/pms/bonus/run/${cycleId}`);
  return unwrap<BonusRunResult>(res);
}

/** GET /pms/bonus/preview/:cycleId */
export async function fetchBonusPreview(cycleId: string): Promise<BonusPreviewRow[]> {
  const res = await api.get<ApiEnvelope<BonusPreviewRow[]>>(`/pms/bonus/preview/${cycleId}`);
  return unwrap<BonusPreviewRow[]>(res);
}

/** GET /notifications */
export async function fetchNotifications(params?: {
  limit?: number;
  skip?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsPage> {
  const res = await api.get<ApiEnvelope<NotificationsPage>>("/notifications", {
    params: {
      ...(params?.limit != null ? { limit: params.limit } : {}),
      ...(params?.skip != null ? { skip: params.skip } : {}),
      ...(params?.unreadOnly ? { unreadOnly: "true" } : {}),
    },
  });
  return unwrap<NotificationsPage>(res);
}

/** PATCH /notifications/:id/read */
export async function markNotificationRead(id: string): Promise<{ read: boolean }> {
  const res = await api.patch<ApiEnvelope<{ read: boolean }>>(`/notifications/${id}/read`);
  return unwrap<{ read: boolean }>(res);
}

/** GET /pms/cycles/me/appraisal-result — EMPLOYEE only */
export async function fetchMyPublishedAppraisalResult(): Promise<EmployeePublishedAppraisalResult | null> {
  const res = await api.get<ApiEnvelope<EmployeePublishedAppraisalResult | null>>(
    "/pms/cycles/me/appraisal-result"
  );
  return unwrap<EmployeePublishedAppraisalResult | null>(res);
}
