import express from "express";
import { createRequisition } from "../controllers/requisition.controller";

const router = express.Router();

router.post("/", createRequisition);

export default router;
