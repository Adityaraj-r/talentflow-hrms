import { Request, Response } from 'express';
import { calendar, ensureGoogleCredentials } from '../config/google';
import { createLog } from './audit.controller';
import { AuthRequest } from '../middleware/auth.middleware';

export const getGoogleMeetStatus = async (_req: Request, res: Response) => {
  const connected = await ensureGoogleCredentials();
  return res.status(200).json({
    success: true,
    connected,
  });
};

export const createMeetLink = async (req: AuthRequest, res: Response) => {
  try {
    const { summary, description, startDateTime, endDateTime, attendees } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const hasCredentials = await ensureGoogleCredentials();
    if (!hasCredentials) {
      return res.status(400).json({
        success: false,
        message: 'Google Meet is not connected. Please connect Google Workspace from Integrations first.'
      });
    }
    if (!startDateTime || !endDateTime || !Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'startDateTime, endDateTime and attendees are required'
      });
    }

    const event = {
      summary,
      description,
      start: { dateTime: startDateTime, timeZone: 'UTC' },
      end: { dateTime: endDateTime, timeZone: 'UTC' },
      attendees: attendees.map((email: string) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    await createLog(
      req.user?.id || 'system',
      req.user?.firstName || 'Admin',
      'Generate Meet Link',
      'Integrations',
      `Meeting created: ${summary}`,
      String(ip),
      'Success'
    );

    return res.status(201).json({
      success: true,
      meetLink: response.data.hangoutLink,
      eventId: response.data.id
    });
  } catch (error: any) {
    const reason = error?.response?.data?.error?.message || error?.message || 'Failed to generate Google Meet link';
    return res.status(500).json({
      success: false,
      message: reason
    });
  }
};