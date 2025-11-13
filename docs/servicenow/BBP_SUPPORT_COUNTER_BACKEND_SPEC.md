# BBP Support Counter Backend Specification
## Complete Backend and ServiceNow Integration Specification

This document provides the complete technical specification for the BBP Support Counter backend, including ServiceNow integration, incident creation, classification, notifications, and automation.

---

## Table of Contents

1. [Purpose](#purpose)
2. [System Overview](#system-overview)
3. [Incident Creation Flow](#incident-creation-flow)
4. [ServiceNow Enrichment](#servicenow-enrichment)
5. [Classification Logic](#classification-logic)
6. [Notifications](#notifications)
7. [Linking Tickets](#linking-tickets)
8. [Automation Activity Extraction](#automation-activity-extraction)
9. [Expected UI Data Shapes](#expected-ui-data-shapes)
10. [API Endpoints](#api-endpoints)
11. [Error Handling](#error-handling)
12. [Cross-References](#cross-references)

---

## Purpose

This document serves as the **complete backend specification** for the BBP Support Counter. It covers:

- End-to-end incident creation flow
- ServiceNow integration details
- Classification and resource recommendations
- Email notifications
- Automation activity tracking
- Expected request/response formats

**This is the authoritative reference for backend implementation.**

---

## System Overview

### Architecture

```
Client (Browser)
    ↓
Express Server (Node.js/TypeScript)
    ↓
ServiceNow Table API
    ↓
ServiceNow PDI Instance
```

### Key Components

1. **Express Server** - HTTP API server
2. **ServiceNow Client** - API wrapper for ServiceNow Table API
3. **Classification Engine** - Pure function for topic classification
4. **Automation Module** - Category-specific automation logic
5. **Contact Resolution** - Email address resolution

---

## Incident Creation Flow

### Request Flow

```
POST /incident
    ↓
Validation (Zod schema)
    ↓
resolveContactEmail()
    ↓
createIncident() → ServiceNow API
    ↓
hasAutomation()?
    ├─ Yes → automateGoogleWorkspaceAccountAccess()
    └─ No → classifyAndRecommend()
    ↓
Write work_notes (if needed)
    ↓
Return enriched response
```

### Request Payload

**Endpoint:** `POST /incident`

**Content-Type:** `application/json`

**Schema:**
```typescript
{
  client: string;                    // Required
  category: string;                  // Required
  errorCode?: string;                // Optional
  shortDescription: string;          // Required
  detailedDescription?: string;      // Optional
  priority?: "Low" | "Normal" | "High";  // Optional
  clientEmail?: string;              // Optional
  clientId?: string;                 // Optional (Phase 2)
  clientContactId?: string;          // Optional (Phase 2)
}
```

**Example:**
```json
{
  "client": "Archer Insurance",
  "category": "Google Workspace – Account Access",
  "errorCode": "500",
  "shortDescription": "Cannot log into Google Workspace account",
  "detailedDescription": "User reports being unable to access their account after password reset.",
  "priority": "High",
  "clientEmail": "user@archerinsurance.com"
}
```

### Response Payload

**Status Code:** `201 Created`

**Schema:**
```typescript
{
  sys_id: string;
  number?: string;
  client: string;
  category: string;
  shortDescription: string;
  detailedDescription?: string;
  state: string;
  priority?: string;
  topic: string;
  recommendedResources: Array<{
    type: "doc" | "video";
    label: string;
    url: string;
  }>;
  automation?: {
    classified: boolean;
    emailSent: boolean;
    emailProvider?: string;
    workNoteAdded: boolean;
  };
}
```

**Example:**
```json
{
  "sys_id": "abc123def456",
  "number": "INC0012345",
  "client": "Archer Insurance",
  "category": "Google Workspace – Account Access",
  "shortDescription": "Cannot log into Google Workspace account",
  "detailedDescription": "User reports being unable to access...",
  "state": "1",
  "priority": "High",
  "topic": "Google Workspace Account Access",
  "recommendedResources": [
    {
      "type": "doc",
      "label": "Google Workspace Account Access Troubleshooting",
      "url": "https://support.google.com/a/answer/1728857"
    }
  ],
  "automation": {
    "classified": true,
    "emailSent": false,
    "emailProvider": null,
    "workNoteAdded": true
  }
}
```

---

## ServiceNow Enrichment

### Incident Creation

**ServiceNow API Call:**
```http
POST https://<instance>.service-now.com/api/now/table/incident
Authorization: Basic <encoded_credentials>
Content-Type: application/json

{
  "short_description": "Cannot log into Google Workspace account",
  "description": "User reports being unable to access their account after password reset.\n\nError Code: 500\n\nClient: Archer Insurance",
  "priority": "1",
  "category": "Google Workspace – Account Access",
  "u_client": "Archer Insurance",
  "u_source": "BBP Support Counter",
  "contact_type": "self-service",
  "u_client_email": "user@archerinsurance.com"
}
```

### Field Mappings

See [ServiceNow Field Mappings](./SERVICENOW_FIELD_MAPPINGS.md) for complete field mapping reference.

### Custom Fields

**Custom fields used:**
- `u_client` - Client name
- `u_client_email` - Resolved contact email
- `u_source` - Source identifier ("BBP Support Counter")

**Note:** These fields may not exist in your ServiceNow instance. ServiceNow will ignore unknown fields, but the integration should not depend on reading them back.

---

## Classification Logic

### Classification Input

```typescript
{
  client: string;
  category: string;
  errorCode?: string;
  shortDescription: string;
  detailedDescription: string;
}
```

### Classification Process

1. **Text Combination:**
   - Combines `shortDescription` and `detailedDescription`
   - Converts to lowercase for matching

2. **Rule Matching:**
   - Filters rules by `category`
   - Matches `matchKeywords` in combined text
   - Matches `matchErrorCodes` if provided

3. **Topic Assignment:**
   - Returns matched rule's `topic`
   - Falls back to category default if no match
   - Returns "Unclassified / Manual Review" if no rule matches

4. **Resource Selection:**
   - Returns `recommendedResources` from matched rule
   - Resources are pre-defined per category/topic

### Classification Output

```typescript
{
  topic: string;
  recommendedResources: Array<{
    type: "doc" | "video";
    label: string;
    url: string;
  }>;
}
```

**Note:** Classification is a **pure function** with no ServiceNow API calls.

---

## Notifications

### Client Acknowledgement Emails

**Trigger:** Incident created with automation enabled

**Conditions:**
- Category has automation (currently: "Google Workspace – Account Access")
- Client email is available (from `clientEmail` or resolved contact)

**Status:**
- Currently **stubbed** (logged, not sent)
- Future: Will integrate with email provider (SendGrid, AWS SES, etc.)

**Email Content:**
- Incident number
- Classified topic
- Self-service resources

### Internal Notifications (Andrew)

**ServiceNow-Native:**
- Triggered by ServiceNow workflows/rules
- Sent to Andrew's ServiceNow user email
- Configured in ServiceNow UI

**Common Triggers:**
- New incident created
- Incident assigned
- Incident state changed

See [ServiceNow Notifications](./SERVICENOW_NOTIFICATIONS.md) for details.

---

## Linking Tickets

### Current Implementation

**No explicit linking** - Each incident is independent.

### Future Implementation (Phase 2+)

**Possible Linking Scenarios:**
- Link related incidents
- Link to parent incident
- Link to problem record
- Link to change request

**ServiceNow Fields:**
- `parent` - Parent incident sys_id
- `problem_id` - Related problem sys_id
- `rfc` - Related change request sys_id

**Implementation Notes:**
- Linking will be optional
- May require additional ServiceNow configuration
- Will be added in future phases

---

## Automation Activity Extraction

### How It Works

**Query:**
```javascript
work_notesLIKE[AUTO]^descriptionLIKEClient:
```

**Process:**
1. Query incidents with `[AUTO]` in work notes
2. Filter to BBP Support Counter tickets (description contains "Client:")
3. Extract `[AUTO]` lines from work notes
4. Create activity entries for each `[AUTO]` line

### Activity Entry Structure

```typescript
{
  timestamp: string;        // ISO timestamp from sys_updated_on
  incidentNumber: string;  // e.g., "INC0012345"
  client: string | null;   // Extracted from description
  summary: string;         // [AUTO] line content (without prefix)
  sys_id: string;         // Incident sys_id
}
```

### Work Notes Format

**Standard Format:**
```
[AUTO] Classified as '<topic>'
[AUTO] Sent acknowledgement and self-service resources to <email>.
Recommended resources:
  • <resource_label> (<type>)
  • ...
```

**Automation Format:**
```
[AUTO] Classified as '<topic>'
Acknowledgement email sent to <email>.
Recommended self-service resources:
  • <resource_label> (<type>)
  • ...
```

See [ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md) for details.

---

## Expected UI Data Shapes

### Incident List Item

**Endpoint:** `GET /incidents`

**Response:**
```typescript
{
  incidents: Array<{
    sys_id: string;
    number?: string;
    short_description: string;
    description?: string;
    state: string;
    priority?: string;
    category?: string;
    sys_created_on?: string;
    client?: string | null;  // Parsed from description
  }>;
  total?: number;
}
```

### Automation Activity Item

**Endpoint:** `GET /automation-activity`

**Response:**
```typescript
{
  activities: Array<{
    timestamp: string;
    incidentNumber: string;
    client: string | null;
    summary: string;
    sys_id: string;
  }>;
  count: number;
}
```

---

## API Endpoints

### POST /incident

**Purpose:** Create a new incident

**Request:** See [Incident Creation Flow](#incident-creation-flow)

**Response:** See [Response Payload](#response-payload)

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Validation error
- `500 Internal Server Error` - ServiceNow API error

### GET /incidents

**Purpose:** List incidents

**Query Parameters:**
- `state` - Filter by state ("open", "resolved", or state number)
- `source` - Filter by source ("bbp" for BBP Support Counter tickets)
- `limit` - Maximum records to return (default: 20)
- `offset` - Pagination offset (default: 0)

**Example:**
```
GET /incidents?source=bbp&limit=20&state=open
```

**Response:** See [Expected UI Data Shapes](#expected-ui-data-shapes)

### GET /automation-activity

**Purpose:** Get automation activity

**Query Parameters:**
- `limit` - Maximum records to return (default: 50)

**Example:**
```
GET /automation-activity?limit=50
```

**Response:** See [Expected UI Data Shapes](#expected-ui-data-shapes)

### GET /health

**Purpose:** Health check

**Response:**
```json
{
  "status": "ok"
}
```

---

## Error Handling

### Validation Errors

**Status Code:** `400 Bad Request`

**Response:**
```json
{
  "error": "Invalid request payload",
  "details": {
    "issues": [
      {
        "path": ["shortDescription"],
        "message": "Required"
      }
    ]
  }
}
```

### ServiceNow API Errors

**Status Code:** `500 Internal Server Error`

**Response:**
```json
{
  "error": "ServiceNow API error: 401 Unauthorized",
  "statusCode": 401
}
```

### Retry Logic

- ✅ Retries on HTTP 429 (rate limit) and 5xx (server errors)
- ❌ Does not retry on 4xx (client errors)
- Uses exponential backoff with jitter
- Maximum 5 retry attempts

See [ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md) for details.

---

## Cross-References

- **[ServiceNow Backend Flow](./SERVICENOW_BACKEND_FLOW.md)** - End-to-end flow documentation
- **[ServiceNow Field Mappings](./SERVICENOW_FIELD_MAPPINGS.md)** - Complete field mapping reference
- **[ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md)** - Automation rules and execution
- **[ServiceNow Notifications](./SERVICENOW_NOTIFICATIONS.md)** - Email notification details
- **[ServiceNow Table API Guide](./SERVICENOW_TABLE_API_GUIDE.md)** - API usage examples
- **[ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Error handling patterns

---

**Status:** Complete backend specification v1.0

