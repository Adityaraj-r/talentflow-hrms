import Employee from "../models/Employee.model";
import { Request, Response } from "express";

// GET Recent Hires
export const getRecentHires = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find()
      .sort({ joiningDate: -1 })
      .limit(10);

    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recent hires",
      error,
    });
  }
};
