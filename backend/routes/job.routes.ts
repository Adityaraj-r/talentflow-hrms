import express from "express";
import {
  createJob,
  updateJob,
  publishJob,
  closeJob,        
  getPublishedJobs,
  getAllJobs,       
} from "../controllers/job.controller";

const router = express.Router();

router.get("/", getAllJobs); 

router.get("/published", getPublishedJobs);

router.post("/", createJob);

router.put("/:id", updateJob);

router.put("/:id/publish", publishJob);
router.put("/:id/close", closeJob);

export default router;