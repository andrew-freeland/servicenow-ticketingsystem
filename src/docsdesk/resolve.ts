/**
 * Incident resolution module
 * Handles closing and resolving incidents
 */

import { servicenowClient } from '../clients/servicenow';
import { logger } from '../utils/logger';

export interface ResolvedIncident {
  sys_id: string;
  number?: string;
  state: string;
  resolution_code?: string;
  resolution_notes?: string;
  resolved_at?: string;
}

/**
 * Resolve an incident
 * Includes idempotency guard - returns early if already resolved
 */
export async function resolveIncident(
  incidentSysId: string,
  resolutionNote?: string
): Promise<ResolvedIncident> {
  logger.info('Resolving incident', { incidentSysId });

  try {
    // Idempotency guard: check if incident is already resolved/closed
    const current = await servicenowClient.getTable<ResolvedIncident & { close_code?: string; close_notes?: string }>('incident', {
      sysparm_fields: 'sys_id,state,number,resolution_code,resolution_notes,resolved_at,close_code,close_notes',
      sysparm_query: `sys_id=${incidentSysId}`,
    });

    if (current.result.length === 0) {
      throw new Error(`Incident ${incidentSysId} not found`);
    }

    const incident = current.result[0];
    const alreadyResolved = ['6', '7'].includes(String(incident.state)); // 6=Resolved, 7=Closed
    
    if (alreadyResolved) {
      logger.info('Incident already resolved/closed', {
        sys_id: incident.sys_id,
        number: incident.number,
        state: incident.state,
      });
      // Return the existing resolved/closed incident (idempotent)
      return {
        ...incident,
        alreadyResolved: true,
      } as ResolvedIncident & { alreadyResolved?: boolean };
    }

    // Resolve the incident with close_code and close_notes
    // Note: close_code must match a valid choice value from the ServiceNow instance
    // Valid choices include: 'Solution provided', 'Resolved by caller', 'Workaround provided', etc.
    const payload = {
      state: '6', // Resolved
      close_code: 'Solution provided', // MUST match an existing choice value
      close_notes: resolutionNote ?? 'Resolved via knowledge deflection.',
    };

    const result = await servicenowClient.patch<ResolvedIncident>('incident', incidentSysId, payload);

    logger.info('Incident resolved', {
      sys_id: result.result.sys_id,
      number: result.result.number,
      state: '6',
    });

    return {
      ...result.result,
      state: '6',
    };
  } catch (error) {
    logger.error('Failed to resolve incident', { incidentSysId, error });
    throw error;
  }
}

