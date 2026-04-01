import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Promotion from '../models/Promotion.model';
import Employee from '../models/Employee.model';
import User from '../models/User.model';

export const nominateForPromotion = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'HR_MANAGER') {
            return res.status(403).json({ success: false, error: 'Only HR Managers can nominate employees for promotion.' });
        }

        const promotionData = new Promotion({
            ...req.body,
            nominatedBy: req.user.id,
            status: 'Pending Verification', 
            auditLog: [{
                action: 'Nominated',
                by: req.user.id,
                remarks: req.body.justification || 'Promotion nomination submitted by HR'
            }]
        });

        const savedPromotion = await promotionData.save();

        res.status(201).json({ success: true, data: savedPromotion });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getAllPromotions = async (req: AuthRequest, res: Response) => {
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

        const total = await Promotion.countDocuments(query);
        const promotions = await Promotion.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            data: promotions,
            pagination: { total, page, totalPages: Math.ceil(total / limit) }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePromotionStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminRemarks, newDesignation, newSalary, newRole } = req.body;

    try {
        const allowedRoles = ['COUNTRY_MANAGER', 'CEO'];

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: "Unauthorized to action this request." });
        }

        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ success: false, error: "Promotion not found" });
        }

        const actionTakerRole = req.user.role;
        let formattedAction = `${status} by ${actionTakerRole}`;
        const updateData: any = {
            status,
            actionedBy: req.user.id,
            actionedAt: new Date(),
        };

        if (actionTakerRole === 'COUNTRY_MANAGER' && status === 'Pending CEO') {
            formattedAction = `Verified and forwarded to CEO by Country Manager`;
            if (newDesignation) updateData.newDesignation = newDesignation;
            if (newSalary) updateData.newSalary = newSalary;
            if (newRole) updateData.newRole = newRole;
        }

        const finalRemarks = adminRemarks ? `${formattedAction} | Remarks: ${adminRemarks}` : formattedAction;
        updateData.adminRemarks = finalRemarks;

        const updatedPromotion = await Promotion.findByIdAndUpdate(
            id,
            {
                ...updateData,
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

        if (status === 'Approved' && actionTakerRole === 'CEO') {
            await Employee.findOneAndUpdate(
                { employeeCode: promotion.employeeId },
                { 
                    designation: updatedPromotion?.newDesignation,
                    role: updatedPromotion?.newRole,
                    'salary.basic': updatedPromotion?.newSalary 
                }
            );
            await User.findOneAndUpdate(
                { employeeCode: promotion.employeeId },
                { role: updatedPromotion?.newRole }
            );
        }

        res.status(200).json({ success: true, data: updatedPromotion });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};