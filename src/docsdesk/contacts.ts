/**
 * Contact resolution module
 * Provides future-safe hook for resolving contact emails from ServiceNow CRM directory
 * 
 * Phase 1: Uses literal clientEmail field if provided
 * Phase 2+: Will look up ServiceNow contact records (sys_user, customer_contact, or u_client_contact)
 * 
 * All ServiceNow calls use the integration user with "Web Service Access Only" flag enabled.
 */

import type { ClientIncidentCreate } from '../utils/validation';

export interface ResolvedContact {
  email: string | null;
  // Future: can add more fields like displayName, contactId, etc.
}

/**
 * Resolve the best email address for this incident context.
 *
 * Phase 1: Uses the literal clientEmail field (if provided).
 * Phase 2+: May look up ServiceNow contact records (sys_user, customer_contact, or u_client_contact).
 * 
 * Phase 2 Implementation Notes:
 * - If payload.clientContactId is set:
 *     call SN Table API via the existing client wrapper to fetch that record
 *     and derive email from the contact record
 * - Else if payload.clientId is set:
 *     use default/billing contact for that client
 * 
 * For now, we do NOT make any SN calls here to avoid depending on a directory table that may not exist yet.
 * All future SN calls must use the integration user (web service access only) via servicenowClient.
 * 
 * Possible tables to query in Phase 2:
 * - sys_user: Standard ServiceNow user table
 * - customer_contact: Standard ServiceNow customer contact table
 * - u_client_contact: Custom table for client contacts (if created)
 */
export async function resolveContactEmail(
  payload: ClientIncidentCreate,
): Promise<ResolvedContact> {
  // Phase 1 behavior: just echo the clientEmail if present.
  if (payload.clientEmail) {
    return { email: payload.clientEmail };
  }

  // Phase 2 (future):
  // - If payload.clientContactId is set:
  //     const contact = await servicenowClient.getTable('customer_contact', {
  //       sysparm_query: `sys_id=${payload.clientContactId}`,
  //       sysparm_fields: 'email',
  //     });
  //     if (contact.result[0]?.email) {
  //       return { email: contact.result[0].email };
  //     }
  //
  // - Else if payload.clientId is set:
  //     const client = await servicenowClient.getTable('u_client', {
  //       sysparm_query: `sys_id=${payload.clientId}`,
  //       sysparm_fields: 'u_billing_contact',
  //     });
  //     // Then resolve the billing contact's email
  //
  // For now, we do NOT make any SN calls here to avoid depending on a directory table that may not exist yet.

  return { email: null };
}

