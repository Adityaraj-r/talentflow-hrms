import { Response } from 'express';
import Offer from '../models/Offer.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getOffers = async (req: AuthRequest, res: Response) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateName, salary, joiningDate } = req.body;
    const offerId = `OFF-${Date.now()}`;

    const offer = await Offer.create({
      offerId,
      candidateName,
      salary,
      joiningDate,
      createdBy: req.user?.id
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid data' });
  }
};

export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });

    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Update failed' });
  }
};