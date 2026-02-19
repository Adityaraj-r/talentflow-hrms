import { Request, Response } from 'express';
import Department from '../models/Department.model';
import User from '../models/User.model';

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, description, manager } = req.body;
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return res.status(400).json({ success: false, error: 'Department already exists' });
    }
    const department = await Department.create({
      name,
      description,
      manager: manager || null 
    });

    res.status(201).json({ success: true, data: department });
  } catch (error: any) {
    console.error('Create Department Error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await Department.find()
      .populate('manager', 'firstName lastName email');
    
    res.status(200).json({ success: true, count: departments.length, data: departments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('manager', 'firstName lastName email');

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    res.status(200).json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('manager', 'firstName lastName');

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    res.status(200).json({ success: true, data: department });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    await department.deleteOne();

    res.status(200).json({ success: true, message: 'Department removed' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


export const addEmployeeToDepartment = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.body;
    const departmentId = req.params.id;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

   
    user.department = department.name; 
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `User ${user.firstName} added to ${department.name}` 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


export const removeEmployeeFromDepartment = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;

    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    
    user.department = 'Unassigned'; 
    await user.save();

    res.status(200).json({ success: true, message: 'User removed from department' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};