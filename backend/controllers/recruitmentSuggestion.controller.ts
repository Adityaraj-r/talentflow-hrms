import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RecruitmentSuggestion from '../models/RecruitmentSuggestion.model';

const normalizeRole = (role?: string) =>
  (role || '').toString().toUpperCase().trim().replace(/\s+/g, '_');

const isAdminOrSuperAdmin = (role?: string) => {
  const r = normalizeRole(role);
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
};

const isHrManagerOrOfficer = (role?: string) => {
  const r = normalizeRole(role);

  // Allow both DB-style (HR_MANAGER/HR_OFFICER) and any legacy compact forms.
  const compact = r.replace(/_/g, '');
  return (
    r === 'HR_MANAGER' ||
    r === 'HR_OFFICER' ||
    compact === 'HRMANAGER' ||
    compact === 'HROFFICER'
  );
};

export const createRecruitmentSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!isAdminOrSuperAdmin(req.user.role)) {
      res.status(403).json({ success: false, error: 'Only Admin can raise suggestions to HR Manager' });
      return;
    }

    const { subject, message, contextType, contextRef } = req.body;
    if (!subject || !message) {
      res.status(400).json({ success: false, error: 'subject and message are required' });
      return;
    }

    const doc = await RecruitmentSuggestion.create({
      subject: String(subject).trim(),
      message: String(message).trim(),
      contextType: contextType || 'general',
      contextRef: contextRef ? String(contextRef).trim() : undefined,
      createdBy: req.user.id,
      status: 'open',
    });

    res.status(201).json({ success: true, data: doc });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to create suggestion' });
  }
};

export const listRecruitmentSuggestionsForHr = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const allowed = isAdminOrSuperAdmin(req.user.role);
    if (!allowed) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }

    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string') filter.status = status;

    const items = await RecruitmentSuggestion.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'firstName lastName email')
      .limit(200)
      .lean();

    res.json({ success: true, data: items });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to list suggestions' });
  }
};

export const listMyRecruitmentSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id || !isAdminOrSuperAdmin(req.user.role)) {
      res.status(403).json({ success: false, error: 'Admin only' });
      return;
    }

    const items = await RecruitmentSuggestion.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json({ success: true, data: items });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to list suggestions' });
  }
};

export const acknowledgeRecruitmentSuggestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (
      !req.user?.id ||
      !isAdminOrSuperAdmin(req.user.role)
    ) {
      res.status(403).json({
        success: false,
        error: 'Only ADMIN/SUPER ADMIN can acknowledge or close suggestions',
      });
      return;
    }

    const { id } = req.params;
    const { hrNote, status } = req.body;

    const nextStatus = status === 'closed' ? 'closed' : 'acknowledged';

    const updated = await RecruitmentSuggestion.findByIdAndUpdate(
      id,
      {
        status: nextStatus,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user.id,
        ...(hrNote !== undefined ? { hrNote: String(hrNote).trim() } : {}),
      },
      { new: true }
    );

    if (!updated) {
      res.status(404).json({ success: false, error: 'Suggestion not found' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to update suggestion' });
  }
};
