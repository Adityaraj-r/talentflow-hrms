import { Request, Response } from 'express';
import TAPolicy from '../models/TAPolicy.model';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTAPolicy = async (req: Request, res: Response) => {
  try {
    let policy = await TAPolicy.findOne();
    
    if (!policy) {
      policy = await TAPolicy.create({
        lateGracePeriodMins: 15,
        standardWorkHours: 9,
        maxMissedPunches: 3,
        halfDayLateThresholdMins: 120
      });
    }

    res.status(200).json({ success: true, data: policy });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTAPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const userId = req.user?.id;

    const policy = await TAPolicy.findOneAndUpdate(
      {}, 
      { $set: { ...updates, updatedBy: userId } },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: 'Time & Attendance Policies updated successfully', 
      data: policy 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update policies', 
      error: error.message 
    });
  }
};