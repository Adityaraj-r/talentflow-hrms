import { baseEmailTemplate, escapeHtml } from './common';

export const applicantShortlistedTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');
  const name = escapeHtml(vars.name || vars.candidateName || 'Candidate');
  const position = escapeHtml(vars.position || vars.jobTitle || 'the role');

  return baseEmailTemplate({
    companyName,
    title: 'Application Shortlisted',
    preheader: `Your application for ${position} has been shortlisted.`,
    body: `
      <p style="margin:0 0 14px 0;">Hi ${name},</p>
      <p style="margin:0 0 14px 0;">Congratulations. Your application for <strong>${position}</strong> has been shortlisted for the next round.</p>
      <p style="margin:0;">Our HR team will contact you soon with the next steps.</p>
      <p style="margin:18px 0 0 0;">Best regards,<br/><strong>${escapeHtml(companyName)} HR Team</strong></p>
    `,
  });
};
