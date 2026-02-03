import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Activity from '../models/Activity'; // For audit logs as seen in your admin controller

/**
 * @desc    Save or Update Onboarding Progress
 * @route   POST /api/onboarding/save
 * @access  Private (Admin/HR)
 */
export const saveOnboardingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, onboardingStatus, ...updateData } = req.body;

    // --- NEW: Parse Stringified Objects from FormData ---
    if (typeof updateData.bankDetails === 'string') {
      updateData.bankDetails = JSON.parse(updateData.bankDetails);
    }
    if (typeof updateData.kycDetails === 'string') {
      updateData.kycDetails = JSON.parse(updateData.kycDetails);
    }

    // --- Handle File Uploads for Documents ---
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    if (files) {
      updateData.Documents = updateData.Documents || {};
      if (files['aadharCard']) updateData.Documents.aadharCardPath = files['aadharCard'][0].path;
      if (files['panCard']) updateData.Documents.panCardPath = files['panCard'][0].path;
      if (files['resume']) updateData.Documents.resumePath = files['resume'][0].path;
      if (files['educationDocs']) updateData.Documents.educationDocsPath = files['educationDocs'][0].path;
      if (files['passportPhoto']) updateData.Documents.passportPhotoPath = files['passportPhoto'][0].path;
      if (files['relievingLetter']) updateData.Documents.relievingLetterPath = files['relievingLetter'][0].path;
    }

    // --- Ensure EmployeeCode is Captured ---
    // If employeeCode is coming from the UI, make sure it's not null
    if (!updateData.employeeCode && req.body.employeeCode) {
      updateData.employeeCode = req.body.employeeCode;
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: updateData }, // This will update everything parsed above
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get onboarding details for a specific employee
 * @route   GET /api/onboarding/:email
 */
export const getOnboardingDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
    console.error('SERVER CRASH ERROR:', error.message); // This will show in your terminal
    res.status(500).json({ success: false, error: error.message });
  }
};