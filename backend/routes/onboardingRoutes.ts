import express, { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { saveOnboardingProgress, getOnboardingDetails } from '../controllers/onboardingController';
import { protect, authorize } from '../middleware/auth.middleware';

const router: Router = express.Router();

// --- 1. Multer Configuration (Binary Data Handling) ---

// Ensure the directory for storing employee docs exists
const uploadDir = 'uploads/onboarding';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Creates a unique filename: email-fieldname-timestamp.extension
        // Note: req.body.email must be sent from frontend for this naming to work perfectly
        const email = req.body.email || 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${email}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit files to 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg, .jpeg and .pdf formats allowed!'));
    }
});

// --- 2. Middleware & Routes ---

// Apply protection to all onboarding routes
router.use(protect);
router.use(authorize('ADMIN', 'Admin', 'Super Admin'));

/**
 * @route   POST /api/onboarding/save
 * @desc    Save progress tab-by-tab including file uploads
 */
router.post(
    '/save', 
    upload.fields([
        { name: 'aadharCard', maxCount: 1 },
        { name: 'panCard', maxCount: 1 },
        { name: 'resume', maxCount: 1 },
        { name: 'educationDocs', maxCount: 1 },
        { name: 'passportPhoto', maxCount: 1 },  
        { name: 'relievingLetter', maxCount: 1 }
    ]), 
    saveOnboardingProgress
);

/**
 * @route   GET /api/onboarding/:email
 * @desc    Fetch existing progress to resume onboarding
 */
router.get('/:email', getOnboardingDetails);

export default router;