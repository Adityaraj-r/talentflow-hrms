import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import OffboardingRequest from '../models/OffboardingRequest.model';
import Employee from '../models/Employee.model';
import User from '../models/User.model';

export const initiateOffboarding = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'HR_MANAGER') {
            return res.status(403).json({ success: false, error: 'Unauthorized role.' });
        }

        const offboardingData = new OffboardingRequest({
            ...req.body,
            initiatedBy: req.user.id,
            status: 'Pending Verification',
            auditLog: [{
                action: 'Initiated Separation',
                by: req.user.id,
                remarks: req.body.reason
            }]
        });

        const savedRequest = await offboardingData.save();
        res.status(201).json({ success: true, data: savedRequest });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getAllOffboardingRequests = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string || '';

        const query: any = {};
        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { employeeId: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await OffboardingRequest.countDocuments(query);
        const requests = await OffboardingRequest.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            data: requests,
            pagination: { total, page, totalPages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateOffboardingStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    try {
        const allowedRoles = ['COUNTRY_MANAGER', 'CEO'];

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: "Unauthorized" });
        }

        const request = await OffboardingRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, error: "Not found" });
        }

        const actionTakerRole = req.user.role;
        const formattedAction = `${status} by ${actionTakerRole}`;
        const finalRemarks = adminRemarks ? `${formattedAction} | Remarks: ${adminRemarks}` : formattedAction;

        const updatedRequest = await OffboardingRequest.findByIdAndUpdate(
            id,
            {
                status,
                adminRemarks: finalRemarks,
                actionedBy: req.user.id,
                actionedAt: new Date(),
                $push: {
                    auditLog: {
                        action: status,
                        by: req.user.id,
                        remarks: finalRemarks
                    }
                }
            },
            { new: true }
        );

       if (status === 'Approved' && (actionTakerRole === 'CEO' || actionTakerRole === 'COUNTRY_MANAGER')) {
            await Employee.findOneAndUpdate(
                { employeeCode: request.employeeId },
                { 
                    status: 'Terminated',
                    exitDate: request.proposedExitDate,
                    exitReason: request.reason
                }
            );
            
            const employeeRecord = await Employee.findOne({ employeeCode: request.employeeId });
            
            if (employeeRecord && employeeRecord.userId) {
                await User.findByIdAndUpdate(
                    employeeRecord.userId,
                    { isActive: false, isDeleted: true }
                );
            }
        }

        res.status(200).json({ success: true, data: updatedRequest });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};