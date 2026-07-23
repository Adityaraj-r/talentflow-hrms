import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/auth.middleware';
import {
  uploadDocument,
  getDocumentsByEmployee,
  deleteDocument,
  updateDocumentStatus,
  getMyUploadedDocuments,
  searchEmployeesForDocuments,
  getAggregatedEmployeeDocuments
} from '../controllers/document.controller';

const router = express.Router();

const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename:    (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only PDF, JPG, and PNG files are allowed.'));
  },
});

const allowRoles =
  (...roles: string[]) =>
  (req: any, res: any, next: any) => {
    if (roles.includes(req.user?.role)) return next();
    return res.status(403).json({ success: false, error: "Access denied" });
  };

router.post(
  '/upload',
  protect,
  allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'EMPLOYEE'),
  upload.single('file'),
  uploadDocument
);

router.get(
  '/my-documents',
  protect,
  allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'CEO', 'COUNTRY_MANAGER', 'DEPARTMENT_MANAGER', 'DIRECT_MANAGER', 'FINANCE_MANAGER', 'PAYROLL_OFFICER', 'PROJECT_MANAGER', 'OPERATIONS_MANAGER', 'EMPLOYEE'),
  getMyUploadedDocuments
);

router.get(
  '/employee-documents/search',
  protect,
  allowRoles('HR_MANAGER', 'HR_OFFICER'),
  searchEmployeesForDocuments
);

router.get(
  '/employee-documents/aggregate/:employeeId',
  protect,
  allowRoles('HR_MANAGER', 'HR_OFFICER'),
  getAggregatedEmployeeDocuments
);

router.get(
  '/:employeeId',
  protect,
  allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'CEO', 'EMPLOYEE','DEPARTMENT_MANAGER'),
  getDocumentsByEmployee
);

router.delete(
  '/:id',
  protect,
  allowRoles('ADMIN'),
  deleteDocument
);

router.patch(
  '/:id/status',
  protect,
  allowRoles('ADMIN', 'HR_MANAGER'),
  updateDocumentStatus
);

export default router;
