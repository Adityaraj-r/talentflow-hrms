import { Request, Response } from 'express';
import Settings from '../models/Settings.model';

export const getCompanyInfo = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(200).json({
        success: true,
        companyName: 'HRMS System',
      });
    }

    res.status(200).json({
      success: true,
      companyName: settings.companyName,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message,
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};