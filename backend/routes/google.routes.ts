import express from 'express';
import oauth2Client, { hasGoogleOAuthConfig } from '../config/google';
import mongoose from 'mongoose';
import { protect } from '../middleware/auth.middleware';
import { createLog } from '../controllers/audit.controller';
import { createMeetLink, getGoogleMeetStatus } from '../controllers/googleMeet.controller';

const router = express.Router();

router.get('/auth', protect as any, (req: any, res: any) => {
  if (!hasGoogleOAuthConfig()) {
    return res.status(400).json({
      success: false,
      message: 'Google OAuth is not configured. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in backend environment.',
    });
  }
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.json({ url });
});

router.get('/callback', async (req: any, res: any) => {
  if (!hasGoogleOAuthConfig()) {
    return res.status(400).send(
      '<h1>Google OAuth not configured</h1><p>Please add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in backend environment and restart server.</p>'
    );
  }
  const { code } = req.query;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    const db = mongoose.connection?.db;
    if (db) {
      await db.collection("settings").updateOne(
        {},
        {
          $set: {
            googleOauthTokens: tokens,
            googleConnectedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    await createLog(
      'system',
      'Admin',
      'Google Auth',
      'Integrations',
      'Google Workspace successfully linked',
      String(ip),
      'Success'
    );

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f9fafb;">
          <div style="max-width: 400px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #059669; font-size: 24px;">Connection Successful</h1>
            <p style="color: #4b5563;">Google Workspace has been linked to your HRMS. You can safely close this window.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send('<h1>Authentication failed</h1><p>Please try again or contact support.</p>');
  }
});

router.post('/create-meet', protect as any, createMeetLink as any);
router.get('/status', protect as any, getGoogleMeetStatus as any);

export default router;