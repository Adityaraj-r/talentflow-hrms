import mongoose from 'mongoose';
import { GoalModel } from '../models/Goal';

/** Canonical workflow steps (preferred storage for new reviews). Legacy string values are normalized via canonicalStatus(). */
export const WorkflowStage = {
  GOALS_PENDING: 'goals_pending',
  GOALS_LOCKED: 'goals_locked',
  SELF_ASSESSMENT_DONE: 'self_assessment_done',
  MANAGER_REVIEW_DONE: 'manager_review_done',
  HR_REVIEWED: 'hr_reviewed',
  CEO_REVIEWED: 'ceo_reviewed',
  CALIBRATED: 'calibrated',
  FINAL_APPROVED: 'final_approved',
  FEEDBACK_RELEASED: 'feedback_released',
} as const;

export type WorkflowStageKey = (typeof WorkflowStage)[keyof typeof WorkflowStage];

const LEGACY_MAP: Record<string, WorkflowStageKey> = {
  pending: WorkflowStage.GOALS_PENDING,
  goals_pending: WorkflowStage.GOALS_PENDING,
  goals_locked: WorkflowStage.GOALS_LOCKED,
  'self assessment done': WorkflowStage.SELF_ASSESSMENT_DONE,
  self_assessment_done: WorkflowStage.SELF_ASSESSMENT_DONE,
  'manager review done': WorkflowStage.MANAGER_REVIEW_DONE,
  manager_review_done: WorkflowStage.MANAGER_REVIEW_DONE,
  'hr reviewed': WorkflowStage.HR_REVIEWED,
  hr_reviewed: WorkflowStage.HR_REVIEWED,
  ceo_reviewed: WorkflowStage.CEO_REVIEWED,
  calibrated: WorkflowStage.CALIBRATED,
  completed: WorkflowStage.FINAL_APPROVED,
  approved: WorkflowStage.FINAL_APPROVED,
  final_approved: WorkflowStage.FINAL_APPROVED,
  feedback_released: WorkflowStage.FEEDBACK_RELEASED,
};

const CANONICAL_SET = new Set<string>(Object.values(WorkflowStage));

export function canonicalStatus(raw: string | undefined): WorkflowStageKey {
  const k = String(raw || '').trim().toLowerCase();
  const underscored = k.replace(/\s+/g, '_');
  if (LEGACY_MAP[k]) return LEGACY_MAP[k];
  if (LEGACY_MAP[underscored]) return LEGACY_MAP[underscored];
  if (CANONICAL_SET.has(underscored)) return underscored as WorkflowStageKey;
  return WorkflowStage.GOALS_PENDING;
}

export function isTerminalImmutable(stage: WorkflowStageKey): boolean {
  return stage === WorkflowStage.FINAL_APPROVED || stage === WorkflowStage.FEEDBACK_RELEASED;
}

export async function assertHasGoalsForCycle(
  employeeOid: mongoose.Types.ObjectId,
  cycleOid: mongoose.Types.ObjectId
): Promise<boolean> {
  const n = await GoalModel.countDocuments({ employeeId: employeeOid, cycleId: cycleOid });
  return n >= 1;
}

export async function assertReadyForSelfAssessment(
  rawStatus: string | undefined,
  employeeOid: mongoose.Types.ObjectId,
  cycleOid: mongoose.Types.ObjectId
): Promise<{ ok: true } | { ok: false; message: string }> {
  const c = canonicalStatus(rawStatus);
  const hasGoals = await assertHasGoalsForCycle(employeeOid, cycleOid);
  if (!hasGoals) {
    return { ok: false, message: 'Goal setting incomplete: add at least one goal for this cycle before self-assessment.' };
  }
  if (c === WorkflowStage.GOALS_LOCKED) return { ok: true };
  if (c === WorkflowStage.GOALS_PENDING) {
    return {
      ok: false,
      message:
        'Goals must be confirmed before self-assessment: call confirm-goals when ready, or ask HR to lock goals.',
    };
  }
  return { ok: false, message: 'Self-assessment is not allowed at this workflow stage.' };
}

/** Legacy data: goals_pending but goals exist — treat as eligible only after explicit lock */
export function assertManagerReviewOrder(c: WorkflowStageKey): void {
  if (c !== WorkflowStage.SELF_ASSESSMENT_DONE) {
    throw new Error('Self assessment required before manager review.');
  }
}

export function assertHrReviewOrder(c: WorkflowStageKey): void {
  if (c !== WorkflowStage.MANAGER_REVIEW_DONE) {
    throw new Error('Manager review must be completed before HR review.');
  }
}

export function assertCeoReviewAfterHr(c: WorkflowStageKey): void {
  if (c !== WorkflowStage.HR_REVIEWED) {
    throw new Error('HR review must be completed before CEO review.');
  }
}

export function assertCalibrationOrder(
  c: WorkflowStageKey,
  requiresCeo: boolean
): void {
  if (requiresCeo) {
    if (c !== WorkflowStage.CEO_REVIEWED) throw new Error('Calibration requires CEO review to complete first.');
  } else if (c !== WorkflowStage.HR_REVIEWED) {
    throw new Error('Calibration requires HR review to complete first.');
  }
}

export function assertFinalizeOrder(c: WorkflowStageKey): void {
  if (c !== WorkflowStage.CALIBRATED) throw new Error('Calibration must finish before final approval.');
}

export function computeOverallFromCompetencies(competencies: { rating?: number }[]): number {
  if (!competencies?.length) return 0;
  const sum = competencies.reduce((acc, x) => acc + (Number(x.rating) || 0), 0);
  return parseFloat((sum / competencies.length).toFixed(2));
}
