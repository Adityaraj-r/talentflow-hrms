export type BaseEmailInput = {
  companyName?: string;
  title: string;
  preheader?: string;
  body: string;
  footerNote?: string;
};

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const detailRows = (rows: Array<[string, unknown]>): string =>
  rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px; width:160px; color:#475569; font-weight:700;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px; color:#0f172a;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

export const listItems = (items: unknown[], fallback: string): string => {
  const values = items.map((item) => escapeHtml(item)).filter(Boolean);
  return (values.length ? values : [escapeHtml(fallback)])
    .map((item) => `<li style="margin:0 0 6px 0;">${item}</li>`)
    .join('');
};

export const actionLink = (href: unknown, label: string): string => {
  const safeHref = escapeHtml(href);
  if (!safeHref) return '';
  return `
    <p style="margin:20px 0 0 0;">
      <a href="${safeHref}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:11px 16px; border-radius:6px; font-weight:700;">
        ${escapeHtml(label)}
      </a>
    </p>`;
};

export const baseEmailTemplate = ({
  companyName = 'InternsLand',
  title,
  preheader = '',
  body,
  footerNote,
}: BaseEmailInput): string => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <span style="display:none!important; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; background:#f1f5f9;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; max-width:680px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background:#0f766e; padding:22px 24px;">
                <p style="margin:0 0 6px 0; color:#ccfbf1; font-size:13px; font-weight:700;">${escapeHtml(companyName)}</p>
                <h1 style="margin:0; color:#ffffff; font-size:22px; line-height:1.3;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px; font-size:15px; line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px; background:#f8fafc; color:#64748b; font-size:12px; line-height:1.5; border-top:1px solid #e2e8f0;">
                ${escapeHtml(footerNote || `This notification was sent by ${companyName}.`)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
