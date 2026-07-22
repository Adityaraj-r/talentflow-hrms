import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.model';
import DocumentRequest from '../models/DocumentRequest.model';
import { v2 as cloudinary } from 'cloudinary';
import Employee from '../models/Employee.model';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getLocalDocumentPath = (filePath: string): string => {
  return `/uploads/documents/${path.basename(filePath)}`;
};

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

    let savedFilePath = getLocalDocumentPath(req.file.path);
    let savedFileSize = fileSizeMB;

    try {
      const cloudResult = await cloudinary.uploader.upload(req.file.path, {
        folder:        cloudFolder,
        resource_type: 'auto',
        public_id:     customPublicId,
      });

      savedFilePath = cloudResult.secure_url;
      savedFileSize = cloudResult.bytes
        ? (cloudResult.bytes / (1024 * 1024)).toFixed(2) + " MB"
        : fileSizeMB;

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cloudError: any) {
      console.warn(
        "Cloudinary document upload failed; saving local upload instead:",
        cloudError.message || cloudError
      );
    }

    const newDoc = new Document({
      employeeId,
      uploadedBy,
      fileName:     req.file.filename,
      originalName: documentTitle || req.file.originalname,
      fileType:     req.file.mimetype,
      fileSize:     savedFileSize,
      filePath:     savedFilePath,
      category:     category || "Uncategorized",
      status:       "Pending",
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || "Server error during document upload", error });
  }
};

export const getMyUploadedDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;
    
    const userId = requestingUser._id || requestingUser.id;

    if (!userId) {
      res.status(400).json({ message: "Invalid user token." });
      return;
    }

    if (requestingUser.role === 'DEPARTMENT_MANAGER') {
      const deptEmployees = await Employee.find({ department: requestingUser.department }).select('employeeCode');
      const empIds = deptEmployees.map(emp => emp.employeeCode).filter(Boolean) as string[];
      
      const managerDocs = await Document.find({
        employeeId: { $in: empIds },
        category: { $in: ['Education', 'Employment'] }
      }).sort({ uploadDate: -1 });
      
      res.status(200).json(managerDocs);
      return;
    }

    const employee = await Employee.findOne({ userId: userId });

    if (!employee || !employee.employeeCode) {
      res.status(404).json({ message: "Employee profile or code not found for this account." });
      return;
    }

    const docs = await Document.find({ employeeId: employee.employeeCode }).sort({ uploadDate: -1 });
    
    const processedDocs = docs.map(doc => {
      const docObj = doc.toObject();
      if (docObj.category === 'Onboarding' && docObj.status === 'Pending' && employee.onboardingStatus === 'Completed') {
        docObj.status = 'Verified';
      }
      return docObj;
    });

    const approvedRequests = await DocumentRequest.find({ employeeId: employee.employeeCode, status: 'Approved' });

    const requestDocs: any[] = [];
    for (const reqDoc of approvedRequests) {
      const paths = reqDoc.documentPaths && reqDoc.documentPaths.length > 0
        ? reqDoc.documentPaths
        : (reqDoc.documentPath ? [reqDoc.documentPath] : []);

      paths.forEach((filePath: string, idx: number) => {
        const filename = filePath.split('/').pop() || 'document.pdf';
        requestDocs.push({
          _id: `${reqDoc._id}_${idx}`,
          employeeId: reqDoc.employeeId,
          uploadedBy: 'HR Officer',
          fileName: filename,
          originalName: reqDoc.documentType + (paths.length > 1 ? ` (Part ${idx + 1})` : ''),
          fileType: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          fileSize: 'Cloud File',
          filePath: filePath,
          category: 'HR Generated',
          status: 'Verified',
          uploadDate: reqDoc.updatedAt || reqDoc.createdAt
        });
      });
    }

    const combinedDocs = [
      ...processedDocs,
      ...requestDocs
    ].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

    res.status(200).json(combinedDocs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "Error fetching documents", error });
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

export const searchEmployeesForDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;
    if (!['HR_MANAGER', 'HR_OFFICER'].includes(requestingUser?.role)) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      res.status(400).json({ success: false, message: "Search query is required" });
      return;
    }

    const searchStr = query.trim();
    const employees = await Employee.find({
      $or: [
        { employeeCode: { $regex: searchStr, $options: 'i' } },
        { email: { $regex: searchStr, $options: 'i' } },
        { workEmail: { $regex: searchStr, $options: 'i' } },
        { firstName: { $regex: searchStr, $options: 'i' } },
        { lastName: { $regex: searchStr, $options: 'i' } }
      ]
    })
      .limit(10)
      .select('firstName lastName employeeCode email workEmail department designation');

    res.status(200).json(employees);
  } catch (error: any) {
    console.error("Error searching employees:", error);
    res.status(500).json({ success: false, message: "Error searching employees", error: error.message });
  }
};

export const getAggregatedEmployeeDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const requestingUser = (req as any).user;
    if (!['HR_MANAGER', 'HR_OFFICER'].includes(requestingUser?.role)) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const { employeeId } = req.params;
    let employee = await Employee.findOne({ employeeCode: employeeId });
    if (!employee && typeof employeeId === 'string' && /^[0-9a-fA-F]{24}$/.test(employeeId)) {
      employee = await Employee.findById(employeeId);
    }

    if (!employee) {
      res.status(404).json({ success: false, message: "Employee not found" });
      return;
    }

    const code = employee.employeeCode;
    const query: any = {};
    if (code) {
      query.$or = [
        { employeeId: code },
        { employeeId: employee._id.toString() }
      ];
    } else {
      query.employeeId = employee._id.toString();
    }

    // Query Document collection
    const docs = await Document.find(query).sort({ uploadDate: -1 });

    // Query Approved DocumentRequest collection
    const reqQuery: any = {};
    if (code) {
      reqQuery.$or = [
        { employeeId: code },
        { employeeId: employee._id.toString() }
      ];
    } else {
      reqQuery.employeeId = employee._id.toString();
    }
    reqQuery.status = 'Approved';

    const approvedRequests = await DocumentRequest.find(reqQuery).sort({ updatedAt: -1 });

    const onboardingDocs: any[] = [];
    const employmentDocs: any[] = [];
    const requestedDocs: any[] = [];
    const otherDocs: any[] = [];

    // Filter db docs
    docs.forEach(doc => {
      const docObj = doc.toObject();
      if (docObj.category === 'Onboarding') {
        onboardingDocs.push(docObj);
      } else if (docObj.category === 'Employment') {
        employmentDocs.push(docObj);
      } else {
        otherDocs.push(docObj);
      }
    });

    // Extract documents from DocumentRequest
    for (const reqDoc of approvedRequests) {
      const paths = reqDoc.documentPaths && reqDoc.documentPaths.length > 0
        ? reqDoc.documentPaths
        : (reqDoc.documentPath ? [reqDoc.documentPath] : []);

      paths.forEach((filePath: string, idx: number) => {
        const filename = filePath.split('/').pop() || 'document.pdf';
        requestedDocs.push({
          _id: `${reqDoc._id}_${idx}`,
          employeeId: reqDoc.employeeId,
          uploadedBy: 'HR Officer',
          fileName: filename,
          originalName: reqDoc.documentType + (paths.length > 1 ? ` (Part ${idx + 1})` : ''),
          fileType: filename.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          fileSize: 'Cloud File',
          filePath: filePath,
          category: 'Requested',
          status: 'Verified',
          uploadDate: reqDoc.updatedAt || reqDoc.createdAt
        });
      });
    }

    // Add and synthesize missing onboarding documents from employee.Documents
    const empDocs = employee.Documents || {};
    const docMappings = [
      { path: empDocs.resumePath, name: 'Resume', key: 'resume' },
      { path: empDocs.aadharCardPath, name: 'Aadhar Card (Front & Back)', key: 'aadhar' },
      { path: empDocs.panCardPath, name: 'PAN Card', key: 'pan' },
      { path: empDocs.educationDocsPath, name: 'Highest Education Certificate', key: 'education' },
      { path: empDocs.relievingLetterPath, name: 'Previous Relieving Letter', key: 'relieving' },
      { path: empDocs.passportPhotoPath, name: 'Passport Photo', key: 'passport' }
    ];

    docMappings.forEach(mapping => {
      if (mapping.path) {
        // check if onboardingDocs already has this path
        const alreadyExists = onboardingDocs.some(d => d.filePath === mapping.path);
        if (!alreadyExists) {
          onboardingDocs.push({
            _id: `virtual_onboarding_${mapping.key}_${employee._id}`,
            employeeId: code || employee._id.toString(),
            uploadedBy: 'Onboarding System',
            fileName: mapping.path.split('/').pop() || 'document',
            originalName: mapping.name,
            fileType: mapping.path.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            fileSize: 'Cloud File',
            filePath: mapping.path,
            category: 'Onboarding',
            status: 'Verified',
            uploadDate: (employee as any).updatedAt || (employee as any).createdAt || new Date()
          });
        }
      }
    });

    res.status(200).json({
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName || ''}`.trim(),
        employeeCode: employee.employeeCode,
        email: employee.email,
        department: employee.department || 'N/A',
        designation: employee.designation || 'N/A'
      },
      onboardingDocs,
      employmentDocs,
      requestedDocs,
      otherDocs
    });
  } catch (error: any) {
    console.error("Error aggregating employee documents:", error);
    res.status(500).json({ success: false, message: "Error aggregating documents", error: error.message });
  }
};

