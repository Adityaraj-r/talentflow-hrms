import express from 'express';
import oauth2Client from '../config/google';
import { protect, admin } from '../middleware/auth.middleware';
import { createLog } from '../controllers/audit.controller';
import { createMeetLink } from '../controllers/googleMeet.controller';

const router = express.Router();

router.get('/auth', protect as any, admin as any, (req: any, res: any) => {
  const scopes = ['https://www.googleapis.com/auth/calendar.events'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  res.json({ url });
});

router.get('/callback', async (req: any, res: any) => {
  const { code } = req.query;
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

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

export default router;