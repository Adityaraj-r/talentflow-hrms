import { actionLink, baseEmailTemplate, detailRows, escapeHtml, listItems } from './common';

type Interviewer = {
  name?: string;
  designation?: string;
};

export const interviewScheduledTemplate = (vars: Record<string, any>): string => {
  const companyName = String(vars.companyName || 'InternsLand');
  const candidateName = escapeHtml(vars.candidateName || vars.name || 'Candidate');
  const mode = String(vars.mode || 'Online');
  const interviewers = Array.isArray(vars.interviewers)
    ? vars.interviewers.map((item: Interviewer) =>
        [item?.name, item?.designation].filter(Boolean).join(' - ')
      )
    : [];

  return baseEmailTemplate({
    companyName,
    title: 'Interview Scheduled',
    preheader: `Interview scheduled for ${vars.jobTitle || 'your application'}.`,
    body: `
      <p style="margin:0 0 14px 0;">Hi ${candidateName},</p>
      <p style="margin:0 0 16px 0;">Your interview has been scheduled. Please find the details below.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
        ${detailRows([
          ['Position', vars.jobTitle || vars.position],
          ['Department', vars.department],
          ['Date', vars.interviewDate],
          ['Time', [vars.startTime, vars.endTime].filter(Boolean).join(' - ')],
          ['Mode', `${mode} Interview`],
          ['Location', mode === 'Online' ? vars.meetingLink || 'Online' : vars.location || 'Shared by HR team'],
        ])}
      </table>
      ${actionLink(vars.meetingLink, 'Join Interview')}
      <h2 style="margin:20px 0 8px 0; font-size:16px;">Interview Panel</h2>
      <ul style="padding-left:18px; margin:0;">${listItems(interviewers, 'Will be shared shortly')}</ul>
      <h2 style="margin:20px 0 8px 0; font-size:16px;">Preparation Notes</h2>
      <ul style="padding-left:18px; margin:0;">${listItems(vars.instructions || [], 'Please keep a valid ID and resume copy ready')}</ul>
      <div style="margin-top:20px; padding:12px 14px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc;">
        <p style="margin:0 0 6px 0; color:#475569;"><strong>Need help?</strong> Reach out to:</p>
        <p style="margin:0;">${escapeHtml(vars.hrContact?.name || 'HR Team')}<br/>${escapeHtml(vars.hrContact?.email || '')}<br/>${escapeHtml(vars.hrContact?.phone || '')}</p>
      </div>
      <p style="margin:18px 0 0 0;">Best regards,<br/><strong>${escapeHtml(companyName)} HR Team</strong></p>
    `,
  });
};
