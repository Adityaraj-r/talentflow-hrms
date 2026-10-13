import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as bonusService from '../services/bonus.service';
import { ResponseHandler } from '../utils/responseHandler';

export class BonusController {
  static async runBonusForCycle(req: AuthRequest, res: Response): Promise<Response> {
    const cycleId = String(req.params.cycleId);
    const result = await bonusService.runBonusForCycle(cycleId, req.user!.id);
    return ResponseHandler.success(res, result, 'Bonus run completed');
  }

  static async getBonusPreview(req: AuthRequest, res: Response): Promise<Response> {
    const cycleId = String(req.params.cycleId);
    const rows = await bonusService.getBonusPreview(cycleId);
    return ResponseHandler.success(res, rows);
  }
}
