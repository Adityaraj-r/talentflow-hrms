import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Document from '../models/Document.model';
import User from '../models/User.model';

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
      if (files['aadharCard'])      updateData.Documents.aadharCardPath      = files['aadharCard'][0].path;
      if (files['panCard'])         updateData.Documents.panCardPath         = files['panCard'][0].path;
      if (files['resume'])          updateData.Documents.resumePath          = files['resume'][0].path;
      if (files['educationDocs'])   updateData.Documents.educationDocsPath   = files['educationDocs'][0].path;
      if (files['passportPhoto'])   updateData.Documents.passportPhotoPath   = files['passportPhoto'][0].path;
      if (files['relievingLetter']) updateData.Documents.relievingLetterPath = files['relievingLetter'][0].path;
    }

    const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });

    if (!existingEmployee) {
      const lastEmployee = await Employee.findOne({
        employeeCode: { $regex: /^EMP-\d+/ }
      }).sort({ createdAt: -1 });

      let newEmployeeCode = "EMP-0001";

      if (lastEmployee && lastEmployee.employeeCode) {
        const lastIdParts = lastEmployee.employeeCode.split('-');
        if (lastIdParts.length === 2) {
          const lastNumber = parseInt(lastIdParts[1], 10);
          if (!isNaN(lastNumber)) {
            newEmployeeCode = `EMP-${(lastNumber + 1).toString().padStart(4, '0')}`;
          }
        }
      }
      updateData.employeeCode = newEmployeeCode;
    } else {
      delete updateData.employeeCode;
    }

    const employee = await Employee.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    if (files && employee) {
      const targetId = employee.employeeCode || employee._id.toString();

      const docNames: any = {
        aadharCard:      'Aadhar Card (Front & Back)',
        panCard:         'PAN Card',
        resume:          'Cancelled Cheque / Bank Proof',
        educationDocs:   'Highest Education Certificate',
        passportPhoto:   'Passport Photo',
        relievingLetter: 'Previous Relieving Letter',
      };

      for (const key of Object.keys(files)) {
        const fileArr = files[key];
        if (fileArr && fileArr.length > 0) {
          const file = fileArr[0];
          await new Document({
            employeeId:   targetId,
            uploadedBy:   'Onboarding System',
            fileName:     file.originalname || 'Cloud Document',
            originalName: docNames[key] || file.originalname,
            fileType:     file.mimetype,
            fileSize:     file.size ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Cloud File',
            filePath:     file.path,
            category:     'Onboarding',
            status:       'Pending',
          }).save();
        }
      }
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error: any) {
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
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllOnboardingEmployees = async (req: Request, res: Response): Promise<void> => {
  try {
    const { unenrolled } = req.query;

    let dbQuery: any = {
      employeeCode: { $regex: /^EMP-\d+/ },
      $or: [
        { "Documents.aadharCardPath":     { $exists: true, $ne: null } },
        { "Documents.panCardPath":        { $exists: true, $ne: null } },
        { "Documents.resumePath":         { $exists: true, $ne: null } },
        { "Documents.educationDocsPath":  { $exists: true, $ne: null } },
        { "Documents.passportPhotoPath":  { $exists: true, $ne: null } },
        { "Documents.relievingLetterPath":{ $exists: true, $ne: null } },
      ],
    };

    if (unenrolled === 'true') {
      dbQuery.userId       = null;
      dbQuery["department"]  = { $exists: true, $nin: [null, ""] };
      dbQuery["designation"] = { $exists: true, $nin: [null, ""] };
      dbQuery["bankDetails"] = { $exists: true, $ne: null };
      dbQuery["kycDetails"]  = { $exists: true, $ne: null };
    }

    const employees = await Employee.find(dbQuery)
      .select('firstName lastName employeeCode department gender phoneNumber createdAt onboardingStatus userId')
      .sort({ createdAt: -1 });

    res.status(200).json(employees);
  } catch (error: any) {
    res.status(500).json({ message: "Error fetching onboarding list" });
  }
};