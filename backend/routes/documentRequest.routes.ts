import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect } from '../middleware/auth.middleware';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  fulfillRequest
} from '../controllers/documentRequest.controller';

const router = express.Router();

const uploadDir = 'uploads/requested_docs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

const allowRoles = (...roles: string[]) => (req: any, res: any, next: any) => {
  if (roles.includes(req.user?.role)) return next();
  return res.status(403).json({ success: false, error: "Access denied" });
};

router.post('/create', protect, allowRoles('EMPLOYEE'), createRequest);
router.get('/my-requests', protect, allowRoles('EMPLOYEE'), getMyRequests);
router.get('/all', protect, allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER'), getAllRequests);
router.post('/fulfill/:id', protect, allowRoles('ADMIN', 'HR_MANAGER', 'HR_OFFICER'), upload.single('file'), fulfillRequest);

export default router;