import express from "express"; /*comment*/
import {
  createDisciplinaryCase,
  getDisciplinaryEmployees,
  getDisciplinaryCaseById,
  getDisciplinaryCases,
  updateDisciplinaryCase,
  updateDisciplinaryStatus,
  downloadAttachment
} from "../controllers/disciplinary.controller";
import { protect } from "../middleware/auth.middleware";
import upload from "../middleware/upload";

const router = express.Router();

router.get("/", protect, getDisciplinaryCases);
router.get("/employees/eligible", protect, getDisciplinaryEmployees);
router.get("/download/:filename", protect, downloadAttachment);
router.get("/:id", protect, getDisciplinaryCaseById);
router.post("/", protect, upload.single("attachment"), createDisciplinaryCase);
router.put("/:id", protect, updateDisciplinaryCase);
router.patch("/:id/status", protect, updateDisciplinaryStatus);

export default router;
