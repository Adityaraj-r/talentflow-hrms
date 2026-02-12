import { Request, Response } from 'express';
import { PerformanceCycleModel, CycleStatus } from '../models/PerformanceCycle';
import { PerformanceReviewModel, ReviewStatus } from '../models/PerformanceReview';

// Auth Request Interface
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firebaseUid?: string;
  };
}

export class PerformanceController {
  
  // ============================================
  // 1. CREATE NEW PERFORMANCE CYCLE
  // POST /api/performance/cycles
  // ============================================
  static async createCycle(req: AuthRequest, res: Response) {
    try {
      // ✅ FIXED: Validate user authentication
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
      }

      const { name, description, startDate, endDate, status } = req.body;

      // Validation
      if (!name || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Cycle name, start date, and end date are required'
        });
      }

      // Date validation
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }

      // Create cycle
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
      res.status(500).json({
        success: false,
        error: 'Failed to create performance cycle',
        details: error.message
      });
    }
  }

  // ============================================
  // 2. GET ALL PERFORMANCE CYCLES
  // GET /api/performance/cycles
  // ============================================
  static async getCycles(req: AuthRequest, res: Response) {
    try {
      const { status } = req.query;

      // Build query
      const query: any = {};
      if (status) {
        query.status = status;
      }

      // Fetch cycles
      const cycles = await PerformanceCycleModel.find(query)
        .populate('createdBy', 'name email')
        .sort({ startDate: -1 });

      res.json({
        success: true,
        data: cycles
      });
    } catch (error: any) {
      console.error('Get cycles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance cycles',
        details: error.message
      });
    }
  }

  // ============================================
  // 3. GET SINGLE CYCLE BY ID
  // GET /api/performance/cycles/:id
  // ============================================
  static async getCycleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findById(id)
        .populate('createdBy', 'name email')
        .populate('assignedEmployees', 'name email department');

      if (!cycle) {
        return res.status(404).json({
          success: false,
          error: 'Performance cycle not found'
        });
      }

      res.json({
        success: true,
        data: cycle
      });
    } catch (error: any) {
      console.error('Get cycle by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance cycle',
        details: error.message
      });
    }
  }

  // ============================================
  // 4. UPDATE PERFORMANCE CYCLE
  // PUT /api/performance/cycles/:id
  // ============================================
  static async updateCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, startDate, endDate, status } = req.body;

      // Fetch existing cycle first
      const existingCycle = await PerformanceCycleModel.findById(id);
      
      if (!existingCycle) {
        return res.status(404).json({
          success: false,
          error: 'Performance cycle not found'
        });
      }

      // Determine final dates (use existing if not provided)
      const finalStartDate = startDate ? new Date(startDate) : existingCycle.startDate;
      const finalEndDate = endDate ? new Date(endDate) : existingCycle.endDate;

      // Date validation with final values
      if (finalStartDate >= finalEndDate) {
        return res.status(400).json({
          success: false,
          error: 'End date must be after start date'
        });
      }

      // Build update object
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (startDate) updateData.startDate = finalStartDate;
      if (endDate) updateData.endDate = finalEndDate;
      if (status) updateData.status = status;

      // Update cycle without schema validation
      const cycle = await PerformanceCycleModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: false }
      );

      res.json({
        success: true,
        message: 'Performance cycle updated successfully',
        data: cycle
      });
    } catch (error: any) {
      console.error('Update cycle error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update performance cycle',
        details: error.message
      });
    }
  }

  // ============================================
  // 5. DELETE PERFORMANCE CYCLE
  // DELETE /api/performance/cycles/:id
  // ============================================
  static async deleteCycle(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const cycle = await PerformanceCycleModel.findByIdAndDelete(id);

      if (!cycle) {
        return res.status(404).json({
          success: false,
          error: 'Performance cycle not found'
        });
      }

      // Delete associated reviews
      await PerformanceReviewModel.deleteMany({ cycleId: id });

      res.json({
        success: true,
        message: 'Performance cycle deleted successfully',
        data: { id }
      });
    } catch (error: any) {
      console.error('Delete cycle error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete performance cycle',
        details: error.message
      });
    }
  }

  // ============================================
  // 6. GET PERFORMANCE DASHBOARD STATS
  // GET /api/performance/stats
  // ============================================
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const totalCycles = await PerformanceCycleModel.countDocuments();
      const activeCycles = await PerformanceCycleModel.countDocuments({ 
        status: CycleStatus.ACTIVE 
      });

      const allCycles = await PerformanceCycleModel.find();
      const totalReviews = allCycles.reduce((sum, cycle) => sum + cycle.totalReviews, 0);
      
      // Calculate average score across all cycles
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
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance statistics',
        details: error.message
      });
    }
  }
}
