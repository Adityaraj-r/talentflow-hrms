import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (
    personalEmail: string,
    firstName: string,
    workEmail: string,
    unhashedPassword: string
) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"InternsLand HR" <${process.env.SMTP_USER}>`,
            to: personalEmail,
            subject: 'Welcome to InternsLand! Your Login Credentials',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Welcome to the Team, ${firstName}! 🎉</h2>
                    <p style="color: #334155; font-size: 16px;">
                        Your onboarding is complete, and your official employee account has been created.
                    </p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Work Email (Login ID):</strong> ${workEmail}</p>
                        <p style="margin: 0;"><strong>Temporary Password:</strong> ${unhashedPassword}</p>
                    </div>
                    <p style="color: #ef4444; font-size: 14px; font-weight: bold;">
                        SECURITY NOTICE: Please log in and change this temporary password immediately.
                    </p>
                    <br/>
                    <p style="color: #64748b; font-size: 14px;">
                        Best regards,<br/>
                        <strong>InternsLand HR Administration</strong>
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent successfully to ${personalEmail}`);
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);

    }
};