import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.middleware';
import { PerformanceCycleModel, CycleStatus } from '../models/PerformanceCycle';
import { PerformanceReviewModel, ReviewStatus } from '../models/PerformanceReview';

export class PerformanceController {

  static async createCycle(req: AuthRequest, res: Response) {
    try {
      const { name, description, startDate, endDate } = req.body;
      if (!name || !startDate || !endDate)
        return res.status(400).json({ success: false, error: 'Name, startDate, and endDate are required' });
      const cycle = await PerformanceCycleModel.create({
        name, description, startDate, endDate,
        status: CycleStatus.DRAFT,
        createdBy: req.user?.id,
      });
      res.status(201).json({ success: true, data: cycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCycles(req: AuthRequest, res: Response) {
    try {
      const cycles = await PerformanceCycleModel.find().sort({ createdAt: -1 });
      res.json({ success: true, data: cycles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getCycleById(req: AuthRequest, res: Response) {
    try {
      const cycle = await PerformanceCycleModel.findById(req.params.id);
      if (!cycle) return res.status(404).json({ success: false, error: 'Cycle not found' });
      res.json({ success: true, data: cycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateCycle(req: AuthRequest, res: Response) {
    try {
      const cycle = await PerformanceCycleModel.findByIdAndUpdate(
        req.params.id, req.body, { new: true }
      );
      if (!cycle) return res.status(404).json({ success: false, error: 'Cycle not found' });
      res.json({ success: true, data: cycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteCycle(req: AuthRequest, res: Response) {
    try {
      const cycle = await PerformanceCycleModel.findByIdAndDelete(req.params.id);
      if (!cycle) return res.status(404).json({ success: false, error: 'Cycle not found' });
      res.json({ success: true, message: 'Cycle deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalCycles = await PerformanceCycleModel.countDocuments();
      const activeCycles = await PerformanceCycleModel.countDocuments({ status: CycleStatus.ACTIVE });
      const totalReviews = await PerformanceReviewModel.countDocuments();
      const completedReviews = await PerformanceReviewModel.countDocuments({ status: ReviewStatus.COMPLETED });
      const pendingReviews = await PerformanceReviewModel.countDocuments({ status: ReviewStatus.PENDING });
      const reviews = await PerformanceReviewModel.find({
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
      });
      const avgScore =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.length
          : 0;
      const UserModel = (await import('../models/User.model')).default;
      const totalEmployees = await UserModel.countDocuments({ role: 'EMPLOYEE', isActive: true });
      const allCycles = await PerformanceCycleModel.find();
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
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch stats', details: error.message });
    }
  }

  static async assignReview(req: AuthRequest, res: Response) {
    try {
      const assignedById = req.user?.id;
      if (!assignedById)
        return res.status(401).json({ success: false, error: 'User authentication required' });
      const { cycleId, employeeId, reviewerId, competencies } = req.body;
      if (!cycleId || !employeeId || !reviewerId)
        return res.status(400).json({ success: false, error: 'Cycle ID, Employee ID, and Reviewer ID are required' });
      if (!competencies || !Array.isArray(competencies) || competencies.length === 0)
        return res.status(400).json({ success: false, error: 'At least one competency is required' });
      const cycle = await PerformanceCycleModel.findById(cycleId);
      if (!cycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });
      if (cycle.status !== CycleStatus.ACTIVE)
        return res.status(400).json({ success: false, error: 'Reviews can only be assigned to active cycles' });
      const existingReview = await PerformanceReviewModel.findOne({ cycleId, employeeId, reviewerId });
      if (existingReview)
        return res.status(400).json({ success: false, error: 'A review for this employee with this reviewer already exists' });
      const competencyRatings = competencies.map((c: any) => ({ name: c.name, rating: 1, comments: '' }));
      const review = await PerformanceReviewModel.create({
        cycleId, employeeId,
        reviewerId,
        competencies: competencyRatings,
        overallRating: 0,
        status: ReviewStatus.PENDING,
        strengths: '',
        areasForImprovement: '',
      });
      await PerformanceCycleModel.findByIdAndUpdate(cycleId, {
        $inc: { totalReviews: 1 },
        $addToSet: { assignedEmployees: employeeId },
      });
      const populatedReview = await PerformanceReviewModel.findById(review.id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      res.status(201).json({ success: true, message: 'Review assigned successfully', data: populatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to assign review', details: error.message });
    }
  }

  static async getAllReviews(req: AuthRequest, res: Response) {
    try {
      const { cycleId, status, employeeId, reviewerId } = req.query;
      const query: any = {};
      if (cycleId) query.cycleId = cycleId;
      if (status) query.status = status;
      if (employeeId) query.employeeId = employeeId;
      if (reviewerId) query.reviewerId = reviewerId;
      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name startDate endDate status')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: error.message });
    }
  }

  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role?.toUpperCase();
      const query: any = { status: ReviewStatus.PENDING };
      if (userRole !== 'ADMIN' && userRole !== 'SUPER ADMIN' && userRole !== 'HRMANAGER') {
        query.reviewerId = userId;
      }
      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name startDate endDate status')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch pending reviews', details: error.message });
    }
  }

  static async getEmployeeReviews(req: AuthRequest, res: Response) {
    try {
      const { employeeId } = req.params;
      const reviews = await PerformanceReviewModel.find({ employeeId })
        .populate('cycleId', 'name startDate endDate status')
        .populate('reviewerId', 'firstName lastName email')
        .sort({ createdAt: -1 });
      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch employee reviews', details: error.message });
    }
  }

  static async getReviewById(req: AuthRequest, res: Response) {
    try {
      const review = await PerformanceReviewModel.findById(req.params.id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      res.json({ success: true, data: review });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async submitReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { competencies, strengths, areasForImprovement, managerComments } = req.body;
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      const finalCompetencies = competencies || review.competencies;
      const serverOverallRating =
        finalCompetencies.length > 0
          ? parseFloat(
              (finalCompetencies.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / finalCompetencies.length).toFixed(2)
            )
          : 0;
      if (serverOverallRating < 0 || serverOverallRating > 5)
        return res.status(400).json({ success: false, error: 'Overall rating must be between 0 and 5' });
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          competencies: finalCompetencies,
          overallRating: serverOverallRating,
          strengths: strengths || '',
          areasForImprovement: areasForImprovement || '',
          managerComments: managerComments || '',
          status: ReviewStatus.COMPLETED,
          submittedAt: new Date(),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      // Update cycle stats
      const cycleReviews = await PerformanceReviewModel.find({
        cycleId: review.cycleId,
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
      });
      if (cycleReviews.length > 0) {
        const avgScore = cycleReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / cycleReviews.length;
        await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
          avgScore: parseFloat(avgScore.toFixed(2)),
          $inc: { completedReviews: 1 },
        });
      }
      res.json({ success: true, message: 'Review submitted successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to submit review', details: error.message });
    }
  }

  static async approveReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role?.toUpperCase();
      if (userRole !== 'HRMANAGER' && userRole !== 'SUPER ADMIN')
        return res.status(403).json({ success: false, error: 'Only HR Managers can approve reviews' });
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      if (review.status !== ReviewStatus.COMPLETED)
        return res.status(400).json({ success: false, error: 'Only completed reviews can be approved' });
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          status: ReviewStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
          adminFeedback: feedback || '',
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      res.json({ success: true, message: 'Review approved successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to approve review', details: error.message });
    }
  }

  // POST /api/performance/self-assessment  (EMPLOYEE only)
  static async submitSelfAssessment(req: AuthRequest, res: Response) {
    try {
      const { cycleId, selfRating, selfComments } = req.body;
      const employeeId = req.user?.id;
      if (!cycleId || !selfRating)
        return res.status(400).json({ success: false, error: 'cycleId and selfRating are required' });
      if (selfRating < 1 || selfRating > 5)
        return res.status(400).json({ success: false, error: 'selfRating must be between 1 and 5' });
      const review = await PerformanceReviewModel.findOne({ cycleId, employeeId });
      if (!review)
        return res.status(404).json({ success: false, error: 'No review assigned for this employee in this cycle' });
      if (review.status !== ReviewStatus.PENDING)
        return res.status(400).json({ success: false, error: 'Self assessment already submitted' });
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        review._id,
        {
          selfRating,
          selfComments: selfComments || '',
          status: ReviewStatus.SELF_ASSESSMENT_DONE,
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      res.json({ success: true, message: 'Self assessment submitted successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to submit self assessment', details: error.message });
    }
  }

  // POST /api/performance/manager-review  (DIRECTMANAGER, DEPARTMENTMANAGER)
  static async submitManagerReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId, competencies, strengths, areasForImprovement, managerComments } = req.body;
      const reviewerId = req.user?.id;
      if (!reviewId)
        return res.status(400).json({ success: false, error: 'reviewId is required' });
      const review = await PerformanceReviewModel.findById(reviewId);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      // Verify this manager is the assigned reviewer
      if (review.reviewerId.toString() !== reviewerId?.toString())
        return res.status(403).json({ success: false, error: 'You are not the assigned reviewer for this review' });
      const finalCompetencies = competencies || review.competencies;
      const serverOverallRating =
        finalCompetencies.length > 0
          ? parseFloat(
              (finalCompetencies.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / finalCompetencies.length).toFixed(2)
            )
          : 0;
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        reviewId,
        {
          competencies: finalCompetencies,
          overallRating: serverOverallRating,
          strengths: strengths || '',
          areasForImprovement: areasForImprovement || '',
          managerComments: managerComments || '',
          status: ReviewStatus.MANAGER_REVIEW_DONE,
          submittedAt: new Date(),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      res.json({ success: true, message: 'Manager review submitted successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to submit manager review', details: error.message });
    }
  }

  // PATCH /api/performance/hr-review/:id  (HRMANAGER only)
  static async submitHRReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { adminFeedback } = req.body;
      const userRole = req.user?.role?.toUpperCase();
      if (userRole !== 'HRMANAGER' && userRole !== 'SUPER ADMIN')
        return res.status(403).json({ success: false, error: 'Only HR Managers can submit HR reviews' });
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      if (review.status !== ReviewStatus.MANAGER_REVIEW_DONE)
        return res.status(400).json({ success: false, error: 'Review must be in Manager Review Done status' });
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          adminFeedback: adminFeedback || '',
          status: ReviewStatus.HR_REVIEWED,
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      res.json({ success: true, message: 'HR review submitted successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to submit HR review', details: error.message });
    }
  }

  // PATCH /api/performance/finalize/:id  (HRMANAGER only)
  static async finalizeReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role?.toUpperCase();
      if (userRole !== 'HRMANAGER' && userRole !== 'SUPER ADMIN')
        return res.status(403).json({ success: false, error: 'Only HR Managers can finalize reviews' });
      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
      if (review.status !== ReviewStatus.HR_REVIEWED)
        return res.status(400).json({ success: false, error: 'Review must be HR Reviewed before finalizing' });
      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          status: ReviewStatus.COMPLETED,
          approvedBy: userId,
          approvedAt: new Date(),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');
      // Update cycle stats
      const cycleReviews = await PerformanceReviewModel.find({
        cycleId: review.cycleId,
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
      });
      if (cycleReviews.length > 0) {
        const avgScore = cycleReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / cycleReviews.length;
        await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
          avgScore: parseFloat(avgScore.toFixed(2)),
        });
      }
      res.json({ success: true, message: 'Review finalized successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to finalize review', details: error.message });
    }
  }

  // GET /api/performance/my-review/:cycleId  (EMPLOYEE only)
  static async getMyReview(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.params;
      const employeeId = req.user?.id;
      const review = await PerformanceReviewModel.findOne({ cycleId, employeeId })
        .populate('cycleId', 'name startDate endDate status')
        .populate('reviewerId', 'firstName lastName email');
      if (!review)
        return res.status(404).json({ success: false, error: 'No review found for this cycle' });
      res.json({ success: true, data: review });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch your review', details: error.message });
    }
  }

  // GET /api/performance/analytics-summary
  static async getAnalyticsSummary(req: AuthRequest, res: Response) {
    try {
      const totalReviews = await PerformanceReviewModel.countDocuments();
      const completedReviews = await PerformanceReviewModel.countDocuments({ status: ReviewStatus.COMPLETED });
      const pendingReviews = await PerformanceReviewModel.countDocuments({ status: ReviewStatus.PENDING });
      const reviews = await PerformanceReviewModel.find({
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
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
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch analytics summary', details: error.message });
    }
  }
}
