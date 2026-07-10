import cron from 'node-cron';
import Employee from '../models/Employee.model';
import User from '../models/User.model';
import { sendTerminationEmail } from '../utils/sendEmail';

export const initCronJobs = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily cron job for employee offboarding...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Find employees on On Notice Period whose exitDate is today or in the past
            const employeesToExit = await Employee.find({
                status: 'On Notice Period',
                exitDate: { $lte: today }
            });

            for (const employee of employeesToExit) {
                console.log(`Processing final exit for employee: ${employee.employeeCode}`);

                // Update Employee status to Exited
                // Note: The dashboard counts Resigned/Exited as 'Exited'
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

            console.log(`Successfully processed ${employeesToExit.length} employee exits.`);
        } catch (error) {
            console.error('Error during automated offboarding job:', error);
        }
    });
};
