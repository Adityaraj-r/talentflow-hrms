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
  status: string,
  positionTitle: string = 'the position'
) => {
  if (status === 'Shortlisted') {
    return sendEmail({
      to: candidateEmail,
      subject: 'You are Shortlisted',
      html: renderEmailTemplate('applicantShortlisted', {
        name: candidateName,
        position: positionTitle,
      }),
    });
  }

  let title = 'Application Update';
  let subject = 'Application Update';
  let message = '';

  if (status === 'Selected') {
    title = 'Application Selected';
    subject = 'You are Selected';
    message = `Congratulations! You have been selected for the ${positionTitle} position. The HR team will contact you with onboarding details.`;
  } else if (status === 'Rejected') {
    message = `Thank you for applying for the ${positionTitle} position. We regret to inform you that you were not selected. We wish you all the best for your future.`;
  } else if (status === 'Applied') {
    title = 'Application Received';
    subject = 'Application Received';
    message = `Thank you for applying for the ${positionTitle} position. Your application has been successfully received. We will review it and get back to you shortly.`;
  } else if (status === 'Under Review') {
    title = 'Application Under Review';
    subject = 'Application Under Review';
    message = `Your application for the ${positionTitle} position is currently under review. We will update you as soon as the next steps are decided.`;
  } else {
    message = `Your application for the ${positionTitle} position has been updated to status: ${status}.`;
  }

  return sendEmail({
    to: candidateEmail,
    subject: subject,
    html: renderEmailTemplate('genericNotification', {
      name: candidateName,
      title: title,
      message,
    }),
  });
};

export const sendExitBlockedEmail = async (
  hrEmail: string,
  employeeName: string,
  employeeId: string,
  pendingDepartments: string[]
) => {
  const message = `The final exit for ${employeeName} (${employeeId}) has been blocked on their Last Working Day due to pending clearances from: ${pendingDepartments.join(', ')}. Please take immediate action.`;
  
  return sendEmail({
    to: hrEmail,
    subject: `URGENT: Exit Blocked for ${employeeName}`,
    html: renderEmailTemplate('genericNotification', {
      name: 'HR Team',
      title: 'Employee Exit Blocked',
      message,
    }),
  });
};

export const sendOfferEmail = async (
  candidateEmail: string,
  payload: {
    companyName: string;
    candidateName: string;
    position: string;
    department: string;
    recruiterName: string;
    expiryDate: string;
    joiningDate?: string;
    secureLink?: string;
    hrPhone?: string;
    hrEmail?: string;
  },
  pdfBuffer: Buffer
) => {
  return sendEmail({
    to: candidateEmail,
    subject: `Congratulations! Your Offer Letter from ${payload.companyName}`,
    html: renderEmailTemplate('offerEmail', payload as any),
    attachments: [
      {
        filename: `InternsLand_Offer_${payload.candidateName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

export const sendReferralEmail = async (
  candidateEmail: string,
  payload: {
    companyName: string;
    candidateName: string;
    referrerName: string;
    jobTitle: string;
    department?: string;
    location?: string;
    employmentType?: string;
    applicationDeadline?: string;
    applyLink: string;
  }
) => {
  return sendEmail({
    to: candidateEmail,
    subject: `${payload.referrerName} Has Referred You for ${payload.jobTitle} at ${payload.companyName}`,
    html: renderEmailTemplate('referralEmail', payload as any),
  });
};
