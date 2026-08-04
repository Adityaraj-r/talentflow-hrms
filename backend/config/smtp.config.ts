import dotenv from 'dotenv';
dotenv.config();
import Settings from '../models/Settings.model';
import { logger } from '../utils/logger';

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  source: 'env' | 'database';
};

export type SmtpConfigResult =
  | { configured: true; config: SmtpConfig }
  | { configured: false; reason: string };

const DEFAULT_FROM_NAME = 'InternsLand HR';

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const parsePort = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const parseBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return undefined;
};

const hasEnvSmtpConfig = (): boolean =>
  Boolean(
    clean(process.env.SMTP_HOST) ||
      clean(process.env.SMTP_PORT) ||
      clean(process.env.SMTP_USER) ||
      clean(process.env.SMTP_PASS) ||
      clean(process.env.SMTP_FROM_EMAIL) ||
      clean(process.env.SMTP_FROM)
  );

const validate = (config: Partial<SmtpConfig>, source: SmtpConfig['source']): SmtpConfigResult => {
  const missing: string[] = [];
  if (!config.host) missing.push('SMTP_HOST');
  if (!config.user) missing.push('SMTP_USER');
  if (!config.pass) missing.push('SMTP_PASS');

  if (missing.length) {
    return {
      configured: false,
      reason: `SMTP configuration is incomplete (${missing.join(', ')} missing)`,
    };
  }

  const port = config.port || (config.secure ? 465 : 587);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    return { configured: false, reason: 'SMTP_PORT must be a valid TCP port' };
  }

  return {
    configured: true,
    config: {
      host: config.host as string,
      port,
      secure: Boolean(config.secure),
      user: config.user as string,
      pass: config.pass as string,
      fromName: (config.fromName || DEFAULT_FROM_NAME) as string,
      fromEmail: (config.fromEmail || config.user) as string,
      source,
    },
  };
};

const fromEnvironment = (): SmtpConfigResult => {
  const port = parsePort(process.env.SMTP_PORT);
  const secure = parseBoolean(process.env.SMTP_SECURE);

  let envFromName = clean(process.env.SMTP_FROM_NAME);
  let envFromEmail = clean(process.env.SMTP_FROM_EMAIL);

  if (!envFromName || !envFromEmail) {
    const rawFrom = clean(process.env.SMTP_FROM);
    if (rawFrom) {
      const match = rawFrom.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
      if (match) {
        if (!envFromName && match[1]) envFromName = match[1].trim();
        if (!envFromEmail && match[2]) envFromEmail = match[2].trim();
      }
    }
  }

  return validate(
    {
      host: clean(process.env.SMTP_HOST),
      port,
      secure: secure ?? port === 465,
      user: clean(process.env.SMTP_USER),
      pass: clean(process.env.SMTP_PASS),
      fromName: envFromName || DEFAULT_FROM_NAME,
      fromEmail: envFromEmail || clean(process.env.SMTP_USER),
    },
    'env'
  );
};

const fromDatabase = async (): Promise<SmtpConfigResult> => {
  try {
    const settings = await Settings.findOne().select('+hrSmtpPass').lean();
    if (!settings) {
      return { configured: false, reason: 'SMTP configuration is missing' };
    }

    const port = parsePort(settings.hrSmtpPort);
    const secure = parseBoolean(settings.hrSmtpSecure);

    return validate(
      {
        host: clean(settings.hrSmtpHost),
        port,
        secure: secure ?? port === 465,
        user: clean(settings.hrSmtpUser),
        pass: clean(settings.hrSmtpPass),
        fromName: clean(settings.companyName) || DEFAULT_FROM_NAME,
        fromEmail: clean(settings.companyEmail) || clean(settings.hrSmtpUser),
      },
      'database'
    );
  } catch (error: any) {
    logger.error('Unable to read SMTP configuration', {
      message: error?.message,
      stack: error?.stack,
    });
    return { configured: false, reason: 'SMTP configuration could not be loaded' };
  }
};

export const getSmtpConfig = async (): Promise<SmtpConfigResult> => {
  if (hasEnvSmtpConfig()) {
    return fromEnvironment();
  }

  return fromDatabase();
};

export const getSmtpSenderEmail = async (): Promise<string> => {
  const result = await getSmtpConfig();
  return result.configured ? result.config.fromEmail : '';
};
