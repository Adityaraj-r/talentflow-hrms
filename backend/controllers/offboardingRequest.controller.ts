import { Response } from 'express';
import mongoose from 'mongoose'; 
import { AuthRequest } from '../middleware/auth.middleware';
import OffboardingRequest from '../models/OffboardingRequest.model';
import Employee from '../models/Employee.model';
import User from '../models/User.model';
import { sendTerminationEmail } from '../utils/sendEmail';

const getEmployeeRecord = async (userEmail: string, userId: string) => {
    return await Employee.findOne({ $or: [{ email: userEmail }, { userId: userId }] });
};

export const initiateOffboarding = async (req: AuthRequest, res: Response) => {
    try {
        const allowedRoles = ['EMPLOYEE', 'DIRECT_MANAGER', 'HR_MANAGER'];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Unauthorized to initiate offboarding.' });
        }

        let { employeeId, type, reason, proposedExitDate } = req.body;
        let initialStatus = 'Pending Verification';
        let actionRemarks = reason || 'Offboarding initiated';
        
        let targetEmployee; 

        if (req.user.role === 'EMPLOYEE') {
            targetEmployee = await getEmployeeRecord(req.user.email, req.user.id);
            if (!targetEmployee) return res.status(404).json({ success: false, error: 'Employee record not found.' });

            employeeId = targetEmployee.employeeCode; 
            type = 'Resignation'; 
            initialStatus = 'Pending Manager Approval'; 
            actionRemarks = 'Voluntary Resignation Submitted';
        } 
        else {
            if (!employeeId) return res.status(400).json({ success: false, error: 'Employee ID is required.' });
            const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);
            const query = isObjectId ? { _id: employeeId } : { employeeCode: employeeId };
            
            targetEmployee = await Employee.findOne(query);
            if (!targetEmployee) return res.status(404).json({ success: false, error: 'Target employee not found.' });

            initialStatus = req.user.role === 'DIRECT_MANAGER' ? 'Pending HR Approval' : 'Pending Country Manager Approval';
            actionRemarks = `Involuntary ${type} Initiated by ${req.user.role.replace('_', ' ')}`;
        }

        const offboardingData = new OffboardingRequest({
            employeeId: targetEmployee.employeeCode || targetEmployee._id.toString(),
            employeeName: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
            department: targetEmployee.department || 'N/A',
            designation: targetEmployee.designation || 'N/A',
            type,
            reason,
            proposedExitDate,
            initiatedBy: req.user.id,
            status: initialStatus,
            auditLog: [{
                action: 'Initiated',
                by: req.user.id,
                remarks: actionRemarks
            }]
        });

        const savedRequest = await offboardingData.save();

        if (type === 'Resignation') {
            await Employee.findByIdAndUpdate(targetEmployee._id, { status: initialStatus });
        }

        res.status(201).json({ success: true, data: savedRequest });
    } catch (error: any) {
        console.error("Initiate Offboarding Error:", error); 
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

        if (req.user?.role === 'EMPLOYEE') {
            const myRecord = await getEmployeeRecord(req.user.email, req.user.id);
            query.employeeId = myRecord?.employeeCode || 'UNAUTHORIZED';
        } else if (req.user?.role === 'DIRECT_MANAGER') {
            const managerRecord = await getEmployeeRecord(req.user.email, req.user.id);
            if (managerRecord?.employeeCode) {
                const directReports = await Employee.find({ reportingManagerId: managerRecord.employeeCode }).select('employeeCode');
                query.employeeId = { $in: directReports.map(emp => emp.employeeCode).filter(Boolean) };
            } else {
                query.employeeId = { $in: [] }; 
            }
        }

        const [total, requests] = await Promise.all([
            OffboardingRequest.countDocuments(query),
            OffboardingRequest.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

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
        const allowedRoles = ['DIRECT_MANAGER', 'HR_MANAGER', 'COUNTRY_MANAGER', 'CEO'];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: "Unauthorized role for this action." });
        }

        const request = await OffboardingRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, error: "Offboarding request not found." });

        const role = req.user.role;
        let isAuthorizedTransition = false;

        if (role === 'DIRECT_MANAGER' && request.status === 'Pending Manager Approval' && status === 'Pending HR Approval') isAuthorizedTransition = true;
        if (role === 'HR_MANAGER' && request.status === 'Pending HR Approval' && status === 'Pending Country Manager Approval') isAuthorizedTransition = true;
        if (role === 'COUNTRY_MANAGER' && request.status === 'Pending Country Manager Approval' && status === 'Pending CEO Approval') isAuthorizedTransition = true;
        if (role === 'CEO' && request.status === 'Pending CEO Approval' && ['Approved', 'Rejected'].includes(status)) isAuthorizedTransition = true;

        if (!isAuthorizedTransition && !['Rejected'].includes(status)) {
             return res.status(403).json({ success: false, error: `Role ${role} cannot change status from ${request.status} to ${status}.` });
        }

        const formattedAction = `${status} by ${role.replace('_', ' ')}`;
        const finalRemarks = adminRemarks ? `${formattedAction} | Remarks: ${adminRemarks}` : formattedAction;

        const updatedRequest = await OffboardingRequest.findByIdAndUpdate(
            id,
            {
                status,
                adminRemarks: finalRemarks,
                actionedBy: req.user.id,
                actionedAt: new Date(),
                $push: {
                    auditLog: { action: status, by: req.user.id, remarks: finalRemarks }
                }
            },
            { new: true }
        );

       const employeeQuery = mongoose.Types.ObjectId.isValid(request.employeeId) 
            ? { _id: request.employeeId } 
            : { employeeCode: request.employeeId };

       if (status === 'Approved' && role === 'CEO') {
            await Employee.findOneAndUpdate(
                employeeQuery,
                { status: 'On Notice Period', exitDate: request.proposedExitDate, exitReason: request.reason }
            );
            
            // Note: We do NOT immediately disable the user account or send a termination email here.
            // The daily cron job will handle transitioning 'On Notice Period' to 'Terminated/Exited' 
            // and revoking access on their Last Working Day (exitDate).
        } else if (status === 'Rejected') {
            await Employee.findOneAndUpdate(
                employeeQuery,
                { status: 'Active' }
            );
        } else {
            await Employee.findOneAndUpdate(
                employeeQuery,
                { status }
            );
        }

        res.status(200).json({ success: true, data: updatedRequest });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getEligibleEmployees = async (req: AuthRequest, res: Response) => {
    try {
        const role = req.user?.role;
        let query: any = {};

        if (role === 'DIRECT_MANAGER') {
            const managerRecord = await Employee.findOne({ $or: [{ email: req.user?.email }, { userId: req.user?.id }] });
            if (!managerRecord) return res.status(200).json({ success: true, data: [] });
            query = { reportingManagerId: managerRecord.employeeCode, status: { $ne: 'Terminated' } };
        } else if (role === 'HR_MANAGER') {
            query = { role: { $ne: 'CEO' }, status: { $ne: 'Terminated' } };
        } else {
            return res.status(403).json({ success: false, error: 'Unauthorized role for fetching offboarding list.' });
        }

        const employees = await Employee.find(query)
            .select('firstName lastName employeeCode role department')
            .sort({ firstName: 1 });
        
        res.status(200).json({ success: true, data: employees });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};