import { baseEmailTemplate, escapeHtml } from './common';

export const genericNotificationTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');
  const title = String(vars.title || vars.subject || 'Notification');
  const message = String(vars.message || '');

  return baseEmailTemplate({
    companyName,
    title,
    preheader: message,
    body: `
      <p style="margin:0 0 14px 0;">Hi ${escapeHtml(vars.name || vars.recipientName || 'there')},</p>
      <p style="margin:0; white-space:pre-line;">${escapeHtml(message)}</p>
      <p style="margin:18px 0 0 0;">Best regards,<br/><strong>${escapeHtml(companyName)} Team</strong></p>
    `,
  });
};
