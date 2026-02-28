import { Request, Response } from 'express';
import { PerformanceCycleModel, CycleStatus } from '../models/PerformanceCycle';
import { PerformanceReviewModel, ReviewStatus } from '../models/PerformanceReview';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class PerformanceController {

  static async createCycle(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, error: 'User authentication required' });

      const { name, description, startDate, endDate, status } = req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Cycle name, start date, and end date are required' });
      }

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }

      const cycle = await PerformanceCycleModel.create({
        name,
        description: description || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || CycleStatus.ACTIVE,
        createdBy: userId,
        assignedEmployees: [],
        totalReviews: 0,
        completedReviews: 0
      });

      res.status(201).json({
        success: true,
        message: 'Performance cycle created successfully',
        data: cycle
      });
    } catch (error: any) {
      console.error('Create cycle error:', error);
      res.status(500).json({ success: false, error: 'Failed to create performance cycle', details: error.message });
    }
  }

  static async getCycles(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;
      const query: any = {};
      if (status) query.status = status;

      const cycles = await PerformanceCycleModel.find(query)
        .populate('createdBy', 'name email')
        .sort({ startDate: -1 });

      res.json({ success: true, data: cycles });
    } catch (error: any) {
      console.error('Get cycles error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch performance cycles', details: error.message });
    }
  }

  static async getCycleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findById(id)
        .populate('createdBy', 'name email')
        .populate('assignedEmployees', 'name email department');

      if (!cycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      const reviews = await PerformanceReviewModel.find({ cycleId: id })
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: { ...cycle.toObject(), reviews } });
    } catch (error: any) {
      console.error('Get cycle by ID error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch performance cycle', details: error.message });
    }
  }

  static async updateCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate, status } = req.body;

      const existingCycle = await PerformanceCycleModel.findById(id);
      if (!existingCycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      const finalStartDate = startDate ? new Date(startDate) : existingCycle.startDate;
      const finalEndDate = endDate ? new Date(endDate) : existingCycle.endDate;

      if (finalStartDate >= finalEndDate) {
        return res.status(400).json({ success: false, error: 'End date must be after start date' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (startDate) updateData.startDate = finalStartDate;
      if (endDate) updateData.endDate = finalEndDate;
      if (status) updateData.status = status;

      const cycle = await PerformanceCycleModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: false }
      );

      res.json({ success: true, message: 'Performance cycle updated successfully', data: cycle });
    } catch (error: any) {
      console.error('Update cycle error:', error);
      res.status(500).json({ success: false, error: 'Failed to update performance cycle', details: error.message });
    }
  }

  static async deleteCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findByIdAndDelete(id);
      if (!cycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      await PerformanceReviewModel.deleteMany({ cycleId: id });

      res.json({ success: true, message: 'Performance cycle deleted successfully', data: { id } });
    } catch (error: any) {
      console.error('Delete cycle error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete performance cycle', details: error.message });
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalCycles = await PerformanceCycleModel.countDocuments();
      const activeCycles = await PerformanceCycleModel.countDocuments({ status: CycleStatus.ACTIVE });

      const allCycles = await PerformanceCycleModel.find();
      const totalReviews = allCycles.reduce((sum, cycle) => sum + cycle.totalReviews, 0);

      const cyclesWithScores = allCycles.filter(c => c.avgScore !== undefined && c.avgScore !== null);
      const avgScore = cyclesWithScores.length > 0
        ? cyclesWithScores.reduce((sum, cycle) => sum + (cycle.avgScore || 0), 0) / cyclesWithScores.length
        : 0;

      res.json({
        success: true,
        data: {
          totalCycles,
          activeCycles,
          totalReviews,
          avgScore: parseFloat(avgScore.toFixed(2))
        }
      });
    } catch (error: any) {
      console.error('Get stats error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch performance statistics', details: error.message });
    }
  }

  // POST /api/performance/reviews/assign
  static async assignReview(req: AuthRequest, res: Response) {
    try {
      const reviewerId = req.user?.id;
      if (!reviewerId) return res.status(401).json({ success: false, error: 'User authentication required' });

      const { cycleId, employeeId, competencies } = req.body;

      if (!cycleId || !employeeId) {
        return res.status(400).json({ success: false, error: 'Cycle ID and Employee ID are required' });
      }

      if (!competencies || !Array.isArray(competencies) || competencies.length === 0) {
        return res.status(400).json({ success: false, error: 'At least one competency is required' });
      }

      // Check cycle exists and is active
      const cycle = await PerformanceCycleModel.findById(cycleId);
      if (!cycle) return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      if (cycle.status !== CycleStatus.ACTIVE) {
        return res.status(400).json({ success: false, error: 'Reviews can only be assigned to active cycles' });
      }

      // Check for duplicate review assignment
      const existingReview = await PerformanceReviewModel.findOne({
        cycleId,
        employeeId,
        reviewerId
      });
      if (existingReview) {
        return res.status(400).json({ success: false, error: 'A review for this employee in this cycle already exists' });
      }

      // Build competencies array matching the schema
      const competencyRatings = competencies.map((c: any) => ({
        name: c.name,
        rating: 1,    
        comments: ''
      }));

      const review = await PerformanceReviewModel.create({
        cycleId,
        employeeId,
        reviewerId,
        competencies: competencyRatings,
        overallRating: 1,
        status: ReviewStatus.PENDING,
        strengths: '',
        areasForImprovement: ''
      });

      await PerformanceCycleModel.findByIdAndUpdate(cycleId, {
        $inc: { totalReviews: 1 },
        $addToSet: { assignedEmployees: employeeId }
      });

      const populatedReview = await PerformanceReviewModel.findById(review._id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');

      res.status(201).json({
        success: true,
        message: 'Review assigned successfully',
        data: populatedReview
      });
    } catch (error: any) {
      console.error('Assign review error:', error);
      res.status(500).json({ success: false, error: 'Failed to assign review', details: error.message });
    }
  }

  // GET /api/performance/reviews/pending
  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role?.toUpperCase();

      let query: any = { status: ReviewStatus.PENDING };

      if (userRole !== 'ADMIN' && userRole !== 'SUPER ADMIN') {
        query.reviewerId = userId;
      }

      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name startDate endDate status')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      console.error('Get pending reviews error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pending reviews', details: error.message });
    }
  }

  // GET /api/performance/reviews/all
  static async getAllReviews(req: AuthRequest, res: Response) {
    try {
      const { cycleId, status, employeeId } = req.query;
      const query: any = {};

      if (cycleId) query.cycleId = cycleId;
      if (status) query.status = status;
      if (employeeId) query.employeeId = employeeId;

      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name startDate endDate status')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      console.error('Get all reviews error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: error.message });
    }
  }

  // GET /api/performance/reviews/employee/:employeeId
  static async getEmployeeReviews(req: AuthRequest, res: Response) {
    try {
      const { employeeId } = req.params;

      const reviews = await PerformanceReviewModel.find({ employeeId })
        .populate('cycleId', 'name startDate endDate status')
        .populate('reviewerId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      console.error('Get employee reviews error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch employee reviews', details: error.message });
    }
  }

  // PUT /api/performance/reviews/:id/submit
  static async submitReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { competencies, overallRating, strengths, improvements } = req.body;
      const reviewerId = req.user?.id;
      const userRole = req.user?.role?.toUpperCase();

      const review = await PerformanceReviewModel.findById(id);
      if (!review) return res.status(404).json({ success: false, error: 'Review not found' });

      if (
        review.reviewerId.toString() !== reviewerId &&
        userRole !== 'ADMIN' &&
        userRole !== 'SUPER ADMIN'
      ) {
        return res.status(403).json({ success: false, error: 'Not authorized to submit this review' });
      }

      if (!overallRating || overallRating < 1 || overallRating > 5) {
        return res.status(400).json({ success: false, error: 'Overall rating must be between 1 and 5' });
      }

      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          competencies: competencies || review.competencies,
          overallRating,
          strengths: strengths || '',
          areasForImprovement: improvements || '',
          status: ReviewStatus.COMPLETED,
          submittedAt: new Date()
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status');

      const cycleReviews = await PerformanceReviewModel.find({
        cycleId: review.cycleId,
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] }
      });

      if (cycleReviews.length > 0) {
        const avgScore = cycleReviews.reduce((sum, r) => sum + r.overallRating, 0) / cycleReviews.length;
        await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
          avgScore: parseFloat(avgScore.toFixed(2)),
          $inc: { completedReviews: 1 }
        });
      }

      res.json({ success: true, message: 'Review submitted successfully', data: updatedReview });
    } catch (error: any) {
      console.error('Submit review error:', error);
      res.status(500).json({ success: false, error: 'Failed to submit review', details: error.message });
    }
  }

  // GET /api/performance/analytics/summary
  static async getAnalyticsSummary(req: AuthRequest, res: Response) {
    try {
      const totalReviews = await PerformanceReviewModel.countDocuments();
      const completedReviews = await PerformanceReviewModel.countDocuments({
        status: ReviewStatus.COMPLETED
      });
      const pendingReviews = await PerformanceReviewModel.countDocuments({
        status: ReviewStatus.PENDING
      });

      const reviews = await PerformanceReviewModel.find({
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] }
      });

      const avgScore = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
        : 0;

      res.json({
        success: true,
        data: {
          totalReviews,
          completedReviews,
          pendingReviews,
          avgScore: parseFloat(avgScore.toFixed(2))
        }
      });
    } catch (error: any) {
      console.error('Get analytics summary error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch analytics summary', details: error.message });
    }
  }
}
