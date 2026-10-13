import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { GoalModel, GoalStatus } from '../models/Goal'

export class GoalController {
  // GET /api/performance/goals/my-goals — EMPLOYEE only
  static async getMyGoals(req: AuthRequest, res: Response) {
    try {
      const employeeId = req.user?.id
      const goals = await GoalModel.find({ employeeId })
        .populate('cycleId', 'name startDate endDate status')
        .populate('createdBy', 'firstName lastName email department designation profilePhoto')
        .sort({ createdAt: -1 })
      res.json({ success: true, data: goals })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch goals', details: error.message })
    }
  }

  // GET /api/performance/goals/team-goals — DIRECTMANAGER, DEPARTMENTMANAGER, HRMANAGER
  static async getTeamGoals(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user?.id
      const goals = await GoalModel.find({ createdBy: managerId })
        .populate('employeeId', 'firstName lastName email department designation profilePhoto employeeCode')
        .populate('createdBy', 'firstName lastName email department designation profilePhoto')
        .populate('cycleId', 'name startDate endDate status')
        .sort({ createdAt: -1 })
      res.json({ success: true, data: goals })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch team goals', details: error.message })
    }
  }

  // POST /api/performance/goals — HRMANAGER, DIRECTMANAGER, DEPARTMENTMANAGER
  static async createGoal(req: AuthRequest, res: Response) {
    try {
      const { employeeId, cycleId, title, description, weight, targetDate } = req.body
      if (!employeeId || !cycleId || !title) {
        return res.status(400).json({ success: false, error: 'employeeId, cycleId, and title are required' })
      }
      const goal = await GoalModel.create({
        employeeId,
        cycleId,
        title,
        description,
        weight: weight ?? 10,
        status: GoalStatus.NOT_STARTED,
        progress: 0,
        targetDate,
        createdBy: req.user?.id,
      })
      const full = await GoalModel.findById(goal._id)
        .populate('employeeId', 'firstName lastName email department designation profilePhoto employeeCode')
        .populate('createdBy', 'firstName lastName email department designation profilePhoto')
        .populate('cycleId', 'name startDate endDate status')
      res.status(201).json({ success: true, data: full })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to create goal', details: error.message })
    }
  }

  // PUT /api/performance/goals/:id — HRMANAGER, DIRECTMANAGER, DEPARTMENTMANAGER, EMPLOYEE
  static async updateGoal(req: AuthRequest, res: Response) {
    try {
      const goal = await GoalModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate('employeeId', 'firstName lastName email department designation profilePhoto employeeCode')
        .populate('createdBy', 'firstName lastName email department designation profilePhoto')
        .populate('cycleId', 'name startDate endDate status')
      if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' })
      res.json({ success: true, data: goal })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to update goal', details: error.message })
    }
  }

  // DELETE /api/performance/goals/:id — HRMANAGER only
  static async deleteGoal(req: AuthRequest, res: Response) {
    try {
      const goal = await GoalModel.findByIdAndDelete(req.params.id)
      if (!goal) return res.status(404).json({ success: false, error: 'Goal not found' })
      res.json({ success: true, message: 'Goal deleted successfully' })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to delete goal', details: error.message })
    }
  }
}
