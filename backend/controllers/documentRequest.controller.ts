import { Request, Response } from 'express';
import DocumentRequest from '../models/DocumentRequest.model';
import Document from '../models/Document.model';
import Employee from '../models/Employee.model';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentType, purpose } = req.body;
    const requestingUser = (req as any).user;
    const userId = requestingUser._id || requestingUser.id;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    const newRequest = new DocumentRequest({
      employeeId: employee.employeeCode,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      documentType,
      purpose,
      status: 'Pending'
    });

    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMyRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;
    const userId = requestingUser._id || requestingUser.id;

    const employee = await Employee.findOne({ userId });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    const requests = await DocumentRequest.find({ employeeId: employee.employeeCode }).sort({ requestDate: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await DocumentRequest.find().sort({ requestDate: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const fulfillRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const requestingUser = (req as any).user;

    if (!req.file) {
      res.status(400).json({ success: false, error: "No document file provided" });
      return;
    }

    const documentRequest = await DocumentRequest.findById(id);
    if (!documentRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    const cloudFolder = `hrms/Requested_Documents/${documentRequest.employeeId}`;
    const safeDocName = documentRequest.documentType.replace(/[^a-zA-Z0-9]/g, '');
    const customPublicId = `${documentRequest.employeeId}-${safeDocName}-${Date.now()}`;

    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      folder: cloudFolder,
      resource_type: 'auto',
      public_id: customPublicId,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    let mappedCategory = 'Employment';
    if (['Salary Certificate', 'Form 16'].includes(documentRequest.documentType)) mappedCategory = 'Payroll';
    if (documentRequest.documentType === 'Visa NOC') mappedCategory = 'Personal';

    const newDoc = new Document({
      employeeId: documentRequest.employeeId,
      uploadedBy: requestingUser.email || 'HR System',
      fileName: req.file.filename,
      originalName: documentRequest.documentType,
      fileType: req.file.mimetype,
      fileSize: (req.file.size / (1024 * 1024)).toFixed(2) + " MB",
      filePath: cloudResult.secure_url,
      category: mappedCategory,
      status: "Verified",
    });

    const savedDoc = await newDoc.save();

    documentRequest.status = 'Completed';
    documentRequest.fulfilledDocumentId = savedDoc._id as any;
    documentRequest.actionedBy = requestingUser._id || requestingUser.id;
    documentRequest.actionedAt = new Date();

    await documentRequest.save();

    res.status(200).json({ success: true, data: documentRequest });
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, error: error.message });
  }
};