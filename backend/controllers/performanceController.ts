import { Request, Response } from 'express';
import { PerformanceCycleModel, CycleStatus } from '../models/PerformanceCycle';
import { PerformanceReviewModel, ReviewStatus } from '../models/PerformanceReview';


interface AuthRequest extends Request {
  user?: {
    id:    string;
    email: string;
    role:  string;
  };
}


export class PerformanceController {

  // ─── Cycles ──────────────────────────────────────────────────────────────

  static async createCycle(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res.status(401).json({ success: false, error: 'User authentication required' });

      const { name, description, startDate, endDate, status } = req.body;

      if (!name || !startDate || !endDate)
        return res.status(400).json({ success: false, error: 'Cycle name, start date, and end date are required' });

      if (new Date(startDate) >= new Date(endDate))
        return res.status(400).json({ success: false, error: 'End date must be after start date' });

      const cycle = await PerformanceCycleModel.create({
        name,
        description:        description || '',
        startDate:          new Date(startDate),
        endDate:            new Date(endDate),
        status:             status || CycleStatus.ACTIVE,
        createdBy:          userId,
        assignedEmployees:  [],
        totalReviews:       0,
        completedReviews:   0,
      });

      res.status(201).json({
        success: true,
        message: 'Performance cycle created successfully',
        data:    cycle,
      });
    } catch (error: any) {
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
      res.status(500).json({ success: false, error: 'Failed to fetch performance cycles', details: error.message });
    }
  }


  static async getCycleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findById(id)
        .populate('createdBy', 'name email')
        .populate('assignedEmployees', 'name email department');

      if (!cycle)
        return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      const reviews = await PerformanceReviewModel.find({ cycleId: id })
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: { ...cycle.toObject(), reviews } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch performance cycle', details: error.message });
    }
  }


  static async updateCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate, status } = req.body;

      const existingCycle = await PerformanceCycleModel.findById(id);
      if (!existingCycle)
        return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      const finalStartDate = startDate ? new Date(startDate) : existingCycle.startDate;
      const finalEndDate   = endDate   ? new Date(endDate)   : existingCycle.endDate;

      if (finalStartDate >= finalEndDate)
        return res.status(400).json({ success: false, error: 'End date must be after start date' });

      const updateData: any = {};
      if (name)                    updateData.name        = name;
      if (description !== undefined) updateData.description = description;
      if (startDate)               updateData.startDate   = finalStartDate;
      if (endDate)                 updateData.endDate     = finalEndDate;
      if (status)                  updateData.status      = status;

      const cycle = await PerformanceCycleModel.findByIdAndUpdate(
        id, updateData, { new: true, runValidators: false }
      );

      res.json({ success: true, message: 'Performance cycle updated successfully', data: cycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to update performance cycle', details: error.message });
    }
  }


  static async deleteCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findByIdAndDelete(id);
      if (!cycle)
        return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      await PerformanceReviewModel.deleteMany({ cycleId: id });

      res.json({ success: true, message: 'Performance cycle deleted successfully', data: { id } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to delete performance cycle', details: error.message });
    }
  }


  static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalCycles  = await PerformanceCycleModel.countDocuments();
      const activeCycles = await PerformanceCycleModel.countDocuments({ status: CycleStatus.ACTIVE });

      // FIXED: count total employees (role = EMPLOYEE) for PerformanceAnalytics
      // Previously totalEmployees was missing, causing analytics to always
      // fall back to an extra /users fetch on every load
      const UserModel = (await import('../models/User.model')).default;
      const totalEmployees = await UserModel.countDocuments({ role: 'EMPLOYEE', isActive: true });

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
          totalEmployees,                          // ADDED
          avgScore: parseFloat(avgScore.toFixed(2)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch performance statistics', details: error.message });
    }
  }


  // ─── Reviews ─────────────────────────────────────────────────────────────

  // POST /api/performance/reviews/assign
  static async assignReview(req: AuthRequest, res: Response) {
    try {
      const assignedById = req.user?.id;
      if (!assignedById)
        return res.status(401).json({ success: false, error: 'User authentication required' });

      // FIXED: accept reviewerId from request body instead of defaulting to
      // req.user.id — previously every review was assigned to the logged-in
      // HR Manager as the reviewer, violating the workflow
      const { cycleId, employeeId, reviewerId, competencies } = req.body;

      if (!cycleId || !employeeId || !reviewerId)
        return res.status(400).json({ success: false, error: 'Cycle ID, Employee ID, and Reviewer ID are required' });

      if (!competencies || !Array.isArray(competencies) || competencies.length === 0)
        return res.status(400).json({ success: false, error: 'At least one competency is required' });

      const cycle = await PerformanceCycleModel.findById(cycleId);
      if (!cycle)
        return res.status(404).json({ success: false, error: 'Performance cycle not found' });

      if (cycle.status !== CycleStatus.ACTIVE)
        return res.status(400).json({ success: false, error: 'Reviews can only be assigned to active cycles' });

      // Check duplicate: same employee + reviewer + cycle
      const existingReview = await PerformanceReviewModel.findOne({
        cycleId,
        employeeId,
        reviewerId,
      });
      if (existingReview)
        return res.status(400).json({ success: false, error: 'A review for this employee with this reviewer in this cycle already exists' });

      const competencyRatings = competencies.map((c: any) => ({
        name:     c.name,
        rating:   1,
        comments: '',
      }));

      const review = await PerformanceReviewModel.create({
        cycleId,
        employeeId,
        reviewerId,              // FIXED: from body, not req.user.id
        competencies:       competencyRatings,
        overallRating:      1,
        status:             ReviewStatus.PENDING,
        strengths:          '',
        areasForImprovement: '',
      });

      await PerformanceCycleModel.findByIdAndUpdate(cycleId, {
        $inc:      { totalReviews: 1 },
        $addToSet: { assignedEmployees: employeeId },
      });

      const populatedReview = await PerformanceReviewModel.findById(review._id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name status');

      res.status(201).json({
        success: true,
        message: 'Review assigned successfully',
        data:    populatedReview,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to assign review', details: error.message });
    }
  }


  // GET /api/performance/reviews/pending
  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      const userId   = req.user?.id;
      const userRole = (req.user?.role || '').toUpperCase();

      let query: any = { status: ReviewStatus.PENDING };

      // HR_MANAGER sees all pending reviews; others see only their own
      if (userRole !== 'ADMIN' && userRole !== 'SUPER ADMIN' && userRole !== 'HR_MANAGER') {
        query.reviewerId = userId;
      }

      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name startDate endDate status')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch pending reviews', details: error.message });
    }
  }


  // GET /api/performance/reviews/all
  static async getAllReviews(req: AuthRequest, res: Response) {
    try {
      const { cycleId, status, employeeId, reviewerId } = req.query;
      const query: any = {};

      if (cycleId)    query.cycleId    = cycleId;
      if (status)     query.status     = status;
      if (employeeId) query.employeeId = employeeId;
      if (reviewerId) query.reviewerId = reviewerId;   // ADDED: support reviewer filter

      const reviews = await PerformanceReviewModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name startDate endDate status')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch reviews', details: error.message });
    }
  }


  // GET /api/performance/reviews/employee/:employeeId
  static async getEmployeeReviews(req: AuthRequest, res: Response) {
    try {
      const { employeeId } = req.params;

      const reviews = await PerformanceReviewModel.find({ employeeId })
        .populate('cycleId',    'name startDate endDate status')
        .populate('reviewerId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.json({ success: true, data: reviews });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch employee reviews', details: error.message });
    }
  }


  // GET /api/performance/reviews/:id  ← NEW
  static async getReviewById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const review = await PerformanceReviewModel.findById(id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name status startDate endDate');

      if (!review)
        return res.status(404).json({ success: false, error: 'Review not found' });

      res.json({ success: true, data: review });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch review', details: error.message });
    }
  }


  // PUT /api/performance/reviews/:id/submit
  static async submitReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { competencies, strengths, improvements } = req.body;
      const reviewerId = req.user?.id;
      const userRole   = (req.user?.role || '').toUpperCase();

      const review = await PerformanceReviewModel.findById(id);
      if (!review)
        return res.status(404).json({ success: false, error: 'Review not found' });

      if (
        review.reviewerId.toString() !== reviewerId &&
        userRole !== 'ADMIN' &&
        userRole !== 'SUPER ADMIN'
      ) {
        return res.status(403).json({ success: false, error: 'Not authorized to submit this review' });
      }

      // FIXED: recalculate overallRating server-side from competencies
      // Previously trusted client-sent overallRating which bypasses
      // the Mongoose pre-save hook (findByIdAndUpdate skips hooks)
      const finalCompetencies = competencies || review.competencies;
      const serverOverallRating = finalCompetencies.length > 0
        ? parseFloat(
            (finalCompetencies.reduce((sum: number, c: any) => sum + (c.rating || 1), 0)
              / finalCompetencies.length
            ).toFixed(2)
          )
        : 1;

      if (serverOverallRating < 1 || serverOverallRating > 5)
        return res.status(400).json({ success: false, error: 'Overall rating must be between 1 and 5' });

      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          competencies:        finalCompetencies,
          overallRating:       serverOverallRating,   // FIXED: server-calculated
          strengths:           strengths || '',
          areasForImprovement: improvements || '',
          status:              ReviewStatus.COMPLETED,
          submittedAt:         new Date(),
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name status');

      // Update cycle avgScore and completedReviews count
      const cycleReviews = await PerformanceReviewModel.find({
        cycleId: review.cycleId,
        status:  { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
      });

      if (cycleReviews.length > 0) {
        const avgScore = cycleReviews.reduce((sum, r) => sum + r.overallRating, 0) / cycleReviews.length;
        await PerformanceCycleModel.findByIdAndUpdate(review.cycleId, {
          avgScore:          parseFloat(avgScore.toFixed(2)),
          $inc: { completedReviews: 1 },
        });
      }

      res.json({ success: true, message: 'Review submitted successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to submit review', details: error.message });
    }
  }


  // PUT /api/performance/reviews/:id/approve
  static async approveReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { feedback } = req.body;
      const userId   = req.user?.id;
      const userRole = (req.user?.role || '').toUpperCase();

      // FIXED: HR_MANAGER approves reviews — not ADMIN
      // Previously only ADMIN/SUPER ADMIN could approve, causing HR Manager
      // to always receive 403 on every approval attempt
      if (userRole !== 'HR_MANAGER' && userRole !== 'SUPER ADMIN') {
        return res.status(403).json({ success: false, error: 'Only HR Managers can approve reviews' });
      }

      const review = await PerformanceReviewModel.findById(id);
      if (!review)
        return res.status(404).json({ success: false, error: 'Review not found' });

      if (review.status !== ReviewStatus.COMPLETED)
        return res.status(400).json({ success: false, error: 'Only completed reviews can be approved' });

      const updatedReview = await PerformanceReviewModel.findByIdAndUpdate(
        id,
        {
          status:        ReviewStatus.APPROVED,
          approvedBy:    userId,
          approvedAt:    new Date(),
          adminFeedback: feedback || '',   // field name kept for DB compat
        },
        { new: true }
      )
        .populate('employeeId', 'firstName lastName email department')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId',    'name status');

      res.json({ success: true, message: 'Review approved successfully', data: updatedReview });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to approve review', details: error.message });
    }
  }


  // GET /api/performance/analytics/summary
  static async getAnalyticsSummary(req: AuthRequest, res: Response) {
    try {
      const totalReviews = await PerformanceReviewModel.countDocuments();
      const completedReviews = await PerformanceReviewModel.countDocuments({
        status: ReviewStatus.COMPLETED,
      });
      const pendingReviews = await PerformanceReviewModel.countDocuments({
        status: ReviewStatus.PENDING,
      });

      const reviews = await PerformanceReviewModel.find({
        status: { $in: [ReviewStatus.COMPLETED, ReviewStatus.APPROVED] },
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
          avgScore: parseFloat(avgScore.toFixed(2)),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch analytics summary', details: error.message });
    }
  }
}
