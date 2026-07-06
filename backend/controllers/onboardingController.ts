import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import Employee from '../models/Employee.model';
import Document from '../models/Document.model';

const getLocalDocumentPath = (file: Express.Multer.File): string => {
  return `/uploads/onboarding/${path.basename(file.path)}`;
};

const uploadOnboardingFile = async (
  file: Express.Multer.File,
  emailPrefix: string
): Promise<Express.Multer.File> => {
  try {
    const cloudResult = await cloudinary.uploader.upload(file.path, {
      folder:        `hrms_onboarding/${emailPrefix}`,
      resource_type: 'auto',
      public_id:     `${emailPrefix}-${file.fieldname}-${Date.now()}`,
    });

    fs.unlink(file.path, (err) => {
      if (err) console.warn("Could not remove local onboarding upload:", err.message);
    });

    return {
      ...file,
      path: cloudResult.secure_url,
      size: cloudResult.bytes || file.size,
    };
  } catch (error: any) {
    console.warn(
      `Cloudinary onboarding upload failed for ${file.originalname}; using local file instead:`,
      error.message || error
    );
    return {
      ...file,
      path: getLocalDocumentPath(file),
    };
  }
};

export const saveOnboardingProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, onboardingStatus, ...updateData } = req.body;
   
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: "Email is required." });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    delete updateData._id;
    delete updateData.id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.userId;

    if (onboardingStatus) {
      updateData.onboardingStatus = onboardingStatus;
    }

    if (typeof updateData.bankDetails === 'string') {
      updateData.bankDetails = JSON.parse(updateData.bankDetails);
    }
    if (typeof updateData.kycDetails === 'string') {
      updateData.kycDetails = JSON.parse(updateData.kycDetails);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const emailPrefix = normalizedEmail.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'unknown_candidate';
    const uploadedFiles: { [fieldname: string]: Express.Multer.File[] } = {};

    if (files) {
      for (const [fieldName, fileArr] of Object.entries(files)) {
        uploadedFiles[fieldName] = await Promise.all(
          fileArr.map((file) => uploadOnboardingFile(file, emailPrefix))
        );
      }

      updateData.Documents = updateData.Documents || {};
      if (uploadedFiles['aadharCard'])      updateData.Documents.aadharCardPath      = uploadedFiles['aadharCard'][0].path;
      if (uploadedFiles['panCard'])         updateData.Documents.panCardPath         = uploadedFiles['panCard'][0].path;
      if (uploadedFiles['resume'])          updateData.Documents.resumePath          = uploadedFiles['resume'][0].path;
      if (uploadedFiles['educationDocs'])   updateData.Documents.educationDocsPath   = uploadedFiles['educationDocs'][0].path;
      if (uploadedFiles['passportPhoto'])   updateData.Documents.passportPhotoPath   = uploadedFiles['passportPhoto'][0].path;
      if (uploadedFiles['relievingLetter']) updateData.Documents.relievingLetterPath = uploadedFiles['relievingLetter'][0].path;
    }
console.log("STEP 1 - Checking employee");
    const existingEmployee = await Employee.findOne({ email: normalizedEmail });

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
console.log("STEP 2 - Saving employee");
    const employee = await Employee.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    if (Object.keys(uploadedFiles).length > 0 && employee) {
      const targetId = employee.employeeCode || employee._id.toString();

      const docNames: any = {
        aadharCard:      'Aadhar Card (Front & Back)',
        panCard:         'PAN Card',
        resume:          'Cancelled Cheque / Bank Proof',
        educationDocs:   'Highest Education Certificate',
        passportPhoto:   'Passport Photo',
        relievingLetter: 'Previous Relieving Letter',
      };

      for (const key of Object.keys(uploadedFiles)) {
        const fileArr = uploadedFiles[key];
        if (fileArr && fileArr.length > 0) {
          const file = fileArr[0];
          console.log("STEP 3 - Saving document:", key);
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
console.log("STEP 4 - Save completed");
    res.status(200).json({ success: true, data: employee });
  }  catch (error: any) {
  console.log("=======================================");
  console.log("ONBOARDING SAVE ERROR");
  console.dir(error, { depth: null });
  console.log("=======================================");

  console.error("Message:", error.message);
  console.error("Stack:", error.stack);

  if (error.http_code) {
    console.error("HTTP Code:", error.http_code);
  }

  if (error.storageErrors) {
    console.error("Storage Errors:", error.storageErrors);
  }

  res.status(500).json({
    success: false,
    message: error.message || "Failed to save onboarding data",
    error: error.message,
    stack:
      process.env.NODE_ENV === "development"
        ? error.stack
        : undefined,
  });
}
} 

export const getOnboardingDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const employee = await Employee.findOne({
      email: req.params.email,
    });

    if (!employee) {
      res.status(404).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
