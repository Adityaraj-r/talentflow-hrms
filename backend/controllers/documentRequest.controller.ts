import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DocumentRequest from '../models/DocumentRequest.model';
import Employee from '../models/Employee.model';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// @desc    Create a new document request
// @route   POST /api/document-requests/create
// @access  Private (Employee)
export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { documentType, purpose, additionalNotes } = req.body;
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const employee = await Employee.findOne({ userId: requestingUser.id });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    const newRequest = new DocumentRequest({
      employeeId: employee.employeeCode,
      documentType,
      purpose,
      additionalNotes,
      status: 'Pending'
    });

    await newRequest.save();
    res.status(201).json({ success: true, data: newRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get requests of logged in employee
// @route   GET /api/document-requests/my-requests
// @access  Private (Employee)
export const getMyRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const employee = await Employee.findOne({ userId: requestingUser.id });
    if (!employee) {
      res.status(404).json({ success: false, error: "Employee not found" });
      return;
    }

    const requests = await DocumentRequest.find({ employeeId: employee.employeeCode }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all document requests (for HR Officer and Manager)
// @route   GET /api/document-requests/all
// @access  Private (HR Officer, HR Manager, Admin)
export const getAllRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await DocumentRequest.find().sort({ createdAt: -1 });

    const employeeCodes = Array.from(new Set(requests.map(r => r.employeeId)));
    const employees = await Employee.find({ employeeCode: { $in: employeeCodes } });
    const employeeMap = new Map(employees.map(e => [e.employeeCode, e]));

    const data = requests.map(req => {
      const emp = employeeMap.get(req.employeeId);
      return {
        ...req.toObject(),
        employeeName: emp ? `${emp.firstName} ${emp.lastName || ''}`.trim() : "Unknown Employee",
        department: emp ? emp.department : "N/A"
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Approve document request & upload multiple files
// @route   POST /api/document-requests/approve/:id
// @access  Private (HR Officer, Admin)
export const approveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const { id } = req.params;
    const { hrRemark } = req.body;
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const documentRequest = await DocumentRequest.findById(id);
    if (!documentRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    // VALIDATION: Must be Pending or Approved
    if (documentRequest.status === 'Rejected') {
      res.status(400).json({
        success: false,
        error: "Document request has been rejected. No additional documents can be uploaded."
      });
      return;
    }

    // Accept multiple files from Multer
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "At least one document file upload is required for approval." });
      return;
    }

    const uploadedUrls: string[] = [];
    const uploadedDocs: any[] = [];

    for (const file of files) {
      let savedFilePath = `/uploads/requested_docs/${path.basename(file.path)}`;
      try {
        // Upload to Cloudinary
        const cloudFolder = `hrms/Requested_Documents/${documentRequest.employeeId}`;
        const safeDocName = documentRequest.documentType.replace(/[^a-zA-Z0-9]/g, '');
        const customPublicId = `${documentRequest.employeeId}-${safeDocName}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

        const cloudResult = await cloudinary.uploader.upload(file.path, {
          folder: cloudFolder,
          resource_type: 'auto', // Auto handles PDF, JPG, PNG, DOC, DOCX, etc.
          public_id: customPublicId,
        });

        savedFilePath = cloudResult.secure_url;

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cloudError: any) {
        console.warn(
          "Cloudinary document upload failed; saving local upload instead:",
          cloudError.message || cloudError
        );
      }
      uploadedUrls.push(savedFilePath);
      uploadedDocs.push({
        originalName: file.originalname,
        fileName: file.filename || path.basename(savedFilePath),
        filePath: savedFilePath,
        fileSize: file.size || 0,
        mimeType: file.mimetype || 'application/octet-stream',
        uploadedAt: new Date()
      });
    }

    // Append HR Remark if provided
    if (hrRemark && hrRemark.trim()) {
      documentRequest.remarks.push({
        remark: hrRemark.trim(),
        addedBy: `${requestingUser.firstName || ''} ${requestingUser.lastName || ''}`.trim() || 'HR System',
        role: 'HR Officer',
        createdAt: new Date()
      });
    }

    documentRequest.status = 'Approved';
    
    // Append instead of overwrite
    const existingPaths = documentRequest.documentPaths || [];
    documentRequest.documentPaths = [...existingPaths, ...uploadedUrls];
    documentRequest.documentPath = documentRequest.documentPaths[0]; // for single compatibility
    
    const existingDocs = documentRequest.uploadedDocuments || [];
    documentRequest.uploadedDocuments = [
      ...existingDocs.map((d: any) => typeof d.toObject === 'function' ? d.toObject() : d),
      ...uploadedDocs
    ];

    await documentRequest.save();
    res.status(200).json({ success: true, data: documentRequest });
  } catch (error: any) {
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reject document request
// @route   POST /api/document-requests/reject/:id
// @access  Private (HR Officer, Admin)
export const rejectRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { hrRemark } = req.body;
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const documentRequest = await DocumentRequest.findById(id);
    if (!documentRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    // STRICT VALIDATION: Must be Pending
    if (documentRequest.status !== 'Pending') {
      res.status(400).json({
        success: false,
        error: `Document request is already ${documentRequest.status}. A final decision can only be made on Pending requests.`
      });
      return;
    }

    // HR Remark is mandatory for Rejection
    if (!hrRemark || !hrRemark.trim()) {
      res.status(400).json({ success: false, error: "HR Remark (rejection reason) is mandatory for rejecting a request." });
      return;
    }

    // Append Rejection Remark to history
    documentRequest.remarks.push({
      remark: hrRemark.trim(),
      addedBy: `${requestingUser.firstName || ''} ${requestingUser.lastName || ''}`.trim() || 'HR System',
      role: 'HR Officer',
      createdAt: new Date()
    });

    documentRequest.status = 'Rejected';

    await documentRequest.save();
    res.status(200).json({ success: true, data: documentRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add Supervisor Remark (HR Manager)
// @route   POST /api/document-requests/supervisor-remark/:id
// @access  Private (HR Manager)
export const addSupervisorRemark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const documentRequest = await DocumentRequest.findById(id);
    if (!documentRequest) {
      res.status(404).json({ success: false, error: "Request not found" });
      return;
    }

    // VALIDATION: Remarks only allowed in Pending or Approved states
    if (documentRequest.status === 'Rejected') {
      res.status(400).json({
        success: false,
        error: "Cannot add Supervisor Remarks to a Rejected document request. The request is locked."
      });
      return;
    }

    if (!remark || !remark.trim()) {
      res.status(400).json({ success: false, error: "Supervisor Remark text is required." });
      return;
    }

    // Append Supervisor Remark
    documentRequest.remarks.push({
      remark: remark.trim(),
      addedBy: `${requestingUser.firstName || ''} ${requestingUser.lastName || ''}`.trim() || 'HR Supervisor',
      role: 'HR Manager',
      createdAt: new Date()
    });

    await documentRequest.save();
    res.status(200).json({ success: true, data: documentRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};