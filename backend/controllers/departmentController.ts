import { Request, Response } from 'express';
import Department from '../models/Department.model';
import User from '../models/User.model';

// Get all departments
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, departments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add new department
export const addDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: "Department already exists" });

    const newDept = await Department.create({ name, description });
    res.status(201).json({ success: true, department: newDept });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update department
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const updatedDept = await Department.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!updatedDept) return res.status(404).json({ success: false, message: "Department not found" });
    res.status(200).json({ success: true, department: updatedDept });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete department
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Department deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

//Get Single Department Details (Employees + Manager)
export const getDepartmentDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id).populate('manager', 'name email');
        
        
        const employees = await User.find({ department: department?.name }).select('name email role designation');

        if (!department) return res.status(404).json({ success: false, message: "Department not found" });

        res.status(200).json({ success: true, department, employees });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const assignManager = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { managerId } = req.body;

        const department = await Department.findByIdAndUpdate(
            id, 
            { manager: managerId },
            { new: true }
        ).populate('manager', 'name');

        res.status(200).json({ success: true, message: "Manager assigned", department });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};