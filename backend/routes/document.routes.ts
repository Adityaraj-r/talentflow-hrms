import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.model';

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

    const newDoc = new Document({
      employeeId,
      uploadedBy,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: fileSizeMB,
      filePath: `/uploads/documents/${req.file.filename}`,
      category: category || "Uncategorized",
      status: "Pending"
    });

    await newDoc.save();
    res.status(201).json(newDoc);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Server Error during upload", error });
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
      const fileToDelete = path.join(__dirname, '..', doc.filePath);
      
      if (fs.existsSync(fileToDelete)) {
        fs.unlinkSync(fileToDelete); 
        console.log(`✅ Physical file deleted: ${fileToDelete}`);
      } else {
        console.log(`⚠️ Physical file not found on disk, skipping: ${fileToDelete}`);
      }
    }
    
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: "Document deleted successfully from DB and Folder" });
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