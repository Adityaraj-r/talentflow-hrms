import Requisition from "../models/Requisition.model";
import { Request, Response } from "express";

export const createRequisition = async (req: Request, res: Response) => {
  try {
    const requisition = await Requisition.create(req.body);
    res.status(201).json(requisition);
  } catch (error) {
    res.status(500).json({ message: "Failed to create requisition" });
  }
};
