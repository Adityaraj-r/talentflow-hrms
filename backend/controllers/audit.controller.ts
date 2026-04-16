import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import AuditLog from '../models/AuditLog';

export type CreateLogOptions = {
  userRole?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
};

export const createLog = async (
  userId: string,
  userName: string,
  action: string,
  module: string,
  details: string,
  ipAddress: string,
  status: 'Success' | 'Failed',
  options?: CreateLogOptions
) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      action,
      module,
      details,
      ipAddress,
      status,
      userRole: options?.userRole,
      beforeValue: options?.beforeValue ?? null,
      afterValue: options?.afterValue ?? null,
    });
  } catch {
  }
};

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  const t = s.replace(/"/g, '""');
  return `"${t}"`;
}

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, module, status, search, format } = req.query;
    const query: Record<string, unknown> = {};

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

    if (format === 'csv') {
      const header = [
        'userId',
        'userRole',
        'userName',
        'action',
        'module',
        'details',
        'beforeValue',
        'afterValue',
        'ipAddress',
        'status',
        'createdAt',
      ].join(',');
      const lines = logs.map((row) =>
        [
          csvEscape(row.userId),
          csvEscape(row.userRole),
          csvEscape(row.userName),
          csvEscape(row.action),
          csvEscape(row.module),
          csvEscape(row.details),
          csvEscape(row.beforeValue),
          csvEscape(row.afterValue),
          csvEscape(row.ipAddress),
          csvEscape(row.status),
          csvEscape(row.createdAt?.toISOString?.() || row.createdAt),
        ].join(',')
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      res.send([header, ...lines].join('\n'));
      return;
    }

    res.json({
      success: true,
      data: logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};
