import { baseEmailTemplate, escapeHtml, actionLink } from './common';

export const referralEmailTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');
  const candidateName = String(vars.candidateName || '');
  const referrerName = String(vars.referrerName || 'An employee');
  const jobTitle = String(vars.jobTitle || 'Open Position');
  const department = String(vars.department || '');
  const location = String(vars.location || 'On-site');
  const employmentType = String(vars.employmentType || 'Full-time');
  const applicationDeadline = String(vars.applicationDeadline || '');
  const applyLink = String(vars.applyLink || '');

  let bodyHtml = `
    <p style="margin:0 0 14px 0;">Dear ${escapeHtml(candidateName)},</p>
    <p style="margin:0 0 14px 0;">Great news! <strong>${escapeHtml(referrerName)}</strong> has referred you for an exciting opportunity at <strong>${escapeHtml(companyName)}</strong>!</p>
    <p style="margin:0 0 14px 0;">We invite you to review the job details below and complete your official application through our secure portal.</p>
    
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px 0; font-weight:bold; color:#0f766e;">Position Highlights:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%; font-size:14px;">
        <tr>
          <td style="padding:4px 0; color:#475569; width:140px;">Job Title:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(jobTitle)}</td>
        </tr>
        ${department ? `
        <tr>
          <td style="padding:4px 0; color:#475569;">Department:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(department)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:4px 0; color:#475569;">Location:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(location)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0; color:#475569;">Employment Type:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(employmentType)}</td>
        </tr>
        ${applicationDeadline ? `
        <tr>
          <td style="padding:4px 0; color:#475569;">Application Deadline:</td>
          <td style="padding:4px 0; font-weight:bold; color:#b91c1c;">${escapeHtml(applicationDeadline)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin:0 0 16px 0;">Please click the button below to review full job details and submit your application:</p>
    ${actionLink(applyLink, 'Complete Application')}
    <p style="margin:20px 0 0 0; font-size:13px; color:#64748b;">If the button does not work, copy and paste this link into your browser:<br/><a href="${escapeHtml(applyLink)}" style="color:#0f766e;">${escapeHtml(applyLink)}</a></p>
  `;

  return baseEmailTemplate({
    companyName,
    title: 'You Have Been Referred!',
    preheader: `${referrerName} referred you for ${jobTitle} at ${companyName}.`,
    body: bodyHtml,
    footerNote: `This invitation link was generated specifically for you by ${companyName}.`,
  });
};
