import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EmployerBrand from '../models/EmployerBrand.model';

export const getEmployerBrand = async (req: AuthRequest, res: Response) => {
  try {
    let doc = await EmployerBrand.findOne({ key: 'default' });
    if (!doc) {
      doc = await EmployerBrand.create({ key: 'default' });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: 'Failed to load employer brand' });
  }
};

export const putEmployerBrand = async (req: AuthRequest, res: Response) => {
  try {
    const { glassdoorRating, linkedInScore, employerNps, notes } = req.body;
    const update: Record<string, unknown> = {
      updatedBy: req.user?.id,
    };
    if (glassdoorRating !== undefined) update.glassdoorRating = glassdoorRating;
    if (linkedInScore !== undefined) update.linkedInScore = linkedInScore;
    if (employerNps !== undefined) update.employerNps = employerNps;
    if (notes !== undefined) update.notes = notes;

    const doc = await EmployerBrand.findOneAndUpdate(
      { key: 'default' },
      { $set: update },
      { new: true, upsert: true }
    );
    return res.status(200).json({ success: true, data: doc });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: 'Failed to save employer brand' });
  }
};
