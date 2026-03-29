import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { PIPModel, PIPStatus } from '../models/PIP'

export class PIPController {
  // GET /api/performance/pips — HRMANAGER sees all, MANAGER sees own, EMPLOYEE sees own
  static async getPIPs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role?.toUpperCase()
      const query: any = {}

      if (userRole !== 'HRMANAGER' && userRole !== 'SUPER ADMIN') {
        if (userRole === 'DIRECTMANAGER' || userRole === 'DEPARTMENTMANAGER') {
          query.createdBy = userId
        } else {
          query.employeeId = userId
        }
      }

      const pips = await PIPModel.find(query)
        .populate('employeeId', 'firstName lastName email department')
        .populate('createdBy', 'firstName lastName email')
        .populate('reviewerId', 'firstName lastName email')
        .populate('cycleId', 'name status')
        .sort({ createdAt: -1 })

      res.json({ success: true, data: pips })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to fetch PIPs', details: error.message })
    }
  }

  // POST /api/performance/pips — HRMANAGER, DIRECTMANAGER, DEPARTMENTMANAGER
  static async createPIP(req: AuthRequest, res: Response) {
    try {
      const {
        employeeId,
        cycleId,
        reviewerId,
        reason,
        improvementAreas,
        milestones,
        startDate,
        endDate,
        hrNotes,
        managerNotes,
      } = req.body

      if (!employeeId || !reason || !improvementAreas || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'employeeId, reason, improvementAreas, startDate, and endDate are required',
        })
      }

      if (!Array.isArray(improvementAreas) || improvementAreas.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'improvementAreas must be a non-empty array',
        })
      }

      const pip = await PIPModel.create({
        employeeId,
        cycleId,
        createdBy: req.user?.id,
        reviewerId,
        reason,
        improvementAreas,
        milestones: milestones ?? [],
        startDate,
        endDate,
        status: PIPStatus.ACTIVE,
        hrNotes,
        managerNotes,
      })

      res.status(201).json({ success: true, data: pip })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to create PIP', details: error.message })
    }
  }

  // PUT /api/performance/pips/:id — HRMANAGER, manager who created it
  static async updatePIP(req: AuthRequest, res: Response) {
    try {
      const pip = await PIPModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
        .populate('employeeId', 'firstName lastName email department')
        .populate('createdBy', 'firstName lastName email')
        .populate('reviewerId', 'firstName lastName email')

      if (!pip) return res.status(404).json({ success: false, error: 'PIP not found' })

      res.json({ success: true, data: pip })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to update PIP', details: error.message })
    }
  }
}
