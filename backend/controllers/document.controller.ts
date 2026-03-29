import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.model';
import { v2 as cloudinary } from 'cloudinary';
import Employee from '../models/Employee.model';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { employeeId, category, uploadedBy, documentTitle } = req.body;
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";
    const requestingUser = (req as any).user;

    const safeEmployeeId = employeeId ? employeeId.toString().trim() : 'Unknown_Employee';
    let cloudFolder = "hrms/Uncategorized";
    let emailPrefix = "unknown";

    if (category === "Onboarding") {
      try {
        let emp = await Employee.findOne({ employeeCode: safeEmployeeId });
        if (!emp && safeEmployeeId.length === 24) {
          emp = await Employee.findById(safeEmployeeId);
        }
        if (emp && emp.email) {
          emailPrefix = emp.email.split('@')[0].toLowerCase();
        }
      } catch (err) {
        console.error("Could not fetch employee email:", err);
      }
      cloudFolder = `hrms_onboarding/${emailPrefix}`;
    } else {
      let baseFolder = "hrms/Uncategorized";
      if (category === "Personal" || category === "Personal IDs") baseFolder = "hrms/Personal_IDs";
      else if (category === "Education")                          baseFolder = "hrms/Education";
      else if (category === "Employment" || category === "Contracts") baseFolder = "hrms/Contracts";
      else if (category === "Payroll")                            baseFolder = "hrms/Payroll";
      cloudFolder = `${baseFolder}/${safeEmployeeId}`;
    }

    const safeDocName   = (documentTitle || "doc").replace(/[^a-zA-Z0-9]/g, '');
    const customPublicId = `${category === "Onboarding" && emailPrefix !== "unknown" ? emailPrefix : safeEmployeeId}-${safeDocName}-${Date.now()}`;

    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      folder:        cloudFolder,
      resource_type: 'auto',
      public_id:     customPublicId,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const newDoc = new Document({
      employeeId,
      uploadedBy,
      fileName:     req.file.filename,
      originalName: documentTitle || req.file.originalname,
      fileType:     req.file.mimetype,
      fileSize:     fileSizeMB,
      filePath:     cloudResult.secure_url,
      category:     category || "Uncategorized",
      status:       "Pending",
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: "Server error during cloud upload", error });
  }
};

export const getDocumentsByEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;
    const { employeeId } = req.params;

    if (requestingUser?.role === "EMPLOYEE") {
      const selfId =
        requestingUser.employeeId?.toString() ||
        requestingUser._id?.toString();
      if (employeeId !== selfId) {
        res.status(403).json({ success: false, message: "Access denied" });
        return;
      }
    }

    const docs = await Document.find({ employeeId }).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents", error });
  }
};

export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    if (doc.filePath) {
      if (doc.filePath.includes('cloudinary.com')) {
        const urlParts     = doc.filePath.split('/');
        const uploadIndex  = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1) {
          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const publicId        = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
          await cloudinary.uploader.destroy(publicId);
        }
      } else {
        const fileToDelete = path.join(__dirname, '..', doc.filePath);
        if (fs.existsSync(fileToDelete)) {
          fs.unlinkSync(fileToDelete);
        }
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting document", error });
  }
};

export const updateDocumentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Verified', 'Rejected'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const updatedDoc = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedDoc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    res.json({ success: true, message: "Status updated successfully", doc: updatedDoc });
  } catch (error) {
    res.status(500).json({ message: "Error updating document status", error });
  }
};