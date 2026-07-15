import { Response } from 'express';
import mongoose from 'mongoose'; 
import { AuthRequest } from '../middleware/auth.middleware';
import OffboardingRequest from '../models/OffboardingRequest.model';
import Employee from '../models/Employee.model';

const getEmployeeRecord = async (userEmail: string, userId: string) => {
    return await Employee.findOne({ $or: [{ email: userEmail }, { userId: userId }] });
};

export const initiateOffboarding = async (req: AuthRequest, res: Response) => {
    try {
        const allowedRoles = ['EMPLOYEE', 'DIRECT_MANAGER', 'HR_MANAGER', 'COUNTRY_MANAGER', 'CEO'];
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Unauthorized to initiate offboarding.' });
        }

        let { employeeId, type, reason, proposedExitDate, priority } = req.body;
        let initialStatus = 'Pending Manager Approval';
        let actionRemarks = reason || 'Offboarding initiated';
        
        let targetEmployee; 

        if (req.user.role === 'EMPLOYEE') {
            targetEmployee = await getEmployeeRecord(req.user.email, req.user.id);
            if (!targetEmployee) return res.status(404).json({ success: false, error: 'Employee record not found.' });

            employeeId = targetEmployee.employeeCode; 
            type = 'Resignation'; 
            
            // Dynamic routing based on reporting hierarchy
            const manager = await Employee.findOne({ employeeCode: targetEmployee.reportingManagerId });
            if (manager && manager.role === 'CEO') {
                initialStatus = 'Pending CEO Approval';
            } else if (manager && manager.role === 'COUNTRY_MANAGER') {
                initialStatus = 'Pending Country Manager Approval';
            } else {
                initialStatus = 'Pending Manager Approval'; 
            }

            actionRemarks = 'Voluntary Resignation Submitted';
        } 
        else {
            if (!employeeId) return res.status(400).json({ success: false, error: 'Employee ID is required.' });
            const isObjectId = mongoose.Types.ObjectId.isValid(employeeId);
            const query = isObjectId ? { _id: employeeId } : { employeeCode: employeeId };
            
            targetEmployee = await Employee.findOne(query);
            if (!targetEmployee) return res.status(404).json({ success: false, error: 'Target employee not found.' });

            if (req.user.role === 'CEO') {
                initialStatus = 'Approved'; // CEO can direct approve terminations
            } else if (req.user.role === 'COUNTRY_MANAGER') {
                initialStatus = 'Pending CEO Approval';
            } else if (req.user.role === 'HR_MANAGER') {
                initialStatus = 'Pending Country Manager Approval';
            } else {
                initialStatus = 'Pending HR Approval';
            }
            actionRemarks = `Involuntary ${type} Initiated by ${req.user.role.replace('_', ' ')}`;
        }

        const proposedDate = new Date(proposedExitDate);
        const today = new Date();
        const diffTime = Math.abs(proposedDate.getTime() - today.getTime());
        const totalDaysRequired = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const offboardingData = new OffboardingRequest({
            employeeId: targetEmployee.employeeCode || targetEmployee._id.toString(),
            employeeName: `${targetEmployee.firstName} ${targetEmployee.lastName}`,
            department: targetEmployee.department || 'N/A',
            designation: targetEmployee.designation || 'N/A',
            type,
            reason,
            priority: priority || 'Normal',
            noticePeriod: {
                proposedExitDate: proposedDate,
                totalDaysRequired
            },
            initiatedBy: req.user.id,
            status: initialStatus,
            auditLog: [{
                action: 'Initiated',
                by: req.user.id,
                remarks: actionRemarks,
                timestamp: new Date()
            }]
        });

        const savedRequest = await offboardingData.save();

        if (type === 'Resignation') {
            await Employee.findByIdAndUpdate(targetEmployee._id, { status: initialStatus });
        } else if (initialStatus === 'Approved') {
            await Employee.findByIdAndUpdate(targetEmployee._id, { status: 'On Notice Period', exitDate: proposedDate, exitReason: reason });
        }

        res.status(201).json({ success: true, data: savedRequest });
    } catch (error: any) {
        console.error("Initiate Offboarding Error:", error); 
        res.status(400).json({ success: false, error: error.message });
    }
};

export const withdrawOffboardingRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const request = await OffboardingRequest.findById(id);
        
        if (!request) return res.status(404).json({ success: false, error: "Request not found." });
        
        if (!request.status.includes('Pending')) {
            return res.status(400).json({ success: false, error: "Cannot withdraw request. It is no longer pending." });
        }

        if (request.initiatedBy.toString() !== req.user!.id.toString()) {
            return res.status(403).json({ success: false, error: "Only the initiator can withdraw this request." });
        }

        // Verify owner for status reset
        const targetEmployee = await Employee.findOne({ $or: [{ employeeCode: request.employeeId }, { _id: request.employeeId }] });
        if (!targetEmployee) return res.status(404).json({ success: false, error: "Employee not found." });

        request.status = 'Withdrawn';
        request.auditLog.push({
            action: 'Withdrawn',
            by: req.user!.id,
            remarks: 'Employee withdrew the resignation request.',
            timestamp: new Date()
        });

        await request.save();
        await Employee.findByIdAndUpdate(targetEmployee._id, { status: 'Active' });

        res.status(200).json({ success: true, data: request });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
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
        let approvalField = '';

        if (role === 'DIRECT_MANAGER' && request.status === 'Pending Manager Approval' && status === 'Pending HR Approval') { isAuthorizedTransition = true; approvalField = 'manager'; }
        if (role === 'HR_MANAGER' && request.status === 'Pending HR Approval' && status === 'Pending Country Manager Approval') { isAuthorizedTransition = true; approvalField = 'hr'; }
        if (role === 'COUNTRY_MANAGER' && request.status === 'Pending Country Manager Approval' && status === 'Pending CEO Approval') { isAuthorizedTransition = true; approvalField = 'countryManager'; }
        if (role === 'CEO' && request.status === 'Pending CEO Approval' && ['Approved', 'Rejected'].includes(status)) { isAuthorizedTransition = true; approvalField = 'ceo'; }
        
        if (['Rejected'].includes(status)) {
            isAuthorizedTransition = true; // Any allowed role can reject at their stage
            if (role === 'DIRECT_MANAGER') approvalField = 'manager';
            if (role === 'HR_MANAGER') approvalField = 'hr';
            if (role === 'COUNTRY_MANAGER') approvalField = 'countryManager';
            if (role === 'CEO') approvalField = 'ceo';
        }

        if (!isAuthorizedTransition) {
             return res.status(403).json({ success: false, error: `Role ${role} cannot change status from ${request.status} to ${status}.` });
        }

        const formattedAction = `${status} by ${role.replace('_', ' ')}`;
        const finalRemarks = adminRemarks ? `${formattedAction} | Remarks: ${adminRemarks}` : formattedAction;

        request.status = status;
        request.actionedBy = req.user.id;
        request.actionedAt = new Date();
        
        if (approvalField) {
            (request.approvals as any)[approvalField] = {
                status: status === 'Rejected' ? 'Rejected' : 'Approved',
                by: req.user.id,
                date: new Date(),
                remarks: adminRemarks || ''
            };
        }

        request.auditLog.push({ action: status, by: req.user.id, remarks: finalRemarks, timestamp: new Date() });

        if (status === 'Approved') {
            request.status = 'On Notice Period'; // Convert Approved to On Notice
            request.noticePeriod.approvedExitDate = request.noticePeriod.proposedExitDate;
        }

        const updatedRequest = await request.save();

        const employeeQuery = mongoose.Types.ObjectId.isValid(request.employeeId) 
             ? { _id: request.employeeId } 
             : { employeeCode: request.employeeId };

        if (status === 'Approved') {
             await Employee.findOneAndUpdate(
                 employeeQuery,
                 { status: 'On Notice Period', exitDate: request.noticePeriod.approvedExitDate, exitReason: request.reason }
             );
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
        } else if (role === 'HR_MANAGER' || role === 'CEO' || role === 'COUNTRY_MANAGER') {
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

export const updateClearance = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { clearanceType, status, assetUpdates, ktUpdates } = req.body;

        const request = await OffboardingRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, error: "Offboarding request not found." });

        if (clearanceType && ['it', 'finance', 'admin', 'manager'].includes(clearanceType)) {
            (request.clearance as any)[clearanceType] = {
                status,
                by: req.user!.id,
                date: new Date()
            };
            request.auditLog.push({ action: `${clearanceType.toUpperCase()} Clearance: ${status}`, by: req.user!.id, timestamp: new Date() });
        }

        if (assetUpdates) {
            request.assets = assetUpdates;
            request.auditLog.push({ action: 'Assets Updated', by: req.user!.id, timestamp: new Date() });
        }

        if (ktUpdates) {
            request.knowledgeTransfer = { ...request.knowledgeTransfer, ...ktUpdates };
            request.auditLog.push({ action: `KT Updated: ${ktUpdates.status}`, by: req.user!.id, timestamp: new Date() });
        }

        await request.save();
        res.status(200).json({ success: true, data: request });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};