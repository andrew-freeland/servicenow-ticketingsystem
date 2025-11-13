# ServiceNow Field Mappings
## Complete Field Reference for Client Support Counter

This document defines all field mappings between the Client Support Counter UI and ServiceNow incident records.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Field Mapping Table](#field-mapping-table)
3. [Field Details](#field-details)
4. [Custom Fields](#custom-fields)
5. [Priority Mapping](#priority-mapping)
6. [Category Mapping](#category-mapping)
7. [Example Payloads](#example-payloads)
8. [Cross-References](#cross-references)

---

## Purpose

This document provides the complete reference for:

- How UI form fields map to ServiceNow incident fields
- Field types and validation requirements
- Custom field usage
- Priority and category mappings
- Example request/response payloads

**Use this document when:**
- Adding new fields to the UI
- Debugging field mapping issues
- Understanding ServiceNow incident structure
- Implementing field validation

---

## Field Mapping Table

| UI Field | ServiceNow Field | Type | Required | Notes |
|----------|------------------|------|----------|-------|
| **Client** | `u_client` | string | ✅ Yes | Company or client name |
| **Category** | `category` | choice | ✅ Yes | Mirrors UI category options |
| **Error Code** | (in `description`) | string | ❌ No | Included in description field |
| **Short Description** | `short_description` | string | ✅ Yes | Brief summary of issue |
| **Detailed Description** | `description` | string | ❌ No | Full description + metadata |
| **Priority** | `priority` | choice/integer | ❌ No | "Low" → "5", "Normal" → "3", "High" → "1" |
| **Client Email** | `u_client_email` | string | ❌ No | Resolved contact email |
| - | `u_source` | string | Auto | Always "BBP Support Counter" |
| - | `contact_type` | string | Auto | Always "self-service" |
| - | `state` | integer | Auto | Defaults to "1" (New) |

---

## Field Details

### Client (`u_client`)

**UI Field:** Client dropdown/input

**ServiceNow Field:** `u_client` (custom field)

**Type:** String

**Required:** Yes

**Validation:**
- Must not be empty
- Accepts any string value
- "Other" option allows free-text input

**Example Values:**
- "Archer Insurance"
- "Hachman Construction"
- "Custom Client Name"

**Notes:**
- Custom field (prefixed with `u_`)
- Used for filtering and reporting
- Stored as-is (no transformation)

---

### Category (`category`)

**UI Field:** Category dropdown

**ServiceNow Field:** `category` (standard field)

**Type:** Choice list

**Required:** Yes

**Validation:**
- Must match one of the predefined category options
- "Other" option allows free-text input

**Available Categories:**
- Google Workspace – Account Access
- Google Workspace – Groups & Permissions
- HubSpot – Lifecycle & Automation
- HubSpot – Email Deliverability
- Buildertrend – Estimates & Proposals
- Buildertrend – Daily Logs & Timecards
- Apple Business Essentials – Device Enrollment
- Website – DNS & Email Routing
- Website – Content & Layout
- Integrations – Automation / Zapier / Make
- Other

**Notes:**
- Standard ServiceNow incident category field
- Used for classification and routing
- May trigger automation (see [ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md))

---

### Error Code

**UI Field:** Error Code text input

**ServiceNow Field:** Included in `description` field

**Type:** String

**Required:** No

**Format:** Free text (e.g., "500", "Bounce 5.1.0", "HubSpot WF-123")

**Storage:**
- Not stored as separate field
- Included in `description` as: `Error Code: <value>`

**Example:**
```
Description field contains:
"User reports issue...

Error Code: 500

Client: Archer Insurance"
```

---

### Short Description (`short_description`)

**UI Field:** Short description text input

**ServiceNow Field:** `short_description` (standard field)

**Type:** String

**Required:** Yes

**Validation:**
- Must not be empty
- Maximum length: 160 characters (ServiceNow default)

**Example:**
- "Cannot log into Google Workspace account"
- "Email delivery failing for marketing campaigns"

**Notes:**
- Standard ServiceNow incident field
- Used in incident list views
- Appears in email notifications

---

### Detailed Description (`description`)

**UI Field:** Detailed description textarea

**ServiceNow Field:** `description` (standard field)

**Type:** String (multi-line)

**Required:** No

**Content Structure:**
```
<detailedDescription>

Error Code: <errorCode>

Client: <client>
```

**Example:**
```
User reports being unable to access their Google Workspace account. They've tried resetting their password but continue to receive authentication errors.

Error Code: 500

Client: Archer Insurance
```

**Notes:**
- Standard ServiceNow incident field
- Supports multi-line text
- Includes metadata (error code, client) for filtering

---

### Priority (`priority`)

**UI Field:** Priority buttons (Low, Normal, High)

**ServiceNow Field:** `priority` (standard field)

**Type:** Integer (choice)

**Required:** No

**Mapping:**

| UI Value | ServiceNow Value | Integer |
|----------|------------------|---------|
| Low | "5" | 5 |
| Normal | "3" | 3 |
| High | "1" | 1 |

**Default:** Not set (ServiceNow default priority applies)

**Notes:**
- Standard ServiceNow incident priority field
- Lower number = higher priority
- Used for SLA calculations and routing

---

### Client Email (`u_client_email`)

**UI Field:** Client Email input (optional)

**ServiceNow Field:** `u_client_email` (custom field)

**Type:** String (email)

**Required:** No

**Resolution:**
- Phase 1: Uses `clientEmail` from request if provided
- Phase 2: Will look up from ServiceNow contact records

**Example:**
- "user@archerinsurance.com"
- "support@hachmanconstruction.com"

**Notes:**
- Custom field (prefixed with `u_`)
- Used for email notifications
- May be resolved from ServiceNow contact records in future

---

### Source (`u_source`)

**UI Field:** N/A (auto-populated)

**ServiceNow Field:** `u_source` (custom field)

**Type:** String

**Required:** N/A

**Value:** Always `"BBP Support Counter"`

**Purpose:** Identifies tickets created via the Client Support Counter

**Notes:**
- Used for filtering: `u_source=BBP Support Counter`
- Enables reporting on self-service tickets

---

### Contact Type (`contact_type`)

**UI Field:** N/A (auto-populated)

**ServiceNow Field:** `contact_type` (standard field)

**Type:** String

**Required:** N/A

**Value:** Always `"self-service"`

**Purpose:** Identifies how the incident was created

**Notes:**
- Standard ServiceNow incident field
- Used for reporting and analytics

---

### State (`state`)

**UI Field:** N/A (auto-populated)

**ServiceNow Field:** `state` (standard field)

**Type:** Integer

**Required:** N/A

**Default Value:** `"1"` (New)

**State Values:**

| Value | State Name |
|-------|------------|
| 1 | New |
| 2 | In Progress |
| 3 | On Hold |
| 4 | Awaiting |
| 5 | Resolved |
| 6 | Closed |
| 7 | Canceled |

**Notes:**
- Standard ServiceNow incident state field
- All new incidents start in "New" state
- State changes are managed by ServiceNow workflows or manual updates

---

## Custom Fields

### Custom Field Naming Convention

All custom fields use the `u_` prefix (ServiceNow standard for custom fields).

**Custom Fields Used:**
- `u_client` - Client name
- `u_client_email` - Client email address
- `u_source` - Source identifier

### Creating Custom Fields in ServiceNow

If these custom fields don't exist in your ServiceNow instance:

1. Navigate to **System Definition > Tables**
2. Open the `incident` table
3. Create new fields with the names above
4. Set appropriate field types (String, Email, etc.)

**Note:** The integration will work even if custom fields don't exist - ServiceNow will ignore unknown fields in POST requests.

---

## Priority Mapping

### UI to ServiceNow Priority Conversion

```typescript
function mapPriority(uiPriority: string | undefined): string | undefined {
  if (!uiPriority) return undefined;
  
  const mapping: Record<string, string> = {
    'Low': '5',
    'Normal': '3',
    'High': '1',
  };
  
  return mapping[uiPriority];
}
```

### ServiceNow Priority Values

ServiceNow uses integer values for priority:
- **1** = Critical
- **2** = High
- **3** = Medium
- **4** = Low
- **5** = Planning

**Note:** Our mapping uses 1, 3, 5 to align with common priority levels.

---

## Category Mapping

### Category Options

Categories are passed directly from UI to ServiceNow without transformation.

**Available Categories:**
- Google Workspace – Account Access
- Google Workspace – Groups & Permissions
- HubSpot – Lifecycle & Automation
- HubSpot – Email Deliverability
- Buildertrend – Estimates & Proposals
- Buildertrend – Daily Logs & Timecards
- Apple Business Essentials – Device Enrollment
- Website – DNS & Email Routing
- Website – Content & Layout
- Integrations – Automation / Zapier / Make
- Other

**Special Handling:**
- "Other" category allows free-text input
- Some categories trigger automation (see [ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md))

---

## Example Payloads

### Request Payload (UI → Backend)

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

### ServiceNow POST Payload

```json
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

### ServiceNow Response

```json
{
  "result": {
    "sys_id": "abc123def456",
    "number": "INC0012345",
    "short_description": "Cannot log into Google Workspace account",
    "description": "User reports being unable to access their account after password reset.\n\nError Code: 500\n\nClient: Archer Insurance",
    "priority": "1",
    "category": "Google Workspace – Account Access",
    "state": "1",
    "u_client": "Archer Insurance",
    "u_source": "BBP Support Counter",
    "contact_type": "self-service",
    "u_client_email": "user@archerinsurance.com"
  }
}
```

---

## Cross-References

- **[ServiceNow Backend Flow](./SERVICENOW_BACKEND_FLOW.md)** - How fields are processed in the backend
- **[ServiceNow Table API Guide](./SERVICENOW_TABLE_API_GUIDE.md)** - API usage for field operations
- **[ServiceNow Setup Guide](./SERVICENOW_SETUP.md)** - How to find and configure fields in ServiceNow

---

**Status:** Complete field mapping reference v1.0

