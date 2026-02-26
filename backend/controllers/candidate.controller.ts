import { Request, Response } from "express";
import Candidate from "../models/Candidate.model";

interface AuthRequest extends Request {
  user?: { id: string; role: string; email: string; firstName?: string };
}

// GET /api/candidates
export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stage, search } = req.query;
    const filter: any = {};

    if (stage) filter.stage = stage;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName:  { $regex: search, $options: "i" } },
        { position:  { $regex: search, $options: "i" } },
        { email:     { $regex: search, $options: "i" } }
      ];
    }

    const candidates = await Candidate.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: candidates.length, data: candidates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching candidates", error: error.message });
  }
};

// GET /api/candidates/:id
export const getCandidateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidate not found" });
      return;
    }
    res.status(200).json({ success: true, data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error fetching candidate", error: error.message });
  }
};

// POST /api/candidates
export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, position, experience, stage } = req.body;

    if (!firstName || !lastName || !position) {
      res.status(400).json({ success: false, message: "First name, last name and position are required" });
      return;
    }

    const candidate = await Candidate.create({
      firstName,
      lastName,
      email:      email || null,
      phone:      phone || null,
      position,
      experience: experience || null,
      stage:      stage || "Applied"
    });

    res.status(201).json({ success: true, message: "Candidate created successfully", data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error creating candidate", error: error.message });
  }
};

// PUT /api/candidates/:id  — updates any fields including stage + rejectReason
export const updateCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phone, position, experience, stage, rejectReason } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, position, experience, stage, rejectReason },
      { new: true, runValidators: true }
    );

    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidate not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Candidate updated successfully", data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error updating candidate", error: error.message });
  }
};

// PATCH /api/candidates/:id/stage  — quick stage-only update
export const updateCandidateStage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { stage } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { stage },
      { new: true }
    );

    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidate not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Stage updated successfully", data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// PATCH /api/candidates/:id/reject
export const rejectCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { stage: "Rejected", rejectReason: reason },
      { new: true }
    );

    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidate not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Candidate rejected successfully", data: candidate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// DELETE /api/candidates/:id
export const deleteCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      res.status(404).json({ success: false, message: "Candidate not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Candidate deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Error deleting candidate", error: error.message });
  }
};
