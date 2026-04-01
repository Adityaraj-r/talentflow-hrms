import express, { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const emailPrefix = req.body.email
      ? req.body.email.split('@')[0].toLowerCase()
      : 'unknown_candidate';
    return {
      folder:          `hrms_onboarding/${emailPrefix}`,
      resource_type:   'auto',
      allowed_formats: ['jpeg', 'jpg', 'png', 'pdf'],
      public_id:       `${emailPrefix}-${file.fieldname}-${Date.now()}`,
    };
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);
router.use(authorize('ADMIN', 'HR_MANAGER', 'HR_OFFICER'));

router.post(
  '/save',
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

router.get('/list/all', getAllOnboardingEmployees);
router.get('/:email', getOnboardingDetails);

export default router;