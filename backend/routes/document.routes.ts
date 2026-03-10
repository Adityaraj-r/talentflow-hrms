import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.model';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();
const uploadDir = 'uploads/documents';
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

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const { employeeId, category, uploadedBy } = req.body;
    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

    // DYNAMIC CLOUDINARY FOLDER ROUTING
    let cloudFolder = "hrms/Uncategorized";
    if (category === "Personal IDs") cloudFolder = "hrms/Personal_IDs";
    else if (category === "Education") cloudFolder = "hrms/Education";
    else if (category === "Contracts") cloudFolder = "hrms/Contracts";
    else if (category === "Payroll") cloudFolder = "hrms/Payroll";
    else if (category === "Onboarding") cloudFolder = "hrms/Onboarding";

    // UPLOAD TO CLOUDINARY
    const cloudResult = await cloudinary.uploader.upload(req.file.path, {
      folder: cloudFolder,
      resource_type: 'auto',
    });

    //  CLEAN UP LOCAL TEMP FILE
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // SAVE CLOUD URL TO MONGODB
    const newDoc = new Document({
      employeeId,
      uploadedBy,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: fileSizeMB,
      filePath: cloudResult.secure_url,
      category: category || "Uncategorized",
      status: "Pending"
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: "Server Error during cloud upload", error });
  }
});

router.get('/:employeeId', async (req: Request, res: Response) => {
  try {
    const docs = await Document.find({ employeeId: req.params.employeeId }).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents", error });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    if (doc.filePath) {
      // CLOUDINARY DELETION LOGIC
      if (doc.filePath.includes('cloudinary.com')) {
        
        const urlParts = doc.filePath.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        
        if (uploadIndex !== -1) {

          const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

          console.log(`🗑️ Attempting to delete from Cloudinary Vault: ${publicId}`);
          await cloudinary.uploader.destroy(publicId);
          console.log(`✅ Cloud file permanently destroyed!`);
        }
      } 
      //  LOCAL FILE DELETION 
      else {
        const fileToDelete = path.join(__dirname, '..', doc.filePath);
        if (fs.existsSync(fileToDelete)) {
          fs.unlinkSync(fileToDelete); 
          console.log(`✅ Physical local file deleted: ${fileToDelete}`);
        } else {
          console.log(`⚠️ Physical file not found on disk, skipping: ${fileToDelete}`);
        }
      }
    }
    
    //  MONGODB DELETION
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted successfully from DB and Storage Vault" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Error deleting document", error });
  }
});

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
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

    res.json({ message: "Status updated successfully", doc: updatedDoc });
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: "Error updating document status", error });
  }
});

export default router;