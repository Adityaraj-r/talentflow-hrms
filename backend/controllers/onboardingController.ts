import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Document from '../models/Document.model'; 
import Activity from '../models/Activity'; 

export const saveOnboardingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, onboardingStatus, ...updateData } = req.body;

    if (typeof updateData.bankDetails === 'string') {
      updateData.bankDetails = JSON.parse(updateData.bankDetails);
    }
    if (typeof updateData.kycDetails === 'string') {
      updateData.kycDetails = JSON.parse(updateData.kycDetails);
    }

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

    
    if (!updateData.employeeCode && req.body.employeeCode) {
      updateData.employeeCode = req.body.employeeCode;
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    //   BRIDGE TO DIGITAL LOCKER 
    
    if (files && employee) {
      const targetId = employee.employeeCode || employee._id.toString();

      const fileKeys = Object.keys(files);
      
      const docNames: any = {
        'aadharCard': 'Aadhaar Card',
        'panCard': 'PAN Card',
        'resume': 'Resume',
        'educationDocs': 'Education Certificate',
        'passportPhoto': 'Passport Photo',
        'relievingLetter': 'Relieving Letter'
      };

      for (const key of fileKeys) {
        const fileArr = files[key];
        if (fileArr && fileArr.length > 0) {
          const file = fileArr[0];

          // Create Digital Locker Record
          await new Document({
            employeeId: targetId, 
            uploadedBy: 'Onboarding System', 
            fileName: file.filename,
            originalName: docNames[key] || file.originalname, 
            fileType: file.mimetype,
            fileSize: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            filePath: `/uploads/onboarding/${file.filename}`, 
            category: 'Onboarding', 
            status: 'Pending'
          }).save();
        }
      }
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
    console.error("Onboarding Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getOnboardingDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findOne({ email: req.params.email });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
    console.error('SERVER CRASH ERROR:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};


export const getAllOnboardingEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
  
    const employees = await Employee.find({})
      .select('firstName lastName employeeCode department createdAt onboardingStatus')
      .sort({ createdAt: -1 }); 

    res.status(200).json(employees);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching onboarding list" });
  }
};
