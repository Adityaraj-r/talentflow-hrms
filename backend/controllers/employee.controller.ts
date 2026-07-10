import Employee from "../models/Employee.model";
import { Request, Response } from "express";
import User from '../models/User.model';

export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    let filter: any = {};

    if (requestingUser?.role === "DIRECT_MANAGER") {
      filter = { 
        reportingManagerId: requestingUser.employeeCode,
        role: "EMPLOYEE" 
      };
    } 
    else if (requestingUser?.role === "DEPARTMENT_MANAGER") {
      filter = { department: requestingUser.department };
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

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
    const id = req.params.id as string;
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

    let employee = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      employee = await Employee.findById(id);
    }
    if (!employee) {
      employee = await Employee.findOne({ employeeCode: id });
    }

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const data = employee.toObject() as Record<string, any>;

    if (!["ADMIN", "HR_MANAGER", "DEPARTMENT_MANAGER"].includes(requestingUser?.role)) {
      delete data.bankDetails;
      delete data.kycDetails;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const requestingUser = (req as any).user;
    
    const userId = requestingUser._id || requestingUser.id;
    
    if (!userId) {
      return res.status(400).json({ message: "Invalid user token." });
    }

    const employee = await Employee.findOne({ userId: userId });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found for this account." });
    }

    const data = employee.toObject() as Record<string, any>;
    
    const documents = data.Documents || {};

    res.status(200).json(documents);
  } catch (err) {
    console.error("Error fetching my documents:", err);
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

export const getEmployeeDirectory = async (req: Request, res: Response) => {
    try {
        const { role, search, statusFilter, page = 1, limit = 10 } = req.query;
        const skipNum = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);

        // Compute base query respecting role access (like getAllEmployees)
        const requestingUser = (req as any).user;
        let baseQuery: any = {};

        if (requestingUser?.role === "DIRECT_MANAGER") {
            baseQuery = { 
                reportingManagerId: requestingUser.employeeCode,
                role: "EMPLOYEE" 
            };
        } else if (requestingUser?.role === "DEPARTMENT_MANAGER") {
            baseQuery = { department: requestingUser.department };
        }

        // Dashboard Stats calculation
        const [totalStaffCount, activeCount, onNoticeCount, exitedCount, rolesAssignedCount] = await Promise.all([
            Employee.countDocuments({ ...baseQuery, status: { $in: ['Active', 'On Notice Period', 'Pending Manager Approval', 'Pending HR Approval', 'Pending Country Manager Approval', 'Pending CEO Approval'] } }),
            Employee.countDocuments({ ...baseQuery, status: { $in: ['Active', 'Pending Manager Approval', 'Pending HR Approval', 'Pending Country Manager Approval', 'Pending CEO Approval'] } }),
            Employee.countDocuments({ ...baseQuery, status: 'On Notice Period' }),
            Employee.countDocuments({ ...baseQuery, status: { $in: ['Exited', 'Terminated'] } }),
            Employee.countDocuments({ 
                ...baseQuery, 
                role: { $nin: [null, ''] }, 
                status: 'Active' 
            })
        ]);

        const stats = {
            total: totalStaffCount,
            active: activeCount,
            onNotice: onNoticeCount,
            inactive: exitedCount, // We'll map inactive to Exited on frontend or keep it as inactive for stats
            rolesAssigned: rolesAssignedCount
        };

        // Filter based on statusFilter (from frontend dashboard cards)
        let query = { ...baseQuery };
        if (statusFilter === 'total' || !statusFilter) {
            query.status = { $in: ['Active', 'On Notice Period', 'Pending Manager Approval', 'Pending HR Approval', 'Pending Country Manager Approval', 'Pending CEO Approval'] };
        } else if (statusFilter === 'active') {
            query.status = { $in: ['Active', 'Pending Manager Approval', 'Pending HR Approval', 'Pending Country Manager Approval', 'Pending CEO Approval'] };
        } else if (statusFilter === 'onNotice') {
            query.status = 'On Notice Period';
        } else if (statusFilter === 'exited') {
            query.status = { $in: ['Exited', 'Terminated'] };
        } else if (statusFilter === 'rolesAssigned') {
            query.role = { $nin: [null, ''] };
            query.status = 'Active';
        }

        // Apply role filter from dropdown
        if (role && role !== 'all') {
            query.role = role;
        }

        // Apply search
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName:  { $regex: search, $options: 'i' } },
                { email:     { $regex: search, $options: 'i' } },
                { employeeCode: { $regex: search, $options: 'i' } }
            ];
        }

        const [employees, totalCount] = await Promise.all([
            Employee.find(query).sort({ createdAt: -1 }).skip(skipNum).limit(limitNum).lean(),
            Employee.countDocuments(query)
        ]);

        res.status(200).json({ 
            success: true, 
            data: employees,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum
            },
            stats
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch directory', error: error.message });
    }
};