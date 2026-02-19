import Requisition from "../models/Requisition.model";
import { Request, Response } from "express";

export const createRequisition = async (req: Request, res: Response) => {
  try {
    const { position, department, experience, salaryRange, reason, urgency } =
      req.body;

    const requisition = await Requisition.create({
      position,
      department,
      experience,
      salaryRange,
      reason,
      urgency,
      requestedBy: (req as any).user?.id, 
    });

    res.status(201).json(requisition);
  } catch (error) {
    res.status(500).json({ message: "Failed to create requisition" });
  }
};
export const getPendingRequisitions = async (
  req: Request,
  res: Response
) => {
  try {
    const requisitions = await Requisition.find({
      status: "Pending",
    });

    res.json(requisitions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pending requisitions" });
  }
};
export const getRequisitionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const history = await Requisition.find({
      status: { $ne: "Pending" }  
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};



export const approveRequisition = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    console.log("Received ID:", id);

    const updated = await Requisition.findByIdAndUpdate(
      id,
      {
        status: "Approved",
        approvalDate: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      console.log("No document found with this ID");
      return res.status(404).json({ message: "Requisition not found" });
    }

    console.log("Updated Document:", updated);

    res.json(updated);

  } catch (error: any) {
    console.error(" REAL ERROR:", error.message);
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


export const rejectRequisition = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const requisition = await Requisition.findById(id);

    if (!requisition) {
      return res.status(404).json({ message: "Requisition not found" });
    }

    requisition.status = "Rejected";
    requisition.approvalDate = new Date();
    requisition.approvedBy = (req as any).user?.id;

    await requisition.save();

    res.json({ message: "Requisition rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject requisition" });
  }
};

export const getRequisitionStats = async (req: Request, res: Response) => {
  try {
    const totalOpen = await Requisition.countDocuments({
      status: { $in: ["Pending", "Approved"] },
    });

    const pending = await Requisition.countDocuments({
      status: "Pending",
    });

    const approved = await Requisition.countDocuments({
      status: "Approved",
    });

    const rejected = await Requisition.countDocuments({
      status: "Rejected",
    });

    res.json({
      totalOpen,
      pending,
      approved,
      rejected,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
