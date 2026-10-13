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
    let settings = await Settings.findOne().select('+hrSmtpPass');

    if (!settings) {
      settings = await Settings.create({
        companyName: 'InternsLand',
        companyEmail: 'admin@internsland.com',
        phone: '+91 0000000000',
        address: 'Pune, Maharashtra, India',
      });
    }

    const settingsObj = settings.toObject() as unknown as Record<string, unknown>;
    const hrSmtpPass = typeof settingsObj.hrSmtpPass === 'string' ? settingsObj.hrSmtpPass : '';
    delete settingsObj.hrSmtpPass;

    res.status(200).json({
      success: true,
      settings: {
        ...settingsObj,
        hrSmtpPassConfigured: Boolean(hrSmtpPass.trim()),
      },
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
    const settingsData = req.body as Record<string, unknown>;
    const userId = (req as any).user?.uid || 'system';

    let settings = await Settings.findOne().select('+hrSmtpPass');
    const incomingPass = settingsData.hrSmtpPass;
    const mergedData = { ...settingsData };
    delete (mergedData as Record<string, unknown>).hrSmtpPass;
    if (mergedData.hrSmtpPort === '' || mergedData.hrSmtpPort === undefined) {
      mergedData.hrSmtpPort = null;
    }
    if (typeof mergedData.hrSmtpPort === 'string') {
      const parsed = Number(mergedData.hrSmtpPort);
      mergedData.hrSmtpPort = Number.isFinite(parsed) ? parsed : null;
    }

    if (settings) {
      Object.assign(settings, {
        ...mergedData,
        updatedBy: userId,
      });
      if (typeof incomingPass === 'string') {
        settings.hrSmtpPass = incomingPass.trim();
      } else if (incomingPass === null) {
        settings.hrSmtpPass = '';
      }
      await settings.save();
    } else {
      settings = await Settings.create({
        ...mergedData,
        hrSmtpPass:
          typeof incomingPass === 'string'
            ? incomingPass.trim()
            : '',
        updatedBy: userId,
      });
    }

    const refreshed = await Settings.findById(settings._id).select('+hrSmtpPass');
    const settingsObj =
      (refreshed?.toObject() as unknown as Record<string, unknown>) ||
      (settings.toObject() as unknown as Record<string, unknown>);
    const hrSmtpPass = typeof settingsObj.hrSmtpPass === 'string' ? settingsObj.hrSmtpPass : '';
    delete settingsObj.hrSmtpPass;

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        ...settingsObj,
        hrSmtpPassConfigured: Boolean(hrSmtpPass.trim()),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};