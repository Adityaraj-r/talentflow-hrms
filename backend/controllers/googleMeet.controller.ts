import { Request, Response } from 'express';
import { calendar } from '../config/google';
import { createLog } from './audit.controller';
import { AuthRequest } from '../middleware/auth.middleware';

export const createMeetLink = async (req: AuthRequest, res: Response) => {
  try {
    const { summary, description, startDateTime, endDateTime, attendees } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';

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
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Google Meet link'
    });
  }
};