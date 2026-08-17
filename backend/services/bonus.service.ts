import { randomUUID } from 'crypto';
import mongoose from 'mongoose';
import {
  APPRAISAL_BONUS_PERCENT_BY_BAND,
  AppraisalRatingBand,
  mapOverallRatingToBand,
} from '../constants/appraisalRatingBands';
import { AppraisalCycleModel, AppraisalCycleStatus } from '../models/AppraisalCycle';
import { PerformanceReviewModel } from '../models/PerformanceReview';
import SalaryStructure, { ISalaryStructure } from '../models/salaryStructure.model';
import { WorkflowStage, canonicalStatus } from './pmsWorkflow.service';
import * as notificationService from './notification.service';

export interface BonusRunResult {
  bonusRunId: string;
  processed: number;
  skipped: number;
  errors: string[];
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

function isReviewEligibleForBonus(status: string | undefined): boolean {
  const s = canonicalStatus(status);
  return s === WorkflowStage.FINAL_APPROVED || s === WorkflowStage.FEEDBACK_RELEASED;
}

function computeBonusAmount(basic: number, percent: number): number {
  const base = Number(basic) || 0;
  const p = Number(percent) || 0;
  const raw = base * (p / 100);
  return Math.round(raw * 100) / 100;
}

async function getLatestSalaryStructure(
  userId: mongoose.Types.ObjectId
): Promise<ISalaryStructure | null> {
  return SalaryStructure.findOne({ userId }).sort({ effectiveFrom: -1 }).exec();
}

/**
 * Applies appraisal bonuses for all finalized reviews in the linked performance cycle.
 * Idempotent per employee via appraisalBonusSnapshot.bonusRunId matching cycle.bonusRunId.
 */
export async function runBonusForCycle(
  appraisalCycleId: string,
  triggeredBy: string
): Promise<BonusRunResult> {
  const errors: string[] = [];
  let processed = 0;
  let skipped = 0;

  const cycle = await AppraisalCycleModel.findOne({
    _id: appraisalCycleId,
    isDeleted: { $ne: true },
  });

  if (!cycle) {
    throw new Error('Appraisal cycle not found');
  }

  if (
    cycle.status !== AppraisalCycleStatus.CLOSED &&
    cycle.status !== AppraisalCycleStatus.PROCESSED
  ) {
    throw new Error('Bonus run requires appraisal cycle status CLOSED or PROCESSED');
  }

  const perfId = cycle.performanceCycleId;

  let bonusRunId = cycle.bonusRunId?.trim() || '';
  if (!bonusRunId) {
    bonusRunId = randomUUID();
    cycle.bonusRunId = bonusRunId;
    await cycle.save();
  }

  const reviews = await PerformanceReviewModel.find({
    cycleId: perfId,
  }).exec();

  if (reviews.length === 0) {
    return { bonusRunId, processed: 0, skipped: 0, errors: ['No performance reviews for this cycle'] };
  }

  for (const review of reviews) {
    const empId = review.employeeId as mongoose.Types.ObjectId;
    const empKey = empId.toString();

    if (!isReviewEligibleForBonus(review.status)) {
      errors.push(`Review ${review._id.toString()} (${empKey}): not finalized — skipped`);
      continue;
    }

    const rating = Number(review.overallRating) || 0;
    if (rating <= 0) {
      errors.push(`Review ${review._id.toString()} (${empKey}): no overall rating — skipped`);
      continue;
    }

    const band = mapOverallRatingToBand(rating);
    const percent = APPRAISAL_BONUS_PERCENT_BY_BAND[band];

    const salary = await getLatestSalaryStructure(empId);
    if (!salary) {
      errors.push(`User ${empKey}: no salary structure — skipped`);
      continue;
    }

    const snap = salary.appraisalBonusSnapshot;
    if (snap?.bonusRunId === bonusRunId) {
      skipped++;
      continue;
    }

    const basic = Number(salary.basic) || 0;
    const bonusAmount = computeBonusAmount(basic, percent);

    await SalaryStructure.updateOne(
      { _id: salary._id },
      {
        $set: {
          performanceBonusAmount: bonusAmount,
          appraisalBonusSnapshot: {
            appraisalCycleId: cycle._id,
            performanceCycleId: perfId,
            ratingBand: band,
            bonusPercentApplied: percent,
            bonusAmount,
            bonusRunId,
            appliedAt: new Date(),
          },
        },
      }
    );
    await notificationService.notifyBonusProcessed(
      empId,
      cycle._id.toString(),
      perfId.toString(),
      percent,
      bonusAmount
    );

    processed++;
  }

  void triggeredBy;

  return { bonusRunId, processed, skipped, errors };
}

export async function getBonusPreview(appraisalCycleId: string): Promise<BonusPreviewRow[]> {
  const cycle = await AppraisalCycleModel.findOne({
    _id: appraisalCycleId,
    isDeleted: { $ne: true },
  }).lean();

  if (!cycle) {
    throw new Error('Appraisal cycle not found');
  }

  const perfId = cycle.performanceCycleId;
  const reviews = await PerformanceReviewModel.find({ cycleId: perfId }).exec();
  const rows: BonusPreviewRow[] = [];

  for (const review of reviews) {
    const empId = review.employeeId as mongoose.Types.ObjectId;
    const rating = Number(review.overallRating) || 0;

    if (!isReviewEligibleForBonus(review.status)) {
      rows.push({
        userId: empId.toString(),
        reviewId: review._id.toString(),
        overallRating: rating,
        ratingBand: AppraisalRatingBand.BELOW_EXPECTATIONS,
        bonusPercent: 0,
        basicSalary: 0,
        bonusAmount: 0,
        skippedReason: 'Review not finalized',
      });
      continue;
    }

    if (rating <= 0) {
      rows.push({
        userId: empId.toString(),
        reviewId: review._id.toString(),
        overallRating: rating,
        ratingBand: AppraisalRatingBand.BELOW_EXPECTATIONS,
        bonusPercent: 0,
        basicSalary: 0,
        bonusAmount: 0,
        skippedReason: 'No overall rating',
      });
      continue;
    }

    const band = mapOverallRatingToBand(rating);
    const percent = APPRAISAL_BONUS_PERCENT_BY_BAND[band];
    const salary = await getLatestSalaryStructure(empId);
    const basic = salary ? Number(salary.basic) || 0 : 0;
    const bonusAmount = computeBonusAmount(basic, percent);

    rows.push({
      userId: empId.toString(),
      reviewId: review._id.toString(),
      overallRating: rating,
      ratingBand: band,
      bonusPercent: percent,
      basicSalary: basic,
      bonusAmount,
    });
  }

  return rows;
}
