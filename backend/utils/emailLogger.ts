import { logger } from './logger';

type EmailLogPayload = {
  recipient: string | string[];
  subject: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: unknown;
};

const normalizeError = (error: unknown): Record<string, unknown> | undefined => {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'string') return { message: error };
  return { message: 'Unknown email error' };
};

export const logEmailAttempt = ({ recipient, subject, status, error }: EmailLogPayload): void => {
  const entry = {
    recipient,
    subject,
    timestamp: new Date().toISOString(),
    status,
    error: normalizeError(error),
  };

  if (status === 'sent') {
    logger.info('Email sent', entry);
    return;
  }

  if (status === 'skipped') {
    logger.warn('Email skipped', entry);
    return;
  }

  logger.error('Email failed', entry);
};
