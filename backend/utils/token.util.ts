import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
}

interface RefreshTokenPayload {
  id: string;
}

/**
 * Reads a required secret from env. Throws instead of silently falling back
 * to a hardcoded string — a missing/forgotten env var should be a loud
 * failure (login/refresh returns an error), not a quiet security hole where
 * tokens get signed with a guessable default.
 */
const getSecret = (envVarNames: string[], label: string): string => {
  for (const name of envVarNames) {
    if (process.env[name]) return process.env[name] as string;
  }
  throw new Error(
    `[token.utils] Missing required secret for ${label}. Set one of: ${envVarNames.join(', ')} in your .env file.`
  );
};

/**
 * Short-lived access token.
 * Accepts ACCESS_TOKEN_SECRET if set, otherwise reuses JWT_SECRET (same
 * secret your existing `protect` middleware already verifies with) so no
 * middleware changes are required. Throws if neither is set.
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const secret = getSecret(['ACCESS_TOKEN_SECRET', 'JWT_SECRET'], 'access tokens');
  return jwt.sign(
    payload,
    secret as jwt.Secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m' } as jwt.SignOptions
  );
};

/**
 * Long-lived refresh token.
 * Uses REFRESH_TOKEN_SECRET if set (recommended — isolates a leaked
 * JWT_SECRET to just the short-lived access token blast radius), otherwise
 * falls back to JWT_SECRET so you aren't forced to manage a second secret.
 * Throws only if neither is set.
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret = getSecret(['REFRESH_TOKEN_SECRET', 'JWT_SECRET'], 'refresh tokens');
  return jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    secret as jwt.Secret,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' } as jwt.SignOptions
  );
};

export const verifyRefreshToken = (token: string): any => {
  const secret = getSecret(['REFRESH_TOKEN_SECRET', 'JWT_SECRET'], 'refresh tokens');
  return jwt.verify(token, secret as jwt.Secret);
};

/** We never store raw refresh tokens in the DB — only this hash. */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/** Converts a jwt-style expiry string ('15m', '7d', '1h') into a concrete Date. */
export const expiryToDate = (expiresIn: string | undefined, fallbackMs: number): Date => {
  if (!expiresIn) return new Date(Date.now() + fallbackMs);
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return new Date(Date.now() + fallbackMs);
  const value = parseInt(match[1], 10);
  const unitMs: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * unitMs[match[2]]);
};