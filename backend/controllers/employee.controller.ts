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

export const getManageOnboarding = async (req: Request, res: Response) => {
  try {
    console.log("Manage onboarding route hit")

    const employees = await Employee.find()

    res.status(200).json(employees)
  } catch (error: any) {
    console.error("Error in manage onboarding:", error)
    res.status(500).json({ message: error.message })
  }
}

export const getActiveOnboarding = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({
      onboardingStatus: { $ne: "Completed" }
    }).sort({ createdAt: -1 });

    res.status(200).json(employees);
  } catch (error) {
    console.error("Active onboarding error:", error);
    res.status(500).json({ message: "Failed to fetch active onboarding" });
  }
};



export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const employee = await Employee.findById(id)

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json(employee)
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
}

