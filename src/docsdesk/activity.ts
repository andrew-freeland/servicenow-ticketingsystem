/**
 * Automation activity tracking module
 * Reads automation activity from ServiceNow work_notes
 */

import { servicenowClient } from '../clients/servicenow';
import { logger } from '../utils/logger';

export interface AutomationActivity {
  timestamp: string;
  incidentNumber: string;
  client: string | null;
  summary: string;
  sys_id: string;
}

/**
 * Get automation activity from ServiceNow incidents
 * Extracts [AUTO] entries from work_notes
 */
export async function getAutomationActivity(limit: number = 50): Promise<AutomationActivity[]> {
  logger.info('Fetching automation activity', { limit });

  try {
    // Query incidents that have work_notes containing [AUTO]
    // Also filter by description containing "Client:" to only get BBP Support Counter tickets
    const result = await servicenowClient.getTable<{
      sys_id: string;
      number?: string;
      description?: string;
      work_notes?: string;
      sys_updated_on?: string;
    }>('incident', {
      sysparm_query: 'work_notesLIKE[AUTO]^descriptionLIKEClient:',
      sysparm_fields: 'sys_id,number,description,work_notes,sys_updated_on',
      sysparm_limit: limit,
      sysparm_display_value: false,
    });

    const activities: AutomationActivity[] = [];

    for (const incident of result.result) {
      if (!incident.work_notes) continue;

      // Extract client from description
      let client: string | null = null;
      if (incident.description) {
        const clientMatch = incident.description.match(/Client:\s*([^\n]+)/);
        if (clientMatch) {
          client = clientMatch[1].trim();
        }
      }

      // Extract [AUTO] lines from work_notes
      const autoLines = incident.work_notes
        .split('\n')
        .filter(line => line.trim().startsWith('[AUTO]'))
        .map(line => line.replace(/^\[AUTO\]\s*/, '').trim());

      // Create activity entry for each [AUTO] line
      for (const summary of autoLines) {
        if (summary) {
          activities.push({
            timestamp: incident.sys_updated_on || new Date().toISOString(),
            incidentNumber: incident.number || 'N/A',
            client,
            summary,
            sys_id: incident.sys_id,
          });
        }
      }
    }

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    logger.info(`Retrieved ${activities.length} automation activities`);
    return activities;
  } catch (error) {
    logger.error('Failed to fetch automation activity', { error });
    throw error;
  }
}

