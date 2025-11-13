# ServiceNow Backend Flow
## End-to-End Pipeline for Client Support Counter

This document describes the complete backend flow that occurs when a user submits a request through the Client Support Counter UI.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Request Flow Overview](#request-flow-overview)
3. [Step-by-Step Backend Pipeline](#step-by-step-backend-pipeline)
4. [Response Payload Structure](#response-payload-structure)
5. [Error Scenarios](#error-scenarios)
6. [Cross-References](#cross-references)

---

## Purpose

This document provides a complete technical specification of what happens when a user clicks "Submit Request" in the Client Support Counter UI. It covers:

- Incident creation in ServiceNow
- Auto-classification and resource recommendations
- Contact email resolution
- Automation execution (for specific categories)
- Work notes injection
- Notification handling
- Return payload structure

**This is the authoritative reference for the backend integration flow.**

---

## Request Flow Overview

```
UI Submit Button
    ↓
POST /incident (Express endpoint)
    ↓
Validation (Zod schema)
    ↓
createClientIncident()
    ↓
├─→ resolveContactEmail()        # Phase 1: Use clientEmail if provided
├─→ createIncident()              # Create ServiceNow incident
├─→ hasAutomation()?              # Check if category has automation
│   └─→ automateGoogleWorkspaceAccountAccess()  # Run automation if applicable
├─→ classifyAndRecommend()        # Pure classification (no SN calls)
└─→ Write work_notes              # Add automation activity
    ↓
Return Enriched Response
```

---

## Step-by-Step Backend Pipeline

### Step 1: Request Validation

**Endpoint:** `POST /incident`

**Request Payload:**
```json
{
  "client": "Archer Insurance",
  "category": "Google Workspace – Account Access",
  "errorCode": "500",
  "shortDescription": "Cannot log into Google Workspace account",
  "detailedDescription": "User reports being unable to access their account...",
  "priority": "High",
  "clientEmail": "user@archerinsurance.com"
}
```

**Validation:**
- Uses `ClientIncidentCreateSchema` (Zod)
- Validates required fields: `client`, `category`, `shortDescription`
- Validates optional fields: `errorCode`, `detailedDescription`, `priority`, `clientEmail`

**On Validation Failure:**
- Returns HTTP 400 with error details
- No ServiceNow API calls are made

---

### Step 2: Contact Email Resolution

**Function:** `resolveContactEmail(payload)`

**Phase 1 Behavior (Current):**
- If `payload.clientEmail` is provided, use it directly
- Returns `{ email: string | null }`

**Phase 2 Behavior (Future):**
- If `payload.clientContactId` is set, look up contact in ServiceNow
- If `payload.clientId` is set, use default/billing contact for that client
- Possible tables: `sys_user`, `customer_contact`, `u_client_contact`

**Current Implementation:**
```typescript
// Phase 1: Just echo clientEmail if present
if (payload.clientEmail) {
  return { email: payload.clientEmail };
}
return { email: null };
```

---

### Step 3: ServiceNow Incident Creation

**Function:** `createIncident(legacyPayload, additionalFields)`

**ServiceNow API Call:**
```http
POST https://<instance>.service-now.com/api/now/table/incident
Authorization: Basic <encoded_credentials>
Content-Type: application/json

{
  "short_description": "Cannot log into Google Workspace account",
  "description": "User reports being unable to access their account...\n\nError Code: 500\n\nClient: Archer Insurance",
  "priority": "1",
  "category": "Google Workspace – Account Access",
  "u_client": "Archer Insurance",
  "u_source": "BBP Support Counter",
  "contact_type": "self-service",
  "u_client_email": "user@archerinsurance.com"
}
```

**Field Mappings:**

| UI Field | ServiceNow Field | Type | Notes |
|----------|------------------|------|-------|
| `shortDescription` | `short_description` | string | Required |
| `detailedDescription` + `errorCode` + `client` | `description` | string | Concatenated |
| `priority` | `priority` | string | "Low" → "5", "Normal" → "3", "High" → "1" |
| `category` | `category` | string | Mirrors UI options |
| `client` | `u_client` | string | Custom field |
| - | `u_source` | string | Always "BBP Support Counter" |
| - | `contact_type` | string | Always "self-service" |
| `clientEmail` (resolved) | `u_client_email` | string | Custom field (if available) |

**Response:**
```json
{
  "result": {
    "sys_id": "abc123def456",
    "number": "INC0012345",
    "short_description": "Cannot log into Google Workspace account",
    "state": "1"
  }
}
```

---

### Step 4: Automation Check

**Function:** `hasAutomation(category)`

**Current Automation Rules:**
- **"Google Workspace – Account Access"** → Has automation
- All other categories → No automation

**If Automation Exists:**
- Calls `automateGoogleWorkspaceAccountAccess()`
- See [ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md) for details

**If No Automation:**
- Proceeds to classification step

---

### Step 5: Classification and Resource Recommendations

**Function:** `classifyAndRecommend(input)`

**Input:**
```typescript
{
  client: "Archer Insurance",
  category: "Google Workspace – Account Access",
  errorCode: "500",
  shortDescription: "Cannot log into Google Workspace account",
  detailedDescription: "User reports being unable to access..."
}
```

**Process:**
1. Combines all text for keyword matching
2. Filters classification rules by category
3. Matches keywords and error codes
4. Returns topic and recommended resources

**Output:**
```typescript
{
  topic: "Google Workspace Account Access",
  recommendedResources: [
    {
      type: "doc",
      label: "Google Workspace Account Access Troubleshooting",
      url: "https://support.google.com/a/answer/1728857"
    },
    // ... more resources
  ]
}
```

**Note:** This is a **pure function** with no ServiceNow API calls.

---

### Step 6: Work Notes Injection

**If Automation Ran:**
- Automation already writes work notes (see [ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md))

**If No Automation:**
- Writes work notes with classification and resources:

```http
PATCH https://<instance>.service-now.com/api/now/table/incident/abc123def456
Authorization: Basic <encoded_credentials>
Content-Type: application/json

{
  "work_notes": "[AUTO] Classified as 'Google Workspace Account Access'\n[AUTO] Sent acknowledgement and self-service resources to user@archerinsurance.com.\n\nRecommended resources:\n  • Google Workspace Account Access Troubleshooting (doc)\n  • Reset Google Workspace User Password (doc)\n  • Google Workspace Admin Console Walkthrough (video)\n  • Two-Factor Authentication Setup Guide (doc)"
}
```

**Work Note Format:**
```
[AUTO] Classified as '<topic>'
[AUTO] Sent acknowledgement and self-service resources to <email>.
Recommended resources:
  • <resource_label> (<type>)
  • ...
```

---

### Step 7: Response Assembly

**Function:** `createClientIncident()` returns `ClientIncidentResponse`

**Response Payload:**
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

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `sys_id` | string | ServiceNow incident sys_id |
| `number` | string | ServiceNow incident number (e.g., "INC0012345") |
| `client` | string | Client name from request |
| `category` | string | Category from request |
| `shortDescription` | string | Short description from request |
| `detailedDescription` | string | Detailed description from request (optional) |
| `state` | string | Incident state ("1" = New) |
| `priority` | string | Priority from request (optional) |
| `topic` | string | Classified topic |
| `recommendedResources` | array | Array of resource objects |
| `automation` | object | Automation execution results (if applicable) |

---

## Error Scenarios

### Validation Error

**Scenario:** Missing required field

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

**HTTP Status:** 400

**No ServiceNow API calls made.**

---

### ServiceNow API Error (4xx)

**Scenario:** Authentication failure, permission error, invalid field

**Response:**
```json
{
  "error": "ServiceNow API error: 401 Unauthorized",
  "statusCode": 401
}
```

**HTTP Status:** 500 (internal server error)

**No retry attempted** (per ruleset - 4xx errors are not retried).

---

### ServiceNow API Error (429/5xx)

**Scenario:** Rate limit or server error

**Behavior:**
- Retry with exponential backoff (up to 5 attempts)
- If all retries fail, return error

**Response:**
```json
{
  "error": "ServiceNow API error: 500 Internal Server Error",
  "statusCode": 500
}
```

**HTTP Status:** 500

---

### Work Notes Update Failure

**Scenario:** Incident created, but work_notes update fails

**Behavior:**
- Incident creation succeeds
- Work notes update failure is logged but does not fail the request
- Response still returned successfully

**Log:**
```
WARN: Failed to write automation work_notes { error: ..., sys_id: "abc123" }
```

---

## Cross-References

- **[ServiceNow Field Mappings](./SERVICENOW_FIELD_MAPPINGS.md)** - Complete field mapping reference
- **[ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md)** - Automation rules and execution
- **[ServiceNow Notifications](./SERVICENOW_NOTIFICATIONS.md)** - Email notification handling
- **[BBP Support Counter Backend Spec](./BBP_SUPPORT_COUNTER_BACKEND_SPEC.md)** - Full backend specification
- **[ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Error handling patterns

---

**Status:** Complete backend flow specification v1.0

