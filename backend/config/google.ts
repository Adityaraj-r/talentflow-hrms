import { google } from 'googleapis';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const hasGoogleOAuthConfig = (): boolean => {
  return Boolean(
    (process.env.GOOGLE_CLIENT_ID || "").trim() &&
    (process.env.GOOGLE_CLIENT_SECRET || "").trim() &&
    (process.env.GOOGLE_REDIRECT_URI || "").trim()
  );
};

export const ensureGoogleCredentials = async (): Promise<boolean> => {
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN || "";
  if (envRefreshToken.trim()) {
    oauth2Client.setCredentials({
      refresh_token: envRefreshToken.trim(),
    });
    return true;
  }

  try {
    const db = mongoose.connection?.db;
    if (!db) return false;
    const settings = await db.collection("settings").findOne({});
    const tokens = (settings as any)?.googleOauthTokens;
    if (!tokens) return false;
    oauth2Client.setCredentials(tokens);
    return true;
  } catch {
    return false;
  }
};

export const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
export default oauth2Client;