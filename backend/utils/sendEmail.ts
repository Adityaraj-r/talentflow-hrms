import { getSmtpSenderEmail } from '../config/smtp.config';
import { sendEmail } from '../services/email.service';
import { renderEmailTemplate } from '../services/template.service';

export const getHrSenderEmail = async (): Promise<string> => {
  return getSmtpSenderEmail();
};

export const sendWelcomeEmail = async (
  personalEmail: string,
  firstName: string,
  workEmail: string,
  unhashedPassword: string
) => {
  return sendEmail({
    to: personalEmail,
    subject: 'Welcome to InternsLand! Your Login Credentials',
    html: renderEmailTemplate('welcome', {
      firstName,
      workEmail,
      temporaryPassword: unhashedPassword,
    }),
  });
};

type Interviewer = {
  name: string;
  designation: string;
};

type InterviewMailPayload = {
  candidateName: string;
  jobTitle: string;
  department: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  mode: 'Online' | 'Offline';
  location: string;
  meetingLink: string;
  interviewers: Interviewer[];
  instructions: string[];
  hrContact: {
    name: string;
    email: string;
    phone: string;
  };
};

export const sendInterviewScheduleEmail = async (
  candidateEmail: string,
  payload: InterviewMailPayload
) => {
  return sendEmail({
    to: candidateEmail,
    subject: `Interview Scheduled: ${payload.jobTitle}`,
    html: renderEmailTemplate('interviewScheduled', payload as any),
  });
};

export const sendTerminationEmail = async (
  personalEmail: string,
  payload: {
    name: string;
    exitDate: string;
    reason: string;
    companyName: string;
  }
) => {
  return sendEmail({
    to: personalEmail,
    subject: 'Important Notice Regarding Your Employment',
    html: renderEmailTemplate('genericNotification', {
      companyName: payload.companyName,
      name: payload.name,
      title: 'Notice of Employment Separation',
      message: `This email serves as formal notification that your employment with ${payload.companyName} has been concluded.\n\nEffective Date of Separation: ${payload.exitDate}\nReason for Separation: ${payload.reason}\n\nYour system access has been revoked. Information regarding your final settlement and offboarding documents will be communicated to you shortly.`,
    }),
  });
};

export const sendApplicationStatusEmail = async (
  candidateEmail: string,
  candidateName: string,
  status: 'Shortlisted' | 'Rejected' | 'Selected'
) => {
  if (status === 'Shortlisted') {
    return sendEmail({
      to: candidateEmail,
      subject: 'You are Shortlisted',
      html: renderEmailTemplate('applicantShortlisted', {
        name: candidateName,
      }),
    });
  }

  const message =
    status === 'Selected'
      ? 'Congratulations. You have been selected for the position. The HR team will contact you with onboarding details.'
      : 'Thank you for applying. We regret to inform you that you were not selected. We wish you all the best for your future.';

  return sendEmail({
    to: candidateEmail,
    subject: status === 'Selected' ? 'You are Selected' : 'Application Update',
    html: renderEmailTemplate('genericNotification', {
      name: candidateName,
      title: status === 'Selected' ? 'Application Selected' : 'Application Update',
      message,
    }),
  });
};
