import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { PerformanceCycleModel, CycleStatus } from '../models/PerformanceCycle';
import { PerformanceReviewModel } from '../models/PerformanceReview';
import { createLog } from './audit.controller';
import {
  WorkflowStage,
  canonicalStatus,
  isTerminalImmutable,
  assertReadyForSelfAssessment,
  assertHrReviewOrder,
  assertManagerReviewOrder,
  assertCalibrationOrder,
  assertFinalizeOrder,
  computeOverallFromCompetencies,
  assertCeoReviewAfterHr,
} from '../services/pmsWorkflow.service';
import {
  assertCanViewReview,
  resolvePmsScope,
  canReadPerformanceOrg,
} from '../services/pmsScope.service';
import { evaluateAndNotifyManagersTeamComplete } from '../services/notification.service';
import { logger } from '../utils/logger';

/** Fire-and-forget PMS notification hook — must not affect review HTTP responses */
function scheduleTeamCompleteNotification(cycleId: mongoose.Types.ObjectId | undefined): void {
  if (!cycleId) return;
  void evaluateAndNotifyManagersTeamComplete(cycleId).catch((err: unknown) =>
    logger.error('evaluateAndNotifyManagersTeamComplete failed', err)
  );
}

/** Populates for PerformanceReview refs — keep in sync across all review queries */
const POP_USER_PUBLIC =
  'firstName lastName email department designation profilePhoto employeeCode';
const POP_REVIEWER_PUBLIC =
  'firstName lastName email department designation profilePhoto employeeCode';
const POP_CYCLE_SHORT = 'name status';
const POP_CYCLE_FULL = 'name startDate endDate status';

async function auditPms(
  req: AuthRequest,
  action: string,
  details: string,
  before?: unknown,
  after?: unknown
): Promise<void> {
  const ip = String(req.headers['x-forwarded-for'] || req.ip || 'unknown');
  await createLog(
    req.user?.id || 'system',
    [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || req.user?.email || 'Unknown',
    action,
    'PMS',
    details,
    ip,
    'Success',
    { userRole: req.user?.role, beforeValue: before ?? null, afterValue: after ?? null }
  );
}

function viewerFromReq(req: AuthRequest) {
  return {
    _id: new mongoose.Types.ObjectId(req.user!.id),
    role: req.user!.role,
    department: req.user!.department ?? null,
  };
}

async function loadUserLean(id: string) {
  return User.findById(id).select('firstName lastName email role department').lean();
}

async function overlapExists(startDate: Date, endDate: Date, excludeId?: string): Promise<boolean> {
  const q: Record<string, unknown> = {
    status: { $in: [CycleStatus.DRAFT, CycleStatus.ACTIVE] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  };
  if (excludeId) (q as { _id: { $ne: string } })._id = { $ne: excludeId };
  const found = await PerformanceCycleModel.findOne(q).select('_id').lean();
  return !!found;
}

function allowedOrgAnalytics(role?: string): boolean {
  const r = String(role || '')
    .toUpperCase()
    .replace(/[\s_]/g, '');
  return (
    r === 'HRMANAGER' ||
    r === 'HROFFICER' ||
    r === 'CEO' ||
    r === 'PAYROLLOFFICER'
  );
}

export class PerformanceController {
  static async createCycle(req: AuthRequest, res: Response) {
    try {
      const { name, description, startDate, endDate } = req.body;
      if (!name || !startDate || !endDate)
        return res.status(400).json({ success: false, error: 'Name, startDate, and endDate are required' });
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (await overlapExists(s, e))
        return res.status(409).json({
          success: false,
          error: 'Another cycle already exists in this date range (draft or active).',
        });
      const cycle = await PerformanceCycleModel.create({
        name,
        description,
        startDate: s,
        endDate: e,
        status: CycleStatus.DRAFT,
        createdBy: req.user?.id,
      });
      await auditPms(req, 'CREATE_CYCLE', `Created cycle ${name}`, null, cycle.toJSON());
      res.status(201).json({ success: true, data: cycle });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: msg });
    }
  }

  static async getCycles(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const scope = await resolvePmsScope(viewerFromReq(req));
      let cycles = await PerformanceCycleModel.find().sort({ createdAt: -1 });
      if (scope === 'self') {
        const uid = req.user!.id;
        cycles = cycles.filter(
          (c) =>
            Array.isArray(c.assignedEmployees) &&
            c.assignedEmployees.some((id) => String(id) === uid)
        );
      }
      res.json({ success: true, data: cycles });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: msg });
    }
  }

  static async getCycleById(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const cycle = await PerformanceCycleModel.findById(req.params.id);
      if (!cycle) return res.status(404).json({ success: false, error: 'Cycle not found' });
      const scope = await resolvePmsScope(viewerFromReq(req));
      if (scope === 'self') {
        const uid = req.user!.id;
        const ok =
          Array.isArray(cycle.assignedEmployees) &&
          cycle.assignedEmployees.some((id) => String(id) === uid);
        if (!ok) return res.status(403).json({ success: false, error: 'Access denied' });
      }
      res.json({ success: true, data: cycle });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: msg });
    }
  }

  static async updateCycle(req: AuthRequest, res: Response) {
    try {
      const before = await PerformanceCycleModel.findById(req.params.id).lean();
      if (!before) return res.status(404).json({ success: false, error: 'Cycle not found' });
      const patch = { ...req.body } as Record<string, unknown>;
      if (patch.startDate && patch.endDate) {
        if (
          await overlapExists(
            new Date(String(patch.startDate)),
            new Date(String(patch.endDate)),
            String(req.params.id)
          )
        )
          return res.status(409).json({
            success: false,
            error: 'Updated dates overlap another draft or active cycle.',
          });
      }
      const cycle = await PerformanceCycleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
      await auditPms(req, 'UPDATE_CYCLE', `Updated cycle ${before.name}`, before, cycle?.toJSON());
      res.json({ success: true, data: cycle });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: msg });
    }
  }

  static async deleteCycle(req: AuthRequest, res: Response) {
    try {
      const before = await PerformanceCycleModel.findById(req.params.id);
      if (!before) return res.status(404).json({ success: false, error: 'Cycle not found' });
      await PerformanceCycleModel.findByIdAndDelete(req.params.id);
      await auditPms(req, 'DELETE_CYCLE', `Deleted cycle ${before.name}`, before.toJSON(), null);
      res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: msg });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      if (!allowedOrgAnalytics(req.user?.role))
        return res.status(403).json({ success: false, error: 'HR-only aggregate statistics' });

      const totalCycles = await PerformanceCycleModel.countDocuments();
      const activeCycles = await PerformanceCycleModel.countDocuments({ status: CycleStatus.ACTIVE });
      const totalReviews = await PerformanceReviewModel.countDocuments();
      const terminal = [
        WorkflowStage.FINAL_APPROVED,
        WorkflowStage.FEEDBACK_RELEASED,
        'approved',
        'completed',
      ];
      const completedReviews = await PerformanceReviewModel.countDocuments({
        status: { $in: terminal },
      });
      const pendingReviews = await PerformanceReviewModel.countDocuments({
        status: { $nin: terminal },
      });
      const reviews = await PerformanceReviewModel.find({
        status: {
          $in: [
            WorkflowStage.FINAL_APPROVED,
            WorkflowStage.FEEDBACK_RELEASED,
            'approved',
            'completed',
          ],
        },
      });
      const avgScore =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length
          : 0;
      const UserModel = (await import('../models/User.model.js')).default as unknown as typeof import('../models/User.model').default;
      const totalEmployees = await UserModel.countDocuments({ role: 'EMPLOYEE', isActive: true });
      res.json({
        success: true,
        data: {
          totalCycles,
          activeCycles,
          totalReviews,
          completedReviews,
          pendingReviews,
          totalEmployees,
          avgScore: parseFloat(avgScore.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch stats', details: msg });
    }
  }

  static async assignReview(req: AuthRequest, res: Response) {
    try {
      const assignedById = req.user?.id;
      if (!assignedById)
        return res.status(401).json({ success: false, error: 'User authentication required' });
      const { cycleId, employeeId, reviewerId, competencies, requiresCeoReview } = req.body;
      if (!cycleId || !employeeId || !reviewerId)
        return res.status(400).json({ success: false, error: 'Cycle ID, Employee ID, and Reviewer ID are required' });
      if (!competencies || !Array.isArray(competencies) || competencies.length === 0)
        return res.status(400).json({ success: false, error: 'At least one competency is required' });
      const cycle = await PerformanceCycleModel.findById(cycleId);
      if (!cycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });
      if (cycle.status !== CycleStatus.ACTIVE)
        return res.status(400).json({ success: false, error: 'Reviews can only be assigned to active cycles' });

      const dup = await PerformanceReviewModel.findOne({ cycleId, employeeId });
      if (dup)
        return res.status(400).json({
          success: false,
          error: 'This employee already has a review for this cycle.',
        });

      const competencyRatings = competencies.map((c: { name: string }) => ({
        name: c.name,
        rating: 1,
        comments: '',
      }));
      const review = await PerformanceReviewModel.create({
        cycleId,
        employeeId,
        reviewerId,
        competencies: competencyRatings,
        overallRating: 0,
        status: WorkflowStage.GOALS_PENDING,
        requiresCeoReview: !!requiresCeoReview,
        strengths: '',
        areasForImprovement: '',
      });
      await PerformanceCycleModel.findByIdAndUpdate(cycleId, {
        $inc: { totalReviews: 1 },
        $addToSet: { assignedEmployees: employeeId },
      });
      const populatedReview = await PerformanceReviewModel.findById(review.id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);
      await auditPms(req, 'ASSIGN_REVIEW', `Assigned review ${review.id}`, null, populatedReview?.toJSON());
      res.status(201).json({ success: true, message: 'Review assigned successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to assign review', details: msg });
    }
  }

  /** Employee or manager confirms goal definitions are complete for this review. */
  static async confirmGoals(req: AuthRequest, res: Response) {
    try {
      const review = await PerformanceReviewModel.findById(req.params.id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const emp = await loadUserLean(review.employeeId.toString());
      await assertCanViewReview({
        viewer: viewerFromReq(req),
        reviewEmployeeId: review.employeeId,
        reviewerId: review.reviewerId,
        employeeDepartment: (emp?.department as string) || null,
      });
      const c = canonicalStatus(review.status);
      if (c !== WorkflowStage.GOALS_PENDING)
        return res.status(400).json({ success: false, error: 'Goals already confirmed or workflow started' });
      const { GoalModel } = await import('../models/Goal.js');
      const gc = await GoalModel.countDocuments({ employeeId: review.employeeId, cycleId: review.cycleId });
      if (gc < 1)
        return res.status(400).json({ success: false, error: 'Add at least one goal before confirming.' });
      const before = review.toObject();
      review.status = WorkflowStage.GOALS_LOCKED;
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'CONFIRM_GOALS', `Goals locked for review ${review.id}`, before, review.toObject());
      const populatedReview = await PerformanceReviewModel.findById(review._id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);
      res.json({ success: true, data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      const code = msg.startsWith('Access denied') ? 403 : 400;
      res.status(code).json({ success: false, error: msg });
    }
  }

  static async getAllReviews(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const { cycleId, status, employeeId, reviewerId } = req.query;
      const query: Record<string, unknown> = {};
      if (cycleId) query.cycleId = cycleId;
      if (status) query.status = status;
      if (employeeId) query.employeeId = employeeId;
      if (reviewerId) query.reviewerId = reviewerId;

      const scope = await resolvePmsScope(viewerFromReq(req));
      if (scope === 'self') query.employeeId = req.user!.id;
      if (scope === 'team') query.reviewerId = req.user!.id;

      let reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .sort({ createdAt: -1 });

      if (scope === 'department') {
        const vd = req.user?.department || '';
        reviews = reviews.filter((r) => {
          const emp = r.employeeId as { department?: string } | null;
          return emp?.department && vd && emp.department === vd;
        });
      }

      res.json({ success: true, data: reviews });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: msg });
    }
  }

  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const terminal = [
        WorkflowStage.FINAL_APPROVED,
        WorkflowStage.FEEDBACK_RELEASED,
        'approved',
        'completed',
      ];
      const query: Record<string, unknown> = { status: { $nin: terminal } };
      const scope = await resolvePmsScope(viewerFromReq(req));
      if (scope === 'team') query.reviewerId = req.user!.id;
      if (scope === 'self') query.employeeId = req.user!.id;

      let reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .sort({ createdAt: -1 });

      if (scope === 'department') {
        const vd = req.user?.department || '';
        reviews = reviews.filter((r) => {
          const emp = r.employeeId as { department?: string } | null;
          return emp?.department && vd && emp.department === vd;
        });
      }

      res.json({ success: true, data: reviews });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch pending reviews', details: msg });
    }
  }

  static async getEmployeeReviews(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const { employeeId } = req.params;
      const viewer = viewerFromReq(req);
      if (viewer._id.toString() !== employeeId && (await resolvePmsScope(viewer)) === 'self')
        return res.status(403).json({ success: false, error: 'Access denied' });

      const reviews = await PerformanceReviewModel.find({ employeeId })
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .sort({ createdAt: -1 });
      res.json({ success: true, data: reviews });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch employee reviews', details: msg });
    }
  }

  static async getReviewById(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const review = await PerformanceReviewModel.findById(req.params.id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .populate('approvedBy', POP_REVIEWER_PUBLIC)
        .populate('calibratedBy', POP_REVIEWER_PUBLIC)
        .populate('ceoReviewerId', POP_REVIEWER_PUBLIC);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const emp = review.employeeId as { department?: string } | null;
      await assertCanViewReview({
        viewer: viewerFromReq(req),
        reviewEmployeeId: review.employeeId as mongoose.Types.ObjectId,
        reviewerId: review.reviewerId as mongoose.Types.ObjectId,
        employeeDepartment: emp?.department ?? null,
      });
      res.json({ success: true, data: review });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg.includes('Access denied') ? 403 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  }

  /** Goals attached to this review's employee + cycle (requires performance read + review scope). */
  static async getGoalsForReview(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      const review = await PerformanceReviewModel.findById(req.params.reviewId);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const emp = await loadUserLean(review.employeeId.toString());
      await assertCanViewReview({
        viewer: viewerFromReq(req),
        reviewEmployeeId: review.employeeId as mongoose.Types.ObjectId,
        reviewerId: review.reviewerId as mongoose.Types.ObjectId,
        employeeDepartment: (emp?.department as string) || null,
      });
      const { GoalModel } = await import('../models/Goal.js');
      const goals = await GoalModel.find({
        cycleId: review.cycleId,
        employeeId: review.employeeId,
      })
        .populate(
          'createdBy',
          'firstName lastName email department designation profilePhoto employeeCode'
        )
        .populate('cycleId', POP_CYCLE_FULL)
        .sort({ createdAt: -1 })
        .lean();
      res.json({ success: true, data: goals });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      const status = msg.includes('Access denied') ? 403 : 500;
      res.status(status).json({ success: false, error: msg });
    }
  }

  /** Manager / reviewer submits competency review after self-assessment */
  static async submitReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const body = req.body as Record<string, unknown>;
      const competencies = body.competencies as { rating?: number }[] | undefined;
      const strengths = (body.strengths as string) || '';
      const areasFromBody = (body.areasForImprovement as string) || (body.improvements as string) || '';
      const managerComments = (body.managerComments as string) || '';

      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st))
        return res.status(403).json({ success: false, error: 'Review is locked after final approval.' });
      assertManagerReviewOrder(st);

      const emp = await loadUserLean(review.employeeId.toString());
      await assertCanViewReview({
        viewer: viewerFromReq(req),
        reviewEmployeeId: review.employeeId,
        reviewerId: review.reviewerId,
        employeeDepartment: (emp?.department as string) || null,
      });

      if (review.reviewerId.toString() !== req.user!.id)
        return res.status(403).json({ success: false, error: 'Only the assigned reviewer may submit this review.' });

      const finalComp = competencies || review.competencies;
      const overallRating = computeOverallFromCompetencies(finalComp as { rating?: number }[]);
      if (overallRating < 0 || overallRating > 5)
        return res.status(400).json({ success: false, error: 'Overall rating must be between 0 and 5' });

      const before = review.toObject();
      review.competencies = finalComp as typeof review.competencies;
      review.overallRating = overallRating;
      review.strengths = strengths;
      review.areasForImprovement = areasFromBody;
      review.managerComments = managerComments;
      review.status = WorkflowStage.MANAGER_REVIEW_DONE;
      review.submittedAt = new Date();
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);

      await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
        $inc: { completedReviews: 1 },
      });

      await auditPms(req, 'SUBMIT_MANAGER_REVIEW', `Manager review ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Review submitted successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  /** Legacy HR approve — maps to final step only when applicable; prefer finalApprove flow */
  static async approveReview(req: AuthRequest, res: Response) {
    return PerformanceController.finalApprove(req, res);
  }

  static async submitSelfAssessment(req: AuthRequest, res: Response) {
    try {
      const { cycleId, selfRating, selfComments } = req.body;
      const employeeId = req.user?.id;
      if (!cycleId || selfRating == null)
        return res.status(400).json({ success: false, error: 'cycleId and selfRating are required' });
      if (selfRating < 1 || selfRating > 5)
        return res.status(400).json({ success: false, error: 'selfRating must be between 1 and 5' });

      const review = await PerformanceReviewModel.findOne({ cycleId, employeeId });
      if (!review) return res.status(404).json({ success: false, error: 'No review assigned for this employee in this cycle' });

      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st))
        return res.status(403).json({ success: false, error: 'Review is immutable after approval.' });

      const ready = await assertReadyForSelfAssessment(
        review.status,
        review.employeeId as mongoose.Types.ObjectId,
        review.cycleId as mongoose.Types.ObjectId
      );
      if (!ready.ok) return res.status(400).json({ success: false, error: ready.message });

      const before = review.toObject();
      review.selfRating = selfRating;
      review.selfComments = selfComments || '';
      review.status = WorkflowStage.SELF_ASSESSMENT_DONE;
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'SELF_ASSESSMENT', `Self assessment cycle ${cycleId}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(review._id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Self assessment submitted successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to submit self assessment', details: msg });
    }
  }

  static async submitManagerReview(req: AuthRequest, res: Response) {
    try {
      const body = req.body as Record<string, unknown>;
      const reviewId = body.reviewId as string | undefined;
      if (!reviewId) return res.status(400).json({ success: false, error: 'reviewId is required' });
      const competencies = body.competencies as { rating?: number }[] | undefined;
      const strengths = (body.strengths as string) || '';
      const areasFromBody =
        (body.areasForImprovement as string) || (body.improvements as string) || '';
      const managerComments = (body.managerComments as string) || '';

      const review = await PerformanceReviewModel.findById(reviewId);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st))
        return res.status(403).json({ success: false, error: 'Review is locked after final approval.' });
      assertManagerReviewOrder(st);

      const emp = await loadUserLean(review.employeeId.toString());
      await assertCanViewReview({
        viewer: viewerFromReq(req),
        reviewEmployeeId: review.employeeId,
        reviewerId: review.reviewerId,
        employeeDepartment: (emp?.department as string) || null,
      });

      if (review.reviewerId.toString() !== req.user!.id)
        return res.status(403).json({ success: false, error: 'You are not the assigned reviewer for this review' });

      const finalComp = competencies || review.competencies;
      const overallRating = computeOverallFromCompetencies(finalComp as { rating?: number }[]);
      if (overallRating < 0 || overallRating > 5)
        return res.status(400).json({ success: false, error: 'Overall rating must be between 0 and 5' });

      const before = review.toObject();
      review.competencies = finalComp as typeof review.competencies;
      review.overallRating = overallRating;
      review.strengths = strengths;
      review.areasForImprovement = areasFromBody;
      review.managerComments = managerComments;
      review.status = WorkflowStage.MANAGER_REVIEW_DONE;
      review.submittedAt = new Date();
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);

      await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
        $inc: { completedReviews: 1 },
      });

      await auditPms(req, 'SUBMIT_MANAGER_REVIEW', `Manager review ${reviewId}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(reviewId)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Manager review submitted successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async submitHRReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { adminFeedback } = req.body as { adminFeedback?: string };
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st))
        return res.status(403).json({ success: false, error: 'Review is locked.' });
      assertHrReviewOrder(st);

      const before = review.toObject();
      review.adminFeedback = adminFeedback || '';
      review.status = WorkflowStage.HR_REVIEWED;
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'HR_REVIEW', `HR review ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'HR review submitted successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async submitCeoReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { ceoComments } = req.body as { ceoComments?: string };
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      if (!review.requiresCeoReview)
        return res.status(400).json({ success: false, error: 'CEO review not required for this review.' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st)) return res.status(403).json({ success: false, error: 'Review is locked.' });
      assertCeoReviewAfterHr(st);

      const before = review.toObject();
      review.ceoComments = ceoComments || '';
      review.ceoReviewedAt = new Date();
      review.ceoReviewerId = new mongoose.Types.ObjectId(req.user!.id);
      review.status = WorkflowStage.CEO_REVIEWED;
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'CEO_REVIEW', `CEO review ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'CEO review recorded', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async submitCalibration(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { competencies, calibrationNotes } = req.body as {
        competencies?: { name: string; rating: number; comments?: string }[];
        calibrationNotes?: string;
      };
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st)) return res.status(403).json({ success: false, error: 'Review is locked.' });
      assertCalibrationOrder(st, !!review.requiresCeoReview);

      const before = review.toObject();
      if (competencies?.length) {
        review.competencies = competencies;
        review.overallRating = computeOverallFromCompetencies(competencies);
      }
      review.calibrationNotes = calibrationNotes || '';
      review.calibratedAt = new Date();
      review.calibratedBy = new mongoose.Types.ObjectId(req.user!.id);
      review.status = WorkflowStage.CALIBRATED;
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'CALIBRATION', `Calibration ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Calibration saved', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async finalApprove(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id;
      const { feedback } = req.body as { feedback?: string };
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (isTerminalImmutable(st)) return res.status(403).json({ success: false, error: 'Already finalized.' });
      assertFinalizeOrder(st);

      const before = review.toObject();
      review.status = WorkflowStage.FINAL_APPROVED;
      review.adminFeedback = feedback ?? review.adminFeedback ?? '';
      review.approvedBy = new mongoose.Types.ObjectId(req.user!.id);
      review.approvedAt = new Date();
      review.immutableLockedAt = new Date();
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);

      await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
        avgScore: review.overallRating,
      });

      await auditPms(req, 'FINAL_APPROVE', `Final approval ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Review finalized successfully', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  static async releaseFeedback(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const st = canonicalStatus(review.status);
      if (st !== WorkflowStage.FINAL_APPROVED)
        return res.status(400).json({ success: false, error: 'Final HR approval required before releasing feedback.' });

      const before = review.toObject();
      review.status = WorkflowStage.FEEDBACK_RELEASED;
      review.feedbackReleasedAt = new Date();
      await review.save();
      scheduleTeamCompleteNotification(review.cycleId as mongoose.Types.ObjectId);
      await auditPms(req, 'RELEASE_FEEDBACK', `Feedback released ${id}`, before, review.toObject());

      const populatedReview = await PerformanceReviewModel.findById(id)
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('reviewerId', POP_REVIEWER_PUBLIC)
        .populate('cycleId', POP_CYCLE_SHORT);

      res.json({ success: true, message: 'Feedback released to employee', data: populatedReview });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(400).json({ success: false, error: msg });
    }
  }

  /** PATCH /finalize/:id — alias for finalApprove (legacy path) */
  static async finalizeReview(req: AuthRequest, res: Response) {
    return PerformanceController.finalApprove(req, res);
  }

  static async getMyReview(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.params;
      const employeeId = req.user?.id;
      const review = await PerformanceReviewModel.findOne({ cycleId, employeeId })
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .populate('reviewerId', POP_REVIEWER_PUBLIC);
      if (!review) return res.status(404).json({ success: false, error: 'No review found for this cycle' });
      res.json({ success: true, data: review });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch your review', details: msg });
    }
  }

  /** Org-wide charts: dept averages, histogram, pipeline counts, cycle completion — HR analytics roles only */
  static async getDashboardAnalytics(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      if (!allowedOrgAnalytics(req.user?.role))
        return res.status(403).json({ success: false, error: 'HR-only analytics' });

      const terminal = new Set<string>([
        WorkflowStage.FINAL_APPROVED,
        WorkflowStage.FEEDBACK_RELEASED,
        'approved',
        'completed',
      ]);

      const reviews = await PerformanceReviewModel.find({})
        .populate('employeeId', POP_USER_PUBLIC)
        .populate('cycleId', POP_CYCLE_FULL)
        .lean();

      const pendingActionsByStage: Record<string, number> = {};
      const ratingHistogram = [1, 2, 3, 4, 5].map((bucket) => ({ bucket, count: 0 }));
      const deptMap: Record<string, { sum: number; n: number }> = {};

      for (const r of reviews) {
        const st = canonicalStatus(String(r.status ?? ''));
        if (!terminal.has(st)) {
          pendingActionsByStage[st] = (pendingActionsByStage[st] ?? 0) + 1;
        }

        const rating = Number(r.overallRating) || 0;
        if (rating > 0) {
          const b = Math.min(5, Math.max(1, Math.round(rating)));
          ratingHistogram[b - 1].count += 1;
        }

        const emp = r.employeeId as { department?: string | null } | null;
        const deptRaw =
          emp && typeof emp === 'object' && emp.department && String(emp.department).trim()
            ? String(emp.department).trim()
            : 'Unassigned';
        if (!deptMap[deptRaw]) deptMap[deptRaw] = { sum: 0, n: 0 };
        if (rating > 0) {
          deptMap[deptRaw].sum += rating;
          deptMap[deptRaw].n += 1;
        }
      }

      const departmentAvgRating = Object.entries(deptMap)
        .map(([department, v]) => ({
          department,
          avgRating: v.n ? parseFloat((v.sum / v.n).toFixed(2)) : 0,
          count: v.n,
        }))
        .sort((a, b) => b.count - a.count);

      const cycles = await PerformanceCycleModel.find({}).sort({ createdAt: -1 }).lean();
      const cycleCompletion = cycles.map((c) => ({
        cycleId: String(c._id),
        name: c.name,
        totalReviews: c.totalReviews ?? 0,
        completedReviews: c.completedReviews ?? 0,
        pct:
          (c.totalReviews ?? 0) > 0
            ? Math.round(((c.completedReviews ?? 0) / (c.totalReviews ?? 1)) * 100)
            : 0,
      }));

      const rated = reviews
        .filter((r) => {
          const st = canonicalStatus(String(r.status ?? ''));
          return (
            terminal.has(st) &&
            (Number(r.overallRating) || 0) > 0 &&
            r.employeeId &&
            typeof r.employeeId === 'object'
          );
        })
        .sort((a, b) => (Number(b.overallRating) || 0) - (Number(a.overallRating) || 0))
        .slice(0, 5);

      const topPerformers = rated.map((r) => {
        const e = r.employeeId as {
          firstName?: string;
          lastName?: string;
          department?: string;
        };
        const name =
          [e?.firstName, e?.lastName].filter(Boolean).join(' ').trim() || 'N/A';
        return {
          reviewId: String(r._id),
          name,
          department: e?.department?.trim() || 'N/A',
          rating: Number(r.overallRating) || 0,
        };
      });

      res.json({
        success: true,
        data: {
          pendingActionsByStage,
          ratingHistogram,
          departmentAvgRating,
          cycleCompletion,
          topPerformers,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to build dashboard analytics', details: msg });
    }
  }

  static async getAnalyticsSummary(req: AuthRequest, res: Response) {
    try {
      if (!(await canReadPerformanceOrg(viewerFromReq(req))))
        return res.status(403).json({ success: false, error: 'Performance read permission required' });
      if (!allowedOrgAnalytics(req.user?.role))
        return res.status(403).json({ success: false, error: 'HR-only analytics' });

      const totalReviews = await PerformanceReviewModel.countDocuments();
      const completedReviews = await PerformanceReviewModel.countDocuments({
        status: { $in: [WorkflowStage.FINAL_APPROVED, WorkflowStage.FEEDBACK_RELEASED, 'completed', 'approved'] },
      });
      const pendingReviews = await PerformanceReviewModel.countDocuments({
        status: { $nin: [WorkflowStage.FINAL_APPROVED, WorkflowStage.FEEDBACK_RELEASED, 'completed', 'approved'] },
      });
      const reviews = await PerformanceReviewModel.find({
        status: {
          $in: [
            WorkflowStage.FINAL_APPROVED,
            WorkflowStage.FEEDBACK_RELEASED,
            'completed',
            'approved',
          ],
        },
      });
      const avgScore =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length
          : 0;
      res.json({
        success: true,
        data: {
          totalReviews,
          completedReviews,
          pendingReviews,
          avgScore: parseFloat(avgScore.toFixed(2)),
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      res.status(500).json({ success: false, error: 'Failed to fetch analytics summary', details: msg });
    }
  }
}
