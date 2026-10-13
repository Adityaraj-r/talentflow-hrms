import cron from 'node-cron';
import Employee from '../models/Employee.model';
import User from '../models/User.model';
import OffboardingRequest from '../models/OffboardingRequest.model';
import { sendTerminationEmail, sendExitBlockedEmail } from '../utils/sendEmail';
import { processProbationCompletions, checkExpiringReferralInvitations } from '../services/referral.service';

export const initCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily cron job for employee offboarding...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            sevenDaysFromNow.setHours(0, 0, 0, 0);

            // Phase 1: Move 'On Notice Period' to 'Exit Clearance' exactly 7 days before LWD
            const employeesToClearance = await OffboardingRequest.find({
                status: 'On Notice Period',
                'noticePeriod.approvedExitDate': { $lte: sevenDaysFromNow }
            });

            for (const req of employeesToClearance) {
                req.status = 'Exit Clearance';
                req.auditLog.push({
                    action: 'Exit Clearance Phase Triggered',
                    by: 'System (Cron)',
                    remarks: 'Automatically moved to clearance phase 7 days before LWD.',
                    timestamp: new Date()
                });
                await req.save();

                await Employee.findOneAndUpdate(
                    { $or: [{ _id: req.employeeId }, { employeeCode: req.employeeId }] },
                    { status: 'Exit Clearance' }
                );
                console.log(`Triggered Exit Clearance for ${req.employeeId}`);
                // Ideally, send emails to IT/Admin/Finance here
            }

            // Phase 2: Final Exit Processing for those in 'Exit Clearance' or 'On Notice Period' whose LWD is today/past
            const employeesToExit = await OffboardingRequest.find({
                status: { $in: ['Exit Clearance', 'On Notice Period'] },
                'noticePeriod.approvedExitDate': { $lte: today }
            });

            for (const req of employeesToExit) {
                console.log(`Processing final exit for offboarding request: ${req._id}`);

                // Check if all clearances are done
                const { it, finance, admin, manager } = req.clearance;
                if (it.status !== 'Cleared' || finance.status !== 'Cleared' || admin.status !== 'Cleared' || manager.status !== 'Cleared') {
                    console.log(`Exit blocked for ${req.employeeId}: Clearances pending.`);
                    req.priority = 'High';
                    req.auditLog.push({
                        action: 'Exit Blocked',
                        by: 'System (Cron)',
                        remarks: 'Last working day reached but clearances are still pending. Priority escalated.',
                        timestamp: new Date()
                    });

                    const pendingDepts = [];
                    if (it.status !== 'Cleared') pendingDepts.push('IT');
                    if (finance.status !== 'Cleared') pendingDepts.push('Finance');
                    if (admin.status !== 'Cleared') pendingDepts.push('Admin');
                    if (manager.status !== 'Cleared') pendingDepts.push('Manager');

                    try {
                        await sendExitBlockedEmail('hr@internsland.com', req.employeeName, req.employeeId, pendingDepts);
                    } catch (e) {
                        console.error('Failed to send exit blocked email to HR', e);
                    }

                    await req.save();
                    continue; // Skip exit processing
                }

                // If cleared, proceed to Exit
                req.status = 'Exited';
                req.accessRevocation.completedAt = new Date();
                req.accessRevocation.email = true;
                req.accessRevocation.vpn = true;
                req.accessRevocation.hrms = true;
                req.auditLog.push({
                    action: 'Exited',
                    by: 'System (Cron)',
                    remarks: 'Employee successfully offboarded and access revoked.',
                    timestamp: new Date()
                });
                await req.save();

                const employee = await Employee.findOne({ $or: [{ _id: req.employeeId }, { employeeCode: req.employeeId }] });
                if (employee) {
                    employee.status = 'Exited';
                    await employee.save();

                    // Disable User account
                    if (employee.userId) {
                        await User.findByIdAndUpdate(
                            employee.userId,
                            { isActive: false, isDeleted: true }
                        );
                    }

                    // Send termination/exit email
                    let targetEmail = '';
                    if ((employee as any).personalEmail) {
                        targetEmail = (employee as any).personalEmail;
                    } else if (employee.email && (employee.email.includes('@gmail.com') || employee.email.includes('@yahoo.com'))) {
                        targetEmail = employee.email;
                    }

                    if (targetEmail) {
                        try {
                            await sendTerminationEmail(targetEmail, {
                                name: employee.firstName,
                                exitDate: new Date(employee.exitDate || Date.now()).toLocaleDateString('en-GB'),
                                reason: employee.exitReason || 'Completion of notice period',
                                companyName: "InternsLand" 
                            });
                        } catch (emailError) {
                            console.error(`Failed to trigger termination email for ${employee.employeeCode}:`, emailError);
                        }
                    }
                }
            }

            // Phase 3: Referral Module Automated Probation Completion & Expiry Warnings
            console.log('Running daily cron job for referral probation completions & invitation expiry checks...');
            await processProbationCompletions();
            await checkExpiringReferralInvitations();

        } catch (error) {
            console.error('Error during automated offboarding job:', error);
        }
    });
};
