import { baseEmailTemplate, detailRows, escapeHtml } from './common';

export const interviewCancelledTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');

  return baseEmailTemplate({
    companyName,
    title: 'Interview Cancelled',
    preheader: 'Your interview has been cancelled.',
    body: `
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(vars.candidateName || vars.name || 'Candidate')},</p>
      <p style="margin:0 0 16px 0;">Your interview has been cancelled. Our HR team will contact you if any further action is required.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
        ${detailRows([
          ['Position', vars.jobTitle || vars.position],
          ['Original Date', vars.interviewDate],
          ['Reason', vars.reason],
        ])}
      </table>
      <p style="margin:18px 0 0 0;">Best regards,<br/><strong>${escapeHtml(companyName)} HR Team</strong></p>
    `,
  });
};
