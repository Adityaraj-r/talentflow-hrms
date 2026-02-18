import { Request, Response } from "express";
import Candidate from "../models/Candidate.model";

export const createCandidate = async (req: Request, res: Response) => {
  try {
    const candidate = await Candidate.create(req.body);
    res.status(201).json(candidate);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await Candidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCandidateStage = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      { stage },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    res.json({
      success: true,
      message: "Stage updated successfully",
      data: updatedCandidate
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error
    });
  }
};

export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: "Candidate deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
export const rejectCandidate = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      id,
      {
        stage: "Rejected",
        rejectReason: reason
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate rejected successfully",
      data: candidate
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

