import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as notificationService from '../services/notification.service';
import { ResponseHandler } from '../utils/responseHandler';

export class NotificationController {
  static async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const skip = req.query.skip ? Number(req.query.skip) : undefined;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === '1';

    const { items, total } = await notificationService.getNotifications(req.user!.id, {
      limit: Number.isFinite(limit) ? limit : undefined,
      skip: Number.isFinite(skip) ? skip : undefined,
      unreadOnly,
    });

    return ResponseHandler.success(res, { items, total });
  }

  static async markRead(req: AuthRequest, res: Response): Promise<Response> {
    const id = String(req.params.id);
    const updated = await notificationService.markRead(req.user!.id, id);
    if (!updated) {
      return ResponseHandler.notFound(res, 'Notification not found');
    }
    return ResponseHandler.success(res, { read: true });
  }
}
