import { Response } from 'express';
import Offer from '../models/Offer.model';
import { AuthRequest } from '../middleware/auth.middleware';

const CEO_OFFER_THRESHOLD = () => Number(process.env.CEO_OFFER_SALARY_THRESHOLD || 250000);

const normalizeRole = (role?: string) =>
  (role || '').toString().toUpperCase().replace(/\s+/g, '_');

export const getOffers = async (req: AuthRequest, res: Response) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getOfferById = async (req: AuthRequest, res: Response) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const createOffer = async (req: AuthRequest, res: Response) => {
  try {
    const { candidateName, salary, joiningDate } = req.body;
    const numSalary = Number(salary);
    const offerId = `OFF-${Date.now()}`;
    const needsCeo = Number.isFinite(numSalary) && numSalary >= CEO_OFFER_THRESHOLD();
    const status = needsCeo ? 'Pending CEO Approval' : 'Offered';

    const offer = await Offer.create({
      offerId,
      candidateName,
      salary: numSalary,
      joiningDate,
      status,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Invalid data' });
  }
};

export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    if (offer.status === 'Pending CEO Approval') {
      return res.status(403).json({
        success: false,
        error: 'Offer is pending CEO approval',
      });
    }
    offer.status = status as 'Offered' | 'Accepted' | 'Declined';
    await offer.save();
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Update failed' });
  }
};

export const ceoApproveOffer = async (req: AuthRequest, res: Response) => {
  try {
    const role = normalizeRole(req.user?.role);
    if (role !== 'CEO') {
      return res.status(403).json({ success: false, error: 'CEO approval only' });
    }
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Offer not found' });
    if (offer.status !== 'Pending CEO Approval') {
      return res.status(400).json({ success: false, error: 'Offer is not pending CEO approval' });
    }
    offer.status = 'Offered';
    offer.ceoApprovedBy = req.user?.id as any;
    offer.ceoApprovedAt = new Date();
    await offer.save();
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Approval failed' });
  }
};
