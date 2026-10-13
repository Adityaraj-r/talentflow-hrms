import { baseEmailTemplate, escapeHtml, actionLink } from './common';

export const offerEmailTemplate = (vars: Record<string, unknown>): string => {
  const companyName = String(vars.companyName || 'InternsLand');
  const candidateName = String(vars.candidateName || '');
  const position = String(vars.position || '');
  const department = String(vars.department || '');
  const recruiterName = String(vars.recruiterName || '');
  const expiryDate = String(vars.expiryDate || '');
  const joiningDate = String(vars.joiningDate || '');
  const secureLink = String(vars.secureLink || '');
  const hrPhone = String(vars.hrPhone || '');
  const hrEmail = String(vars.hrEmail || '');

  let bodyHtml = `
    <p style="margin:0 0 14px 0;">Dear ${escapeHtml(candidateName)},</p>
    <p style="margin:0 0 14px 0;">We are absolutely thrilled to offer you the position of <strong>${escapeHtml(position)}</strong> in our <strong>${escapeHtml(department)}</strong> department at <strong>${escapeHtml(companyName)}</strong>!</p>
    <p style="margin:0 0 14px 0;">We were incredibly impressed by your skills, experience, and the conversations we had during the interview process. We believe you will be a fantastic addition to our team and will play a key role in our future success.</p>
    
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px 0; font-weight:bold; color:#0f766e;">Offer Highlights:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%; font-size:14px;">
        <tr>
          <td style="padding:4px 0; color:#475569; width:120px;">Position:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(position)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0; color:#475569;">Department:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(department)}</td>
        </tr>
        ${joiningDate ? `
        <tr>
          <td style="padding:4px 0; color:#475569;">Joining Date:</td>
          <td style="padding:4px 0; font-weight:bold;">${escapeHtml(joiningDate)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding:4px 0; color:#475569;">Valid Until:</td>
          <td style="padding:4px 0; font-weight:bold; color:#b91c1c;">${escapeHtml(expiryDate)}</td>
        </tr>
      </table>
    </div>

    <p style="margin:0 0 14px 0;">Please review the attached formal Offer Letter PDF which contains the complete terms of employment, compensation breakdown, and joining instructions.</p>
  `;

  if (secureLink) {
    bodyHtml += `
      <p style="margin:0 0 14px 0;">You can also view your offer letter online by clicking the link below:</p>
      ${actionLink(secureLink, 'View Offer Letter')}
    `;
  }

  bodyHtml += `
    <h3 style="margin:24px 0 10px 0; font-size:16px; color:#0f766e;">Next Steps & How to Respond:</h3>
    <p style="margin:0 0 14px 0;">To accept this offer, please reply directly to this email or contact your HR representative to confirm your acceptance on or before <strong>${escapeHtml(expiryDate)}</strong>.</p>
    
    <p style="margin:20px 0 6px 0; font-weight:bold;">Your HR Contact Details:</p>
    <p style="margin:0; font-size:14px; line-height:1.5;">
      <strong>Representative:</strong> ${escapeHtml(recruiterName)}<br/>
      <strong>Email:</strong> <a href="mailto:${escapeHtml(hrEmail)}" style="color:#0f766e;">${escapeHtml(hrEmail)}</a><br/>
      ${hrPhone ? `<strong>Phone:</strong> ${escapeHtml(hrPhone)}<br/>` : ''}
    </p>

    <p style="margin:20px 0 0 0;">Congratulations once again! We hope to welcome you to the team soon.</p>
  `;

  return baseEmailTemplate({
    companyName,
    title: 'Official Employment Offer',
    preheader: `We are pleased to offer you the position of ${position} at ${companyName}.`,
    body: bodyHtml,
    footerNote: `This is an official employment offer email from ${companyName}. Please reply to this email to communicate your decision.`,
  });
};
