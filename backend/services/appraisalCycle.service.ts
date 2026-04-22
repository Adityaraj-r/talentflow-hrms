import mongoose from 'mongoose';
import {
  AppraisalCycleModel,
  AppraisalCycleStatus,
  IAppraisalCycle,
} from '../models/AppraisalCycle';
import { PerformanceCycleModel } from '../models/PerformanceCycle';
import { PerformanceReviewModel } from '../models/PerformanceReview';
import SalaryStructure from '../models/salaryStructure.model';
import {
  APPRAISAL_BONUS_PERCENT_BY_BAND,
  AppraisalRatingBand,
  mapOverallRatingToBand,
} from '../constants/appraisalRatingBands';
import * as bonusService from './bonus.service';
import * as notificationService from './notification.service';

export interface CreateAppraisalCyclePayload {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  performanceCycleId: string;
}

const ALLOWED: Record<AppraisalCycleStatus, AppraisalCycleStatus[]> = {
  [AppraisalCycleStatus.DRAFT]: [AppraisalCycleStatus.ACTIVE],
  [AppraisalCycleStatus.ACTIVE]: [AppraisalCycleStatus.CLOSED],
  [AppraisalCycleStatus.CLOSED]: [AppraisalCycleStatus.PROCESSED],
  [AppraisalCycleStatus.PROCESSED]: [],
};

export async function createCycle(
  payload: CreateAppraisalCyclePayload,
  createdBy: string
): Promise<IAppraisalCycle> {
  const perf = await PerformanceCycleModel.findById(payload.performanceCycleId).exec();
  if (!perf) {
    throw new Error('Performance cycle not found');
  }

  const existing = await AppraisalCycleModel.findOne({
    performanceCycleId: payload.performanceCycleId,
    isDeleted: { $ne: true },
  }).exec();

  if (existing) {
    throw new Error('An appraisal cycle already exists for this performance cycle');
  }

  const doc = await AppraisalCycleModel.create({
    name: payload.name.trim(),
    description: payload.description?.trim(),
    startDate: new Date(payload.startDate),
    endDate: new Date(payload.endDate),
    status: AppraisalCycleStatus.DRAFT,
    performanceCycleId: new mongoose.Types.ObjectId(payload.performanceCycleId),
    createdBy: new mongoose.Types.ObjectId(createdBy),
    isDeleted: false,
  });

  return doc;
}

export async function transitionStatus(
  cycleId: string,
  newStatus: AppraisalCycleStatus,
  actorId: string
): Promise<IAppraisalCycle> {
  const cycle = await AppraisalCycleModel.findOne({
    _id: cycleId,
    isDeleted: { $ne: true },
  }).exec();

  if (!cycle) {
    throw new Error('Appraisal cycle not found');
  }

  const current = cycle.status as AppraisalCycleStatus;
  const allowed = ALLOWED[current];
  if (!allowed?.includes(newStatus)) {
    throw new Error(`Invalid transition ${current} → ${newStatus}`);
  }

  if (newStatus === AppraisalCycleStatus.ACTIVE) {
    cycle.status = AppraisalCycleStatus.ACTIVE;
    await cycle.save();
    await notificationService.broadcastCycleActive(cycle._id.toString());
  } else if (newStatus === AppraisalCycleStatus.CLOSED) {
    cycle.status = AppraisalCycleStatus.CLOSED;
    cycle.closedAt = new Date();
    cycle.closedBy = new mongoose.Types.ObjectId(actorId);
    await cycle.save();
  } else if (newStatus === AppraisalCycleStatus.PROCESSED) {
    await bonusService.runBonusForCycle(cycle._id.toString(), actorId);
    cycle.status = AppraisalCycleStatus.PROCESSED;
    cycle.processedAt = new Date();
    cycle.processedBy = new mongoose.Types.ObjectId(actorId);
    cycle.broadcastProcessedSentAt = new Date();
    await cycle.save();

    const empIds = await PerformanceReviewModel.distinct('employeeId', {
      cycleId: cycle.performanceCycleId,
    });

    for (const uid of empIds) {
      await notificationService.notifyResultPublished(
        uid as mongoose.Types.ObjectId,
        cycle._id.toString()
      );
    }
  } else {
    cycle.status = newStatus;
    await cycle.save();
  }

  const fresh = await AppraisalCycleModel.findById(cycle._id).exec();
  if (!fresh) throw new Error('Appraisal cycle not found after update');
  return fresh;
}

export interface AppraisalCycleFilters {
  status?: AppraisalCycleStatus;
  includeDeleted?: boolean;
}

export async function getCycles(filters: AppraisalCycleFilters = {}): Promise<IAppraisalCycle[]> {
  const q: Record<string, unknown> = {};
  if (!filters.includeDeleted) {
    q.isDeleted = { $ne: true };
  }
  if (filters.status) {
    q.status = filters.status;
  }
  return AppraisalCycleModel.find(q).sort({ startDate: -1 }).exec();
}

export async function getCycleById(id: string): Promise<IAppraisalCycle | null> {
  return AppraisalCycleModel.findOne({
    _id: id,
    isDeleted: { $ne: true },
  }).exec();
}

/** Latest processed appraisal cycle where the employee has a review (for employee self-service UI). */
export interface EmployeePublishedAppraisalResult {
  appraisalCycleId: string;
  performanceCycleId: string;
  cycleName: string;
  overallRating: number;
  ratingBand: AppraisalRatingBand;
  bonusPercent: number;
  bonusAmount: number;
  processedAt?: Date | null;
}

export async function getPublishedResultForEmployee(
  userId: string
): Promise<EmployeePublishedAppraisalResult | null> {
  const uid = new mongoose.Types.ObjectId(userId);

  const processedCycles = await AppraisalCycleModel.find({
    status: AppraisalCycleStatus.PROCESSED,
    isDeleted: { $ne: true },
  })
    .sort({ processedAt: -1 })
    .exec();

  for (const ac of processedCycles) {
    const review = await PerformanceReviewModel.findOne({
      cycleId: ac.performanceCycleId,
      employeeId: uid,
    }).exec();

    if (!review) continue;

    const rating = Number(review.overallRating) || 0;
    const bandFromRating = mapOverallRatingToBand(rating);

    const salary = await SalaryStructure.findOne({ userId: uid }).sort({ effectiveFrom: -1 }).exec();
    const snap = salary?.appraisalBonusSnapshot;
    const cycleMatch =
      snap?.appraisalCycleId != null && snap.appraisalCycleId.toString() === ac._id.toString();

    let ratingBand = bandFromRating;
    if (cycleMatch && snap?.ratingBand) {
      const rb = snap.ratingBand as AppraisalRatingBand;
      if (Object.values(AppraisalRatingBand).includes(rb)) {
        ratingBand = rb;
      }
    }

    let bonusPercent = APPRAISAL_BONUS_PERCENT_BY_BAND[ratingBand];
    if (cycleMatch && snap?.bonusPercentApplied != null) {
      bonusPercent = Number(snap.bonusPercentApplied);
    }

    let bonusAmount = 0;
    if (cycleMatch && salary?.performanceBonusAmount != null) {
      bonusAmount = Number(salary.performanceBonusAmount) || 0;
    } else if (cycleMatch && snap?.bonusAmount != null) {
      bonusAmount = Number(snap.bonusAmount) || 0;
    }

    return {
      appraisalCycleId: ac._id.toString(),
      performanceCycleId: ac.performanceCycleId.toString(),
      cycleName: ac.name,
      overallRating: rating,
      ratingBand,
      bonusPercent,
      bonusAmount,
      processedAt: ac.processedAt ?? null,
    };
  }

  return null;
}

export async function softDeleteCycle(cycleId: string): Promise<boolean> {
  const res = await AppraisalCycleModel.updateOne(
    { _id: cycleId },
    { $set: { isDeleted: true } }
  ).exec();
  return res.modifiedCount > 0;
}
