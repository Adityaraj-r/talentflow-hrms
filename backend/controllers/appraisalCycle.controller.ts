import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppraisalCycleStatus } from '../models/AppraisalCycle';
import * as appraisalCycleService from '../services/appraisalCycle.service';
import { ResponseHandler } from '../utils/responseHandler';

const STATUSES = new Set<string>(Object.values(AppraisalCycleStatus));

export class AppraisalCycleController {
  static async createCycle(req: AuthRequest, res: Response): Promise<Response> {
    const { name, description, startDate, endDate, performanceCycleId } = req.body as Record<
      string,
      unknown
    >;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof performanceCycleId !== 'string' ||
      !performanceCycleId.trim()
    ) {
      return ResponseHandler.badRequest(res, 'name and performanceCycleId are required');
    }

    const start = startDate ? new Date(String(startDate)) : null;
    const end = endDate ? new Date(String(endDate)) : null;
    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      return ResponseHandler.badRequest(res, 'Valid startDate and endDate are required');
    }

    const doc = await appraisalCycleService.createCycle(
      {
        name: name.trim(),
        description: typeof description === 'string' ? description : undefined,
        startDate: start,
        endDate: end,
        performanceCycleId: performanceCycleId.trim(),
      },
      req.user!.id
    );

    return ResponseHandler.created(res, doc, 'Appraisal cycle created');
  }

  static async getCycles(req: AuthRequest, res: Response): Promise<Response> {
    const statusRaw = req.query.status as string | undefined;
    const includeDeleted = req.query.includeDeleted === 'true';

    let status: AppraisalCycleStatus | undefined;
    if (statusRaw) {
      if (!STATUSES.has(statusRaw)) {
        return ResponseHandler.badRequest(res, 'Invalid status filter');
      }
      status = statusRaw as AppraisalCycleStatus;
    }

    const list = await appraisalCycleService.getCycles({ status, includeDeleted });
    return ResponseHandler.success(res, list);
  }

  static async getCycleById(req: AuthRequest, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const doc = await appraisalCycleService.getCycleById(id);
    if (!doc) {
      return ResponseHandler.notFound(res, 'Appraisal cycle not found');
    }
    return ResponseHandler.success(res, doc);
  }

  static async transitionStatus(req: AuthRequest, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const { status } = req.body as { status?: string };

    if (!status || !STATUSES.has(status)) {
      return ResponseHandler.badRequest(res, 'Valid status is required');
    }

    const doc = await appraisalCycleService.transitionStatus(
      id,
      status as AppraisalCycleStatus,
      req.user!.id
    );
    return ResponseHandler.success(res, doc, 'Status updated');
  }

  static async softDeleteCycle(req: AuthRequest, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const ok = await appraisalCycleService.softDeleteCycle(id);
    if (!ok) {
      return ResponseHandler.notFound(res, 'Appraisal cycle not found');
    }
    return ResponseHandler.success(res, { deleted: true });
  }

  /** EMPLOYEE: latest published appraisal result for the signed-in user */
  static async getMyPublishedResult(req: AuthRequest, res: Response): Promise<Response> {
    const doc = await appraisalCycleService.getPublishedResultForEmployee(req.user!.id);
    if (!doc) {
      return ResponseHandler.success(res, null);
    }
    return ResponseHandler.success(res, doc);
  }
}
