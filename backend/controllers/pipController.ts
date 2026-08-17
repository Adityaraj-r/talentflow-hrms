import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { PIPModel, PIPStatus } from '../models/PIP'
import * as notificationService from '../services/notification.service';

// TODO: confirm these against the actual stored role strings (roleSeeder.ts / User model)
// before relying on this — rest of the codebase uses underscored roles like
// HR_MANAGER, FINANCE_MANAGER, PAYROLL_OFFICER, HR_OFFICER.
const ORG_WIDE_PIP_ROLES = new Set(['HR_MANAGER', 'SUPER_ADMIN']);
const MANAGER_ROLES = new Set(['DIRECT_MANAGER', 'DEPARTMENT_MANAGER']);

// Fields a client is allowed to patch via PUT /pips/:id.
// Anything not listed here (employeeId, createdBy, _id, etc.) is ignored,
// so a request body can't silently reassign ownership or identity fields.
const PIP_PATCHABLE_FIELDS = [
  'reviewerId',
  'reason',
  'improvementAreas',
  'milestones',
  'startDate',
  'endDate',
  'status',
  'hrNotes',
  'managerNotes',
] as const;

export class PIPController {
  // GET /api/performance/pips — HRMANAGER sees all, MANAGER sees own, EMPLOYEE sees own
  static async getPIPs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id
      const userRole = req.user?.role?.toUpperCase()
      const query: any = {}

      if (userRole && !ORG_WIDE_PIP_ROLES.has(userRole)) {
        if (userRole && MANAGER_ROLES.has(userRole)) {
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
      await notificationService.notifyPIPCreated(
        pip.employeeId,
        pip._id.toString(),
        pip.reason,
        pip.startDate,
        pip.endDate
      );
      res.status(201).json({ success: true, data: pip })
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'Failed to create PIP', details: error.message })
    }
  }

  // PUT /api/performance/pips/:id — HRMANAGER, manager who created it
  static async updatePIP(req: AuthRequest, res: Response) {
    try {
      const pip = await PIPModel.findById(req.params.id);

      if (!pip) {
        return res.status(404).json({
          success: false,
          error: 'PIP not found',
        });
      }

      const previousStatus = pip.status;
      // Keyed by title so we compare by identity, not array position —
      // safe against reordering or insertion in the incoming milestones array.
      const previousCompletedByTitle = new Map(
        pip.milestones.map((m) => [m.title, m.completed])
      );

      // Whitelist the patch instead of Object.assign(pip, req.body) —
      // prevents a request body from overwriting employeeId, createdBy, _id, etc.
      for (const field of PIP_PATCHABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          (pip as any)[field] = req.body[field];
        }
      }

      await pip.save();

      const updatedMilestones = pip.milestones;

      // Detect newly completed milestones by title, not index
      for (const current of updatedMilestones) {
        const wasCompleted = previousCompletedByTitle.get(current.title) ?? false;

        if (current.completed && !wasCompleted) {
          // Notify employee
          await notificationService.notifyPIPMilestoneCompleted(
            pip.employeeId,
            pip._id.toString(),
            current.title
          );

          // Also notify reviewer if one exists
          if (
            pip.reviewerId &&
            pip.reviewerId.toString() !== pip.employeeId.toString()
          ) {
            await notificationService.notifyPIPMilestoneCompleted(
              pip.reviewerId,
              pip._id.toString(),
              current.title
            );
          }
        }
      }

      // Status changed
      if (previousStatus !== pip.status) {
        if (pip.status === PIPStatus.COMPLETED) {
          await notificationService.notifyPIPCompleted(
            pip.employeeId,
            pip._id.toString()
          );
        }

        if (pip.status === PIPStatus.FAILED) {
          await notificationService.notifyPIPFailed(
            pip.employeeId,
            pip._id.toString()
          );
        }

        if (pip.status === PIPStatus.CANCELLED) {
          await notificationService.notifyPIPCancelled(
            pip.employeeId,
            pip._id.toString()
          );
        }
      }

      const populated = await PIPModel.findById(pip._id)
        .populate('employeeId', 'firstName lastName email department')
        .populate('createdBy', 'firstName lastName email')
        .populate('reviewerId', 'firstName lastName email');

      res.json({
        success: true,
        data: populated,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to update PIP',
        details: error.message,
      });
    }
  }
}