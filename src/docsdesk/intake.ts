/**
 * Incident intake module
 * Handles creation and listing of incidents
 */

import { servicenowClient } from '../clients/servicenow';
import { logger } from '../utils/logger';
import { IncidentCreate, ListIncidentsQuery, type ClientIncidentCreate } from '../utils/validation';
import { classifyAndRecommend, type ClassificationResource } from './classification';
import { automateGoogleWorkspaceAccountAccess, hasAutomation } from './automation';
import { resolveContactEmail } from './contacts';

export interface Incident {
  sys_id: string;
  number?: string;
  short_description: string;
  description?: string;
  state: string;
  priority?: string;
  impact?: string;
  urgency?: string;
  category?: string;
  x_cursor_suggested?: boolean;
}

/**
 * Create a new incident
 */
export async function createIncident(
  payload: IncidentCreate,
  additionalFields?: Record<string, unknown>
): Promise<Incident> {
  logger.info('Creating incident', { product: payload.product, short_description: payload.short_description });

  try {
    const snPayload: Record<string, unknown> = {
      short_description: payload.short_description,
      description: payload.description,
      priority: payload.priority,
      impact: payload.impact,
      urgency: payload.urgency,
      category: payload.product,
      ...additionalFields,
    };

    const result = await servicenowClient.create<Incident>('incident', snPayload);

    logger.info('Incident created', { sys_id: result.result.sys_id, number: result.result.number });
    return result.result;
  } catch (error) {
    logger.error('Failed to create incident', { error });
    throw error;
  }
}

/**
 * Client incident response with classification enrichment
 */
export interface ClientIncidentResponse {
  sys_id: string;
  number?: string;
  client: string;
  category: string;
  shortDescription: string;
  detailedDescription?: string;
  state: string;
  priority?: string;
  topic: string;
  recommendedResources: ClassificationResource[];
  automation?: {
    classified: boolean;
    emailSent: boolean;
    emailProvider?: string;
    workNoteAdded: boolean;
  };
}

/**
 * Create a client incident with auto-classification and resource recommendations
 * This function creates the incident in ServiceNow and enriches the response with
 * classification data (topic and recommended resources) without modifying the SN record
 */
export async function createClientIncident(
  payload: ClientIncidentCreate
): Promise<ClientIncidentResponse> {
  logger.info('Creating client incident', {
    client: payload.client,
    category: payload.category,
    shortDescription: payload.shortDescription,
  });

  // Resolve contact email (Phase 1: uses clientEmail, Phase 2+: will look up from SN)
  const resolvedContact = await resolveContactEmail(payload);
  logger.debug('Resolved contact email', { 
    email: resolvedContact.email ? '***REDACTED***' : null,
    hasClientEmail: !!payload.clientEmail,
    hasClientId: !!payload.clientId,
    hasClientContactId: !!payload.clientContactId,
  });

  // Adapt the client payload to the legacy IncidentCreate shape for ServiceNow
  const legacyPayload: IncidentCreate = {
    product: payload.category, // category maps to product field (which becomes category in SN)
    short_description: payload.shortDescription,
    description: [
      payload.detailedDescription,
      payload.errorCode ? `Error Code: ${payload.errorCode}` : null,
      payload.client ? `Client: ${payload.client}` : null,
    ]
      .filter(Boolean)
      .join('\n\n') || undefined,
    priority: payload.priority, // Pass as-is
  };

  // Build additional ServiceNow fields including resolved email
  const additionalFields: Record<string, unknown> = {
    u_client: payload.client,
    u_source: 'BBP Support Counter',
    contact_type: 'self-service',
  };

  // Map resolved email to ServiceNow field (if present)
  // Note: This assumes a custom field u_client_email exists or is safe to send.
  // ServiceNow will ignore unknown fields, but our logic should not depend on reading it back.
  if (resolvedContact.email) {
    additionalFields.u_client_email = resolvedContact.email;
  }

  // Create incident in ServiceNow
  const incident = await createIncident(legacyPayload, additionalFields);

  // Check if this category has special automation (Candidate 1: Google Workspace – Account Access)
  let automationResult = null;
  if (hasAutomation(payload.category)) {
    logger.info('Running special automation for category', { category: payload.category });
    automationResult = await automateGoogleWorkspaceAccountAccess(
      payload,
      incident.sys_id,
      incident.number,
      resolvedContact.email ?? undefined
    );
  }

  // Run classification (pure function, no SN calls)
  // If automation already ran, it will have written work notes, but we still need enrichment for the response
  const enrichment = classifyAndRecommend({
    client: payload.client,
    category: payload.category,
    errorCode: payload.errorCode,
    shortDescription: payload.shortDescription,
    detailedDescription: payload.detailedDescription || '',
  });

  // Write automation activity to work_notes (only if automation didn't already handle it)
  if (!automationResult) {
    const workNotesLines: string[] = [];
    workNotesLines.push(`[AUTO] Classified as '${enrichment.topic}'`);
    
    // Add email notification note if email was resolved and used
    if (resolvedContact.email) {
      workNotesLines.push(
        `[AUTO] Sent acknowledgement and self-service resources to ${resolvedContact.email}.`
      );
    }

    const resourceList = enrichment.recommendedResources
      .map(r => `  • ${r.label} (${r.type})`)
      .join('\n');
    
    if (resourceList) {
      workNotesLines.push(`Recommended resources:\n${resourceList}`);
    }

    const fullNote = workNotesLines.join('\n');

    try {
      await servicenowClient.patch('incident', incident.sys_id, {
        work_notes: fullNote,
      });
      logger.debug('Added automation work_notes', { sys_id: incident.sys_id });
    } catch (error) {
      // Log but don't fail the request if work_notes update fails
      logger.warn('Failed to write automation work_notes', { error, sys_id: incident.sys_id });
    }
  }
  // Note: If automation ran, it already writes work notes including email notification status

  // Use automation enrichment if available, otherwise use classification enrichment
  const finalTopic = automationResult?.enrichment.topic || enrichment.topic;
  const finalResources = automationResult?.enrichment.resources || enrichment.recommendedResources;

  logger.info('Incident created with classification', {
    sys_id: incident.sys_id,
    number: incident.number,
    topic: finalTopic,
    resourceCount: finalResources.length,
    automationRan: !!automationResult,
  });

  // Return enriched response
  return {
    sys_id: incident.sys_id,
    number: incident.number,
    client: payload.client,
    category: payload.category,
    shortDescription: payload.shortDescription,
    detailedDescription: payload.detailedDescription,
    state: incident.state || '1', // Default to New state if not provided
    priority: payload.priority,
    topic: finalTopic,
    recommendedResources: finalResources,
    automation: automationResult ? {
      classified: automationResult.classified,
      emailSent: automationResult.emailSent,
      emailProvider: automationResult.emailProvider,
      workNoteAdded: automationResult.workNoteAdded,
    } : undefined,
  };
}

/**
 * Client incident for listing (includes additional fields from description parsing)
 */
export interface ClientIncidentListItem {
  sys_id: string;
  number?: string;
  short_description: string;
  description?: string;
  state: string;
  priority?: string;
  category?: string;
  sys_created_on?: string;
  // Parsed from description
  client?: string | null;
}

/**
 * List incidents with filtering and pagination
 * Optionally filters to incidents created via BBP Support Counter
 */
export async function listIncidents(
  query: ListIncidentsQuery = { state: 'open', limit: 20, offset: 0 },
  filterBySource: boolean = false
): Promise<{
  incidents: ClientIncidentListItem[];
  total?: number;
}> {
  logger.info('Listing incidents', { query, filterBySource });

  try {
    // Build query string
    let sysparmQuery = '';
    if (query.state === 'open') {
      sysparmQuery = 'state<6'; // States 1-5 are open/in-progress
    } else if (query.state === 'resolved') {
      sysparmQuery = 'state=6'; // State 6 is resolved
    } else if (query.state) {
      sysparmQuery = `state=${query.state}`;
    }

    // Filter by source: look for "Client:" in description (how we mark BBP Support Counter tickets)
    if (filterBySource) {
      const sourceFilter = 'descriptionLIKEClient:';
      sysparmQuery = sysparmQuery
        ? `${sysparmQuery}^${sourceFilter}`
        : sourceFilter;
    }

    const result = await servicenowClient.getTable<ClientIncidentListItem>('incident', {
      sysparm_query: sysparmQuery,
      sysparm_fields: 'sys_id,number,short_description,description,state,priority,category,sys_created_on',
      sysparm_limit: query.limit,
      sysparm_offset: query.offset,
    });

    // Parse client from description (format: "Client: <name>")
    const incidentsWithClient = result.result.map(inc => {
      let client: string | null = null;
      if (inc.description) {
        const clientMatch = inc.description.match(/Client:\s*([^\n]+)/);
        if (clientMatch) {
          client = clientMatch[1].trim();
        }
      }
      return { ...inc, client };
    });

    logger.info(`Retrieved ${incidentsWithClient.length} incidents`);
    return {
      incidents: incidentsWithClient,
    };
  } catch (error) {
    logger.error('Failed to list incidents', { error });
    throw error;
  }
}

