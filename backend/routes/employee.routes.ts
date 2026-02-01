import express from "express";
import { getRecentHires } from "../controllers/employee.controller";

const router = express.Router();

router.get("/recent-hires", getRecentHires);

export default router;
