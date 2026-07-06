import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import {
  saveOnboardingProgress,
  getOnboardingDetails,
  getAllOnboardingEmployees,
} from '../controllers/onboardingController';
import dotenv from 'dotenv';
dotenv.config();
import { authorize, protect } from '../middleware/auth.middleware';

const router: Router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const uploadDir = 'uploads/onboarding';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
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

router.use(protect);

router.post(
  '/save',
  authorize('ADMIN', 'HR_MANAGER', 'HR_OFFICER'),
  upload.fields([
    { name: 'aadharCard',      maxCount: 1 },
    { name: 'panCard',         maxCount: 1 },
    { name: 'resume',          maxCount: 1 },
    { name: 'educationDocs',   maxCount: 1 },
    { name: 'passportPhoto',   maxCount: 1 },
    { name: 'relievingLetter', maxCount: 1 },
  ]),
  saveOnboardingProgress
);

router.get('/list/all', authorize('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'DEPARTMENT_MANAGER'), getAllOnboardingEmployees);
router.get('/:email', authorize('ADMIN', 'HR_MANAGER', 'HR_OFFICER', 'DEPARTMENT_MANAGER'), getOnboardingDetails);

export default router;
