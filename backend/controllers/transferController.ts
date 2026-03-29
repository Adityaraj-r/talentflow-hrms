import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Transfer from '../models/Transfer.model';
import Employee from '../models/Employee.model';
import User from '../models/User.model';

export const createTransferRequest = async (req: AuthRequest, res: Response) => {
    try {
        const transferData = new Transfer({
            ...req.body,
            initiatedBy: req.user?.id,
            employeeEmail: req.user?.email,
            status: 'Pending',
            auditLog: [{
                action: 'Submitted',
                by: req.user?.id || 'System',
                remarks: req.body.reason || 'Request initiated'
            }]
        });

        const savedTransfer = await transferData.save();

        res.status(201).json({
            success: true,
            data: savedTransfer
        });
    } catch (error: any) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

export const getAllTransfers = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || '';
        const tab = req.query.tab as string || 'pending';

        const query: any = {};

        if (tab === 'pending') {
            query.status = 'Pending';
        } else if (tab === 'history') {
            query.status = { $ne: 'Pending' };
        }

        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Transfer.countDocuments(query);
        const transfers = await Transfer.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const [totalStats, pendingStats, approvedStats, rejectedStats] = await Promise.all([
            Transfer.countDocuments({}),
            Transfer.countDocuments({ status: 'Pending' }),
            Transfer.countDocuments({ status: 'Approved' }),
            Transfer.countDocuments({ status: 'Rejected' })
        ]);

        res.status(200).json({
            data: transfers,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            },
            stats: {
                total: totalStats,
                pending: pendingStats,
                approved: approvedStats,
                rejected: rejectedStats
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyTransfers = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const emp = await Employee.findOne({ email: req.user?.email });

        const query = {
            $or: [
                { initiatedBy: req.user?.id },
                { employeeEmail: req.user?.email },
                { employeeId: emp?.employeeCode }
            ]
        };

        const total = await Transfer.countDocuments(query);
        const transfers = await Transfer.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            data: transfers,
            pagination: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTransferStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    try {
        const allowedRoles = ['ADMIN', 'CEO'];

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false
            });
        }

        const transfer = await Transfer.findById(id);
        if (!transfer) {
            return res.status(404).json({ success: false, error: "Transfer not found" });
        }

        const isApproving = status === 'Approved' && transfer.status !== 'Approved';
        const isReverting = status === 'Rejected' && transfer.status === 'Approved';

        const actionTakerRole = req.user.role === 'CEO' ? 'CEO' : 'Admin';
        let formattedAction = status;

        if (isReverting && actionTakerRole === 'CEO') {
            formattedAction = `Overridden to Rejected by CEO`;
        } else {
            formattedAction = `${status} by ${actionTakerRole}`;
        }

        const finalRemarks = adminRemarks
            ? `${formattedAction} | Remarks: ${adminRemarks}`
            : formattedAction;

        const updatedTransfer = await Transfer.findByIdAndUpdate(
            id,
            {
                status,
                adminRemarks: finalRemarks,
                actionedBy: req.user?.id,
                actionedAt: new Date(),
                $push: {
                    auditLog: {
                        action: status,
                        by: req.user?.id || 'System',
                        remarks: finalRemarks
                    }
                }
            },
            { new: true }
        );

        if (isApproving) {
            await Employee.findOneAndUpdate(
                { employeeCode: transfer.employeeId },
                { department: transfer.newDepartment }
            );
            await User.findOneAndUpdate(
                { employeeCode: transfer.employeeId },
                { department: transfer.newDepartment }
            );
        } else if (isReverting) {
            await Employee.findOneAndUpdate(
                { employeeCode: transfer.employeeId },
                { department: transfer.currentDepartment }
            );
            await User.findOneAndUpdate(
                { employeeCode: transfer.employeeId },
                { department: transfer.currentDepartment }
            );
        }

        res.status(200).json({
            success: true,
            data: updatedTransfer
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getEmployeeLatestTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { employeeId } = req.params;

        const latestTransfer = await Transfer.findOne({
            employeeId: employeeId
        }).sort({ createdAt: -1 });

        res.status(200).json(latestTransfer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};