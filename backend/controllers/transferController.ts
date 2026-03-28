import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware'; 
import Transfer from '../models/Transfer.model';
import Employee from '../models/Employee.model';

// Create Transfer Request
export const createTransferRequest = async (req: AuthRequest, res: Response) => {
    try {
        const transferData = new Transfer({
            ...req.body,
            initiatedBy: req.user?.id,
            employeeEmail: req.user?.email,
            status: 'Pending' 
        });

        const savedTransfer = await transferData.save();
        
        res.status(201).json({
            success: true,
            message: "Transfer request submitted successfully",
            data: savedTransfer
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            message: "Error submitting transfer request",
            error: error.message
        });
    }
};

// Get Transfer Request
export const getAllTransfers = async (req: AuthRequest, res: Response) => {
    try {
        let query = {};
        
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'HR_MANAGER') {
            const emp = await Employee.findOne({ email: req.user?.email });
            
            query = { 
                $or: [
                    { initiatedBy: req.user?.id }, 
                    { employeeEmail: req.user?.email },
                    { employeeId: emp?.employeeCode } 
                ] 
            };
        }

        const transfers = await Transfer.find(query).sort({ createdAt: -1 });
        res.status(200).json(transfers);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching transfers", error: error.message });
    }
};

// Update Transfer Request
export const updateTransferStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    try {
        const allowedRoles = ['ADMIN', 'Admin', 'Super Admin', 'CEO'];
        
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access Denied. Current role: ${req.user?.role || 'Undefined'}. Admin approval required.` 
            });
        }

        const updatedTransfer = await Transfer.findByIdAndUpdate(
            id,
            { 
                status, 
                adminRemarks,
                actionedBy: req.user?.id,
                actionedAt: new Date()
            },
            { new: true }
        );

        if (!updatedTransfer) {
            return res.status(404).json({ message: "Transfer request not found" });
        }

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            data: updatedTransfer
        });
    } catch (error: any) {
        res.status(400).json({ message: "Error updating status", error: error.message });
    }
};

// Get Employee Transfer Request
export const getEmployeeLatestTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params; 
        
        const latestTransfer = await Transfer.findOne({ 
            employeeId: employeeId       
        }).sort({ createdAt: -1 });

        res.status(200).json(latestTransfer);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching latest transfer", error: error.message });
    }
};