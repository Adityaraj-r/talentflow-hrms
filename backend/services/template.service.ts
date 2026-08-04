import { genericNotificationTemplate } from '../templates/generic';
import { interviewCancelledTemplate } from '../templates/interviewCancelled';
import { interviewRescheduledTemplate } from '../templates/interviewRescheduled';
import { interviewScheduledTemplate } from '../templates/interviewScheduled';
import { applicantShortlistedTemplate } from '../templates/shortlisted';
import { welcomeEmailTemplate } from '../templates/welcome';
import { offerEmailTemplate } from '../templates/offerEmail';
import { referralEmailTemplate } from '../templates/referralEmail';
import { escapeHtml } from '../templates/common';

export type EmailTemplateName =
  | 'applicantShortlisted'
  | 'interviewScheduled'
  | 'interviewRescheduled'
  | 'interviewCancelled'
  | 'welcome'
  | 'genericNotification'
  | 'offerEmail'
  | 'referralEmail';

const templates: Record<EmailTemplateName, (vars: Record<string, any>) => string> = {
  applicantShortlisted: applicantShortlistedTemplate,
  interviewScheduled: interviewScheduledTemplate,
  interviewRescheduled: interviewRescheduledTemplate,
  interviewCancelled: interviewCancelledTemplate,
  welcome: welcomeEmailTemplate,
  genericNotification: genericNotificationTemplate,
  offerEmail: offerEmailTemplate,
  referralEmail: referralEmailTemplate,
};

export const renderTemplateString = (
  template: string,
  variables: Record<string, unknown>,
  options: { escape?: boolean } = {}
): string =>
  template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const value = key
      .split('.')
      .reduce<unknown>((current, part) => {
        if (current && typeof current === 'object') {
          return (current as Record<string, unknown>)[part];
        }
        return undefined;
      }, variables);

    return options.escape === false ? String(value ?? '') : escapeHtml(value);
  });

export const renderEmailTemplate = (
  templateName: EmailTemplateName,
  variables: Record<string, any>
): string => templates[templateName](variables);
