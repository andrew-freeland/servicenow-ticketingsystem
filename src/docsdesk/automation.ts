/**
 * Automation module for ticket lanes
 * Handles classification, email acknowledgements, and work notes for specific categories
 */

import { logger } from '../utils/logger';
import { servicenowClient } from '../clients/servicenow';
import type { ClientIncidentCreate } from '../utils/validation';

export interface AutomationResult {
  classified: boolean;
  topic: string;
  emailSent: boolean;
  emailProvider?: string;
  workNoteAdded: boolean;
  enrichment: {
    topic: string;
    resources: Array<{
      type: 'doc' | 'video';
      label: string;
      url: string;
    }>;
  };
}

/**
 * Google Workspace – Account Access automation resources
 */
const GOOGLE_WORKSPACE_ACCOUNT_ACCESS_RESOURCES = [
  {
    type: 'doc' as const,
    label: 'Google Workspace Account Access Troubleshooting',
    url: 'https://support.google.com/a/answer/1728857',
  },
  {
    type: 'doc' as const,
    label: 'Reset Google Workspace User Password',
    url: 'https://support.google.com/a/answer/33319',
  },
  {
    type: 'video' as const,
    label: 'Google Workspace Admin Console Walkthrough',
    url: 'https://www.loom.com/share/google-workspace-admin-console',
  },
  {
    type: 'doc' as const,
    label: 'Two-Factor Authentication Setup Guide',
    url: 'https://support.google.com/a/answer/175197',
  },
];

/**
 * Send acknowledgement email (stub implementation)
 * In a real implementation, this would integrate with an email provider (SendGrid, AWS SES, etc.)
 */
async function sendAcknowledgementEmail(
  clientEmail: string,
  incidentNumber: string,
  topic: string,
  resources: typeof GOOGLE_WORKSPACE_ACCOUNT_ACCESS_RESOURCES
): Promise<{ sent: boolean; provider?: string }> {
  // Stub: Log the email that would be sent
  // In production, this would call an email service provider
  
  logger.info('Email acknowledgement (stub)', {
    to: clientEmail,
    incidentNumber,
    topic,
    resourceCount: resources.length,
  });

  // Format email content (for logging/stub purposes)
  const emailBody = `
Hello,

We've received your request regarding "${topic}" (Ticket #${incidentNumber}).

While we review your request, here are some self-service resources that may help:

${resources.map(r => `• ${r.label}: ${r.url}`).join('\n')}

We'll update you as soon as we have more information.

Best regards,
BBP Support Team
  `.trim();

  logger.debug('Email content (stub)', { body: emailBody });

  // Return stub result - in production, this would actually send via email provider
  return {
    sent: false, // Stub: no email provider configured
    provider: undefined,
  };
}

/**
 * Write automation work note to ServiceNow
 */
async function writeAutomationWorkNote(
  sysId: string,
  topic: string,
  resources: typeof GOOGLE_WORKSPACE_ACCOUNT_ACCESS_RESOURCES,
  emailSent: boolean,
  resolvedEmail?: string
): Promise<boolean> {
  try {
    const resourceList = resources
      .map(r => `  • ${r.label} (${r.type})`)
      .join('\n');
    
    const emailStatus = emailSent && resolvedEmail
      ? `Acknowledgement email sent to ${resolvedEmail}.`
      : emailSent
      ? 'Acknowledgement email sent to client.'
      : 'Acknowledgement email not sent (no email provider configured).';
    
    const workNote = `[AUTO] Classified as '${topic}'\n${emailStatus}\n\nRecommended self-service resources:\n${resourceList}`;

    await servicenowClient.patch('incident', sysId, {
      work_notes: workNote,
    });

    logger.debug('Automation work note written', { sysId, topic });
    return true;
  } catch (error) {
    logger.warn('Failed to write automation work note', { error, sysId });
    return false;
  }
}

/**
 * Automate Google Workspace – Account Access tickets (Candidate 1)
 * This is the only fully automated lane for now
 */
export async function automateGoogleWorkspaceAccountAccess(
  payload: ClientIncidentCreate,
  sysId: string,
  incidentNumber?: string,
  resolvedEmail?: string
): Promise<AutomationResult> {
  logger.info('Running Google Workspace – Account Access automation', {
    sysId,
    incidentNumber,
    client: payload.client,
    hasResolvedEmail: !!resolvedEmail,
  });

  const topic = 'Google Workspace Account Access';
  const resources = GOOGLE_WORKSPACE_ACCOUNT_ACCESS_RESOURCES;

  // Send acknowledgement email if resolved email is provided
  // Use resolvedEmail (from resolveContactEmail) instead of payload.clientEmail
  let emailResult = { sent: false, provider: undefined as string | undefined };
  if (resolvedEmail) {
    emailResult = await sendAcknowledgementEmail(
      resolvedEmail,
      incidentNumber || 'N/A',
      topic,
      resources
    );
  } else {
    logger.debug('No resolved email provided, skipping acknowledgement email');
  }

  // Write automation work note
  const workNoteAdded = await writeAutomationWorkNote(
    sysId,
    topic,
    resources,
    emailResult.sent,
    resolvedEmail
  );

  return {
    classified: true,
    topic,
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    workNoteAdded,
    enrichment: {
      topic,
      resources,
    },
  };
}

/**
 * Check if a category has automation enabled
 */
export function hasAutomation(category: string): boolean {
  return category === 'Google Workspace – Account Access';
}

