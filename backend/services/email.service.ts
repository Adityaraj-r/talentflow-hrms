import nodemailer, { Transporter } from 'nodemailer';
import { getSmtpConfig, SmtpConfig } from '../config/smtp.config';
import { logEmailAttempt } from '../utils/emailLogger';
import { logger } from '../utils/logger';

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
};

export type SendEmailResult = {
  success: boolean;
  sent: boolean;
  reason?: string;
  messageId?: string;
};

let cachedTransporter: Transporter | null = null;
let cachedSignature = '';

const signatureFor = (config: SmtpConfig): string =>
  [config.host, config.port, config.secure, config.user, config.fromEmail, config.fromName].join('|');

const formatFrom = (config: SmtpConfig): string => {
  const fromName = config.fromName.replace(/"/g, "'");
  return `"${fromName}" <${config.fromEmail}>`;
};

const getTransporter = async (): Promise<{ transporter: Transporter; config: SmtpConfig } | null> => {
  const configResult = await getSmtpConfig();
  if (!configResult.configured) {
    logger.warn('SMTP is not configured', { reason: configResult.reason });
    return null;
  }

  const { config } = configResult;
  const signature = signatureFor(config);
  if (!cachedTransporter || cachedSignature !== signature) {
    cachedTransporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    cachedSignature = signature;
  }

  return { transporter: cachedTransporter, config };
};

export const sendEmail = async ({ to, subject, html, text, attachments }: SendEmailInput): Promise<SendEmailResult> => {
  try {
    const mailer = await getTransporter();
    if (!mailer) {
      const reason = 'SMTP is not configured';
      logEmailAttempt({ recipient: to, subject, status: 'skipped', error: reason });
      return { success: false, sent: false, reason };
    }

    const info = await mailer.transporter.sendMail({
      from: formatFrom(mailer.config),
      to,
      subject,
      html,
      text,
      attachments,
    });

    logEmailAttempt({ recipient: to, subject, status: 'sent' });
    return { success: true, sent: true, messageId: info.messageId };
  } catch (error: any) {
    logEmailAttempt({ recipient: to, subject, status: 'failed', error });
    return {
      success: false,
      sent: false,
      reason: error?.message || 'Email send failed',
    };
  }
};
