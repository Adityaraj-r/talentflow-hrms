import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import AuditLog from '../models/AuditLog';

export const createLog = async (
  userId: string,
  userName: string,
  action: string,
  module: string,
  details: string,
  ipAddress: string,
  status: 'Success' | 'Failed'
) => {
  try {
    await AuditLog.create({ userId, userName, action, module, details, ipAddress, status });
  } catch {
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, module, status, search } = req.query;
    const query: any = {};

    if (module) query.module = module;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      AuditLog.countDocuments(query)
    ]);

    res.json({ success: true, data: logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};
