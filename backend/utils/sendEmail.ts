import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

type MailConfig = {
    user: string;
    pass: string;
    host?: string;
    port?: number;
    secure?: boolean;
    service?: string;
};

const getString = (obj: Record<string, any> | null, keys: string[]): string => {
    if (!obj) return "";
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
};

const getNumber = (obj: Record<string, any> | null, keys: string[]): number | undefined => {
    if (!obj) return undefined;
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "number" && Number.isFinite(v)) return v;
        if (typeof v === "string" && v.trim()) {
            const parsed = Number(v.trim());
            if (Number.isFinite(parsed)) return parsed;
        }
    }
    return undefined;
};

const getBoolean = (obj: Record<string, any> | null, keys: string[]): boolean | undefined => {
    if (!obj) return undefined;
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === "boolean") return v;
        if (typeof v === "number") return v === 1;
        if (typeof v === "string") {
            const normalized = v.trim().toLowerCase();
            if (normalized === "true" || normalized === "1") return true;
            if (normalized === "false" || normalized === "0") return false;
        }
    }
    return undefined;
};

const resolveMailConfig = async (): Promise<MailConfig | null> => {
    const envUser = process.env.SMTP_USER || "";
    const envPass = process.env.SMTP_PASS || "";
    if (envUser.trim() && envPass.trim()) {
        const envService = process.env.SMTP_SERVICE || "";
        const envHost = process.env.SMTP_HOST || "";
        const envPortRaw = process.env.SMTP_PORT || "";
        const envSecureRaw = process.env.SMTP_SECURE || "";
        const envPort = Number(envPortRaw);
        const envSecure =
            envSecureRaw.toLowerCase() === "true" ||
            envSecureRaw === "1";
        return {
            user: envUser.trim(),
            pass: envPass.trim(),
            service: envService.trim() || undefined,
            host: envHost.trim() || undefined,
            port: Number.isFinite(envPort) ? envPort : undefined,
            secure: envSecure,
        };
    }

    try {
        const db = mongoose.connection?.db;
        if (!db) return null;
        const settings = await db.collection("settings").findOne({});
        const user = getString(settings as any, [
            "smtpUser",
            "smtp_user",
            "mailUser",
            "mail_user",
            "hrSmtpUser",
            "smtpUsername",
            "smtp_username",
        ]);
        const pass = getString(settings as any, [
            "smtpPass",
            "smtp_pass",
            "mailPass",
            "mail_pass",
            "hrSmtpPass",
            "smtpPassword",
            "smtp_password",
        ]);
        const host = getString(settings as any, [
            "hrSmtpHost",
            "smtpHost",
            "smtp_host",
            "mailHost",
            "mail_host",
        ]);
        const service = getString(settings as any, [
            "smtpService",
            "smtp_service",
            "mailService",
            "mail_service",
        ]);
        const secureValue = getBoolean(settings as any, [
            "hrSmtpSecure",
            "smtpSecure",
            "smtp_secure",
            "mailSecure",
            "mail_secure",
        ]);
        const portNum = getNumber(settings as any, [
            "hrSmtpPort",
            "smtpPort",
            "smtp_port",
            "mailPort",
            "mail_port",
        ]);
        if (user && pass) {
            return {
                user,
                pass,
                host: host || undefined,
                service: service || undefined,
                port: portNum,
                secure: secureValue,
            };
        }
    } catch (e) {
        console.error("Mail config resolution error:", e);
    }
    return null;
};

const createHrTransporter = async () => {
    const cfg = await resolveMailConfig();
    if (!cfg) {
        return null;
    }
    const transportConfig = cfg.service || !cfg.host
        ? {
            service: cfg.service || "gmail",
            auth: {
                user: cfg.user,
                pass: cfg.pass,
            },
        }
        : {
            host: cfg.host,
            port: cfg.port || (cfg.secure ? 465 : 587),
            secure: Boolean(cfg.secure),
            auth: {
                user: cfg.user,
                pass: cfg.pass,
            },
        };
    const transporter = nodemailer.createTransport(transportConfig);
    return { transporter, cfg };
};

export const getHrSenderEmail = async (): Promise<string> => {
    const cfg = await resolveMailConfig();
    return cfg?.user || "";
};

export const sendWelcomeEmail = async (
    personalEmail: string,
    firstName: string,
    workEmail: string,
    unhashedPassword: string
) => {
    try {
        const mailer = await createHrTransporter();
        if (!mailer) {
            console.error('SMTP is not configured. Skipping welcome email.');
            return;
        }
        const fromEmail = mailer.cfg.user;

        const mailOptions = {
            from: `"InternsLand HR" <${fromEmail}>`,
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

        await mailer.transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${personalEmail}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);

    }
};

type Interviewer = {
    name: string;
    designation: string;
};

type InterviewMailPayload = {
    candidateName: string;
    jobTitle: string;
    department: string;
    interviewDate: string;
    startTime: string;
    endTime: string;
    mode: "Online" | "Offline";
    location: string;
    meetingLink: string;
    interviewers: Interviewer[];
    instructions: string[];
    hrContact: {
        name: string;
        email: string;
        phone: string;
    };
};

export const sendInterviewScheduleEmail = async (
    candidateEmail: string,
    payload: InterviewMailPayload
) => {
    const mailer = await createHrTransporter();
    if (!mailer) {
        return {
            sent: false,
            reason: 'SMTP is not configured. Configure HR SMTP in System Settings.'
        };
    }
    const interviewersHtml = payload.interviewers
        .map((i) => `<li style="margin: 0 0 6px 0;">${i.name} - ${i.designation}</li>`)
        .join("");
    const instructionsHtml = payload.instructions
        .map((i) => `<li style="margin: 0 0 6px 0;">${i}</li>`)
        .join("");

    const venueText = payload.mode === "Online" ? "Google Meet" : (payload.location || "Shared by HR team");
    const modeBadgeBg = payload.mode === "Online" ? "#dbeafe" : "#dcfce7";
    const modeBadgeColor = payload.mode === "Online" ? "#1d4ed8" : "#166534";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; color:#0f172a; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
        <div style="background: linear-gradient(135deg, #2563eb, #0ea5e9); padding: 24px;">
          <h2 style="margin:0; color:white; font-size:22px;">Interview Invitation</h2>
          <p style="margin:8px 0 0; color:#e0f2fe; font-size:14px;">${payload.jobTitle} - ${payload.department}</p>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 14px 0;">Hi ${payload.candidateName},</p>
          <p style="margin: 0 0 16px 0; line-height:1.6;">
            We are delighted to invite you to the next step of our hiring process. Your interview has been confirmed with the details below.
          </p>

          <div style="display:inline-block; background:${modeBadgeBg}; color:${modeBadgeColor}; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:700; margin-bottom:14px;">
            ${payload.mode} Interview
          </div>

          <table style="border-collapse: collapse; width: 100%; margin-top: 4px; background:#f8fafc; border-radius:8px;">
            <tr><td style="padding:10px 12px; width:170px;"><strong>Date</strong></td><td style="padding:10px 12px;">${payload.interviewDate}</td></tr>
            <tr><td style="padding:10px 12px;"><strong>Time</strong></td><td style="padding:10px 12px;">${payload.startTime} - ${payload.endTime}</td></tr>
            <tr><td style="padding:10px 12px;"><strong>Venue</strong></td><td style="padding:10px 12px;">${venueText}</td></tr>
            <tr><td style="padding:10px 12px;"><strong>Location</strong></td><td style="padding:10px 12px;">${payload.location || "-"}</td></tr>
            <tr><td style="padding:10px 12px;"><strong>Meeting Link</strong></td><td style="padding:10px 12px;">${payload.meetingLink ? `<a href="${payload.meetingLink}" style="color:#2563eb;">Join Interview</a>` : "-"}</td></tr>
          </table>

          <h3 style="margin: 20px 0 10px 0; font-size:16px;">Interview Panel</h3>
          <ul style="padding-left:18px; margin: 0;">${interviewersHtml || "<li>Will be shared shortly</li>"}</ul>

          <h3 style="margin: 18px 0 10px 0; font-size:16px;">Preparation Tips</h3>
          <ul style="padding-left:18px; margin: 0;">${instructionsHtml || "<li>Please keep a valid ID and resume copy ready</li>"}</ul>

          <div style="margin-top:20px; padding:12px 14px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc;">
            <p style="margin: 0 0 6px 0; font-size:13px; color:#475569;"><strong>Need help?</strong> Reach out to:</p>
            <p style="margin: 0; font-size:14px; line-height:1.5;">
              ${payload.hrContact.name}<br/>
              ${payload.hrContact.email}<br/>
              ${payload.hrContact.phone || "-"}
            </p>
          </div>

          <p style="margin: 18px 0 0 0; line-height:1.6;">
            We look forward to speaking with you and learning more about your experience.
          </p>
          <p style="margin: 12px 0 0 0;">Best regards,<br/><strong>HR Team</strong></p>
        </div>
      </div>
    `;

    const fromEmail = mailer.cfg.user;

    try {
        await mailer.transporter.sendMail({
            from: `"InternsLand HR" <${fromEmail}>`,
            to: candidateEmail,
            subject: `Interview Scheduled: ${payload.jobTitle}`,
            html,
        });
        return { sent: true };
    } catch (error: any) {
        console.error('Error sending interview schedule email:', error);
        return { sent: false, reason: error?.message || 'Email send failed' };
    }
};

export const sendTerminationEmail = async (
    personalEmail: string,
    payload: {
        name: string;
        exitDate: string;
        reason: string;
        companyName: string;
    }
) => {
    try {
        const mailer = await createHrTransporter();
        if (!mailer) {
            console.error('SMTP is not configured. Skipping termination email.');
            return { sent: false, reason: 'SMTP not configured' };
        }
        const fromEmail = mailer.cfg.user;

        const mailOptions = {
            from: `"HR Administration - ${payload.companyName}" <${fromEmail}>`,
            to: personalEmail,
            subject: 'Important Notice Regarding Your Employment',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #ef4444; padding: 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Notice of Employment Separation</h2>
                    </div>
                    <div style="padding: 24px; background-color: #ffffff;">
                        <p style="color: #334155; font-size: 16px; margin-top: 0;">Dear ${payload.name},</p>
                        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                            This email serves as formal notification that your employment with <strong>${payload.companyName}</strong> has been concluded.
                        </p>
                        
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 0 0 12px 0; color: #0f172a;"><strong>Effective Date of Separation:</strong> <span style="color: #ef4444;">${payload.exitDate}</span></p>
                            <p style="margin: 0; color: #0f172a;"><strong>Reason for Separation:</strong><br/>
                            <span style="color: #475569; display: inline-block; margin-top: 4px;">${payload.reason}</span></p>
                        </div>

                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                            Your system access has been revoked. If you are in possession of any company assets (laptops, ID badges, etc.), please coordinate with the HR department for their immediate return. Information regarding your final settlement and offboarding documents will be communicated to you shortly.
                        </p>
                        
                        <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                            <p style="color: #64748b; font-size: 14px; margin: 0;">
                                Sincerely,<br/>
                                <strong style="color: #334155;">Human Resources Department</strong><br/>
                                ${payload.companyName}
                            </p>
                        </div>
                    </div>
                </div>
            `,
        };

        await mailer.transporter.sendMail(mailOptions);
        console.log(`Termination email successfully sent to ${personalEmail}`);
        return { sent: true };
    } catch (error: any) {
        console.error('Error sending termination email:', error);
        return { sent: false, reason: error?.message || 'Email send failed' };
    }
};

export const sendApplicationStatusEmail = async (
    candidateEmail: string,
    candidateName: string,
    status: "Shortlisted" | "Rejected" | "Selected"
) => {
    try {
        const mailer = await createHrTransporter();

        if (!mailer) {
            console.error("SMTP not configured. Skipping status email.");
            return;
        }

        let subject = "";
        let html = "";

        if (status === "Shortlisted") {
            subject = "You are Shortlisted 🎉";
            html = `
                <h2>Hi ${candidateName},</h2>
                <p>Congratulations! You have been <b>shortlisted</b> for the next round.</p>
                <p>We will contact you soon with further details.</p>
                <br/>
                <p>Best regards,<br/>HR Team</p>
            `;
        }

        if (status === "Rejected") {
            subject = "Application Update";
            html = `
                <h2>Hi ${candidateName},</h2>
                <p>Thank you for applying.</p>
                <p>We regret to inform you that you were not selected.</p>
                <br/>
                <p>We wish you all the best for your future.</p>
                <p>Regards,<br/>HR Team</p>
            `;
        }

        if (status === "Selected") {
            subject = "You are Selected 🎉";
            html = `
                <h2>Hi ${candidateName},</h2>
                <p>Congratulations! 🎉</p>
                <p>You have been <b>selected</b> for the position.</p>
                <p>HR team will contact you with onboarding details.</p>
                <br/>
                <p>Best regards,<br/>HR Team</p>
            `;
        }

        const fromEmail = mailer.cfg.user;

        await mailer.transporter.sendMail({
            from: `"InternsLand HR" <${fromEmail}>`,
            to: candidateEmail,
            subject,
            html,
        });

        console.log(`Status email sent to ${candidateEmail}`);
    } catch (error) {
        console.error("Error sending status email:", error);
    }
};