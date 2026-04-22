/**
 * Shared PMS display helpers — prefer populated User refs; fall back safely.
 */

export type PersonLike = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  department?: string;
  designation?: string;
  profilePhoto?: string;
};

export type ReviewLike = {
  employeeName?: string;
  employee?: PersonLike;
};

/** e.g. 18 Apr 2026 */
export function formatDateDDMMMYYYY(
  value: Date | string | number | undefined | null
): string {
  if (value == null) return "—";
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function displayPersonName(
  p: PersonLike | null | undefined,
  review?: ReviewLike | null
): string {
  if (p && typeof p === "object") {
    const combined = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    if (combined) return combined;
    if (p.name?.trim()) return p.name.trim();
  }
  if (review?.employeeName?.trim()) return review.employeeName.trim();
  return "N/A";
}

export function displayDepartment(
  p: PersonLike | null | undefined,
  review?: ReviewLike | null
): string {
  const d = p?.department?.trim();
  if (d) return d;
  return "N/A";
}

const STAGE_LABELS: Record<string, string> = {
  goals_pending: "Awaiting goal setting",
  goals_locked: "Goals confirmed — awaiting self-assessment",
  self_assessment_done: "Awaiting manager review",
  manager_review_done: "Awaiting HR review",
  hr_reviewed: "HR review complete",
  ceo_reviewed: "Awaiting calibration",
  calibrated: "Awaiting final approval",
  final_approved: "Awaiting feedback release",
  feedback_released: "Feedback released",
  pending: "Awaiting goal setting",
  completed: "Completed",
  approved: "Approved",
};

export function formatWorkflowStageLabel(status: string | undefined): string {
  if (!status) return "—";
  const raw = String(status).trim().toLowerCase().replace(/\s+/g, "_");
  if (STAGE_LABELS[raw]) return STAGE_LABELS[raw];
  const spaced = String(status).trim();
  return spaced.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initialsFromPerson(p: PersonLike | null | undefined): string {
  const fn = p?.firstName?.[0];
  const ln = p?.lastName?.[0];
  if (fn || ln) return `${fn ?? ""}${ln ?? ""}`.toUpperCase().slice(0, 2);
  return "?";
}
