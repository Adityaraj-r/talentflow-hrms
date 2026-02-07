import { Request, Response } from 'express';
import Settings from '../models/Settings.model';

/**
 * GET /api/admin/settings
 * Get system settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        companyName: 'InternsLand',
        companyEmail: 'admin@internsland.com',
        phone: '+91 0000000000',
        address: 'Pune, Maharashtra, India',
      });
    }

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/settings
 * Update system settings
 */
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const settingsData = req.body;
    const userId = (req as any).user?.uid || 'system';

    let settings = await Settings.findOne();

    if (settings) {
      Object.assign(settings, {
        ...settingsData,
        updatedBy: userId,
      });
      await settings.save();
    } else {
      settings = await Settings.create({
        ...settingsData,
        updatedBy: userId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};
