import Employee from "../models/Employee.model";
import { Request, Response } from "express";
import User from '../models/User.model';

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
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveOnboarding = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({
      onboardingStatus: { $ne: "Completed" },
    }).sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active onboarding" });
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const requestingUser = (req as any).user;

    if (requestingUser?.role === "EMPLOYEE") {
      const ownId =
        requestingUser.employeeId?.toString() ||
        requestingUser._id?.toString();
      if (id !== ownId) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const data = employee.toObject() as Record<string, any>;

    if (!["ADMIN", "HR_MANAGER"].includes(requestingUser?.role)) {
      delete data.bankDetails;
      delete data.kycDetails;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const offboardEmployee = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { exitDate, exitReason } = req.body;

    try {
        if (!exitDate || !exitReason) {
            return res.status(400).json({ success: false, error: "Exit date and reason are required." });
        }

        const updatedEmployee = await Employee.findOneAndUpdate(
            { $or: [{ _id: id }, { employeeCode: id }] },
            { 
                status: 'Terminated',
                exitDate: new Date(exitDate),
                exitReason: exitReason
            },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ success: false, error: "Employee not found." });
        }

        if (updatedEmployee.email) {
            await User.findOneAndUpdate(
                { email: updatedEmployee.email },
                { 
                    isActive: false, 
                    isDeleted: true 
                }
            );
        }

        res.status(200).json({ 
            success: true, 
            message: "Employee successfully offboarded and system access revoked.",
            data: updatedEmployee 
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};