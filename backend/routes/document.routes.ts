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
  getMyUploadedDocuments
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

const upload = multer({ storage });

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
  '/:employeeId',
  protect,
  allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'CEO', 'EMPLOYEE'),
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