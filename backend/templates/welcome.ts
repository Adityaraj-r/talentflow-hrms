import { baseEmailTemplate, detailRows, escapeHtml } from './common';

export const welcomeEmailTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');

  return baseEmailTemplate({
    companyName,
    title: 'Welcome to the Team',
    preheader: 'Your employee account has been created.',
    body: `
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(vars.firstName || vars.name || 'there')},</p>
      <p style="margin:0 0 16px 0;">Your onboarding is complete, and your official employee account has been created.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
        ${detailRows([
          ['Work Email', vars.workEmail],
          ['Temporary Password', vars.temporaryPassword],
        ])}
      </table>
      <p style="margin:16px 0 0 0; color:#b91c1c; font-weight:700;">Security notice: please log in and change this temporary password immediately.</p>
      <p style="margin:18px 0 0 0;">Best regards,<br/><strong>${escapeHtml(companyName)} HR Administration</strong></p>
    `,
  });
};
