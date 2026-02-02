import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Settings from '../models/Settings.model';

/**
 * Get system settings (returns single settings document)
 */
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    console.log('📋 Fetching system settings...');
    
    // Find or create settings (only one document should exist)
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('⚠️ No settings found, creating default settings...');
      settings = await Settings.create({});
    }
    
    console.log('✅ Settings retrieved successfully');
    
    return res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('❌ Get settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
};

/**
 * Update system settings
 */
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Updating system settings...');
    console.log('📦 Update data:', req.body);
    
    const userId = req.user?.id;
    const updateData = {
      ...req.body,
      updatedBy: userId,
      updatedAt: new Date()
    };
    
    // Find and update, or create if doesn't exist
    let settings = await Settings.findOne();
    
    if (!settings) {
      console.log('⚠️ No settings found, creating new...');
      settings = await Settings.create(updateData);
    } else {
      settings = await Settings.findOneAndUpdate(
        {},
        updateData,
        { new: true, runValidators: true }
      );
    }
    
    console.log('✅ Settings updated successfully');
    
    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error: any) {
    console.error('❌ Update settings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
};
