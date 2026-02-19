import { Request, Response } from 'express';
import oauth2Client from '../config/google';
import { createLog } from './audit.controller';

export const getGoogleAuthUrl = (req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.json({ url });
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';

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

    // Success HTML Response
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f9fafb;">
          <div style="max-width: 400px; margin: 0 auto; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
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
    console.error("Google Callback Error:", error);
    res.status(500).send('<h1>Authentication failed</h1><p>Please try again or contact support.</p>');
  }
};