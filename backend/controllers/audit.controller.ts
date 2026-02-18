import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const createLog = async (userId: string, userName: string, action: string, module: string, details: string, ipAddress: string, status: 'Success' | 'Failed' = 'Success') => {
  try {
    await AuditLog.create({
      user: userId,
      userName,
      action,
      module,
      details,
      ipAddress,
      status
    });
  } catch (error) {
    console.error('Audit Logging Error:', error);
  }
};