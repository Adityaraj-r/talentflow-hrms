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
    mode: "Online" | "InPerson";
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
    const prettyJson = JSON.stringify(payload, null, 2);

    const interviewersHtml = payload.interviewers
        .map((i) => `<li>${i.name} (${i.designation})</li>`)
        .join("");
    const instructionsHtml = payload.instructions
        .map((i) => `<li>${i}</li>`)
        .join("");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
        <h2>Interview Schedule</h2>
        <p>Dear ${payload.candidateName},</p>
        <p>Your interview has been scheduled. Please find the details below.</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 12px;">
          <tr><td style="padding:6px 0;"><strong>Job Title</strong></td><td>${payload.jobTitle}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Department</strong></td><td>${payload.department}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Date</strong></td><td>${payload.interviewDate}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Time</strong></td><td>${payload.startTime} - ${payload.endTime}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Mode</strong></td><td>${payload.mode}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Location</strong></td><td>${payload.location || "-"}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Meeting Link</strong></td><td>${payload.meetingLink ? `<a href="${payload.meetingLink}">${payload.meetingLink}</a>` : "-"}</td></tr>
        </table>
        <h3 style="margin-top: 18px;">Interviewers</h3>
        <ul>${interviewersHtml || "<li>-</li>"}</ul>
        <h3 style="margin-top: 18px;">Instructions</h3>
        <ul>${instructionsHtml || "<li>-</li>"}</ul>
        <h3 style="margin-top: 18px;">HR Contact</h3>
        <p>
          ${payload.hrContact.name}<br/>
          ${payload.hrContact.email}<br/>
          ${payload.hrContact.phone || "-"}
        </p>
        <hr/>
        <p style="font-size: 12px; color: #555;">Structured payload:</p>
        <pre style="background:#f6f8fa; padding:12px; border-radius:6px; font-size:12px;">${prettyJson}</pre>
      </div>
    `;

    const fromEmail = mailer.cfg.user;

    try {
        await mailer.transporter.sendMail({
            from: `"InternsLand HR" <${fromEmail}>`,
            to: candidateEmail,
            subject: `Interview Scheduled: ${payload.jobTitle}`,
            html,
            attachments: [
                {
                    filename: "interview-schedule.json",
                    content: prettyJson,
                    contentType: "application/json",
                },
            ],
        });
        return { sent: true };
    } catch (error: any) {
        console.error('Error sending interview schedule email:', error);
        return { sent: false, reason: error?.message || 'Email send failed' };
    }
};