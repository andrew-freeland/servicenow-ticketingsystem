# ServiceNow Automations
## Classification, Resource Recommendations, and Work Notes

This document describes the automation rules, classification logic, and how automation activity is tracked in ServiceNow.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Automation Overview](#automation-overview)
3. [Classification Rules](#classification-rules)
4. [Resource Recommendations](#resource-recommendations)
5. [Work Notes Format](#work-notes-format)
6. [Automation Activity Tracking](#automation-activity-tracking)
7. [Category-Specific Automations](#category-specific-automations)
8. [Cross-References](#cross-references)

---

## Purpose

This document explains:

- How incidents are automatically classified
- How resource recommendations are generated
- How automation activity is written to ServiceNow work notes
- How the Automation Activity tab derives events
- Which categories have special automation logic

**Use this document when:**
- Adding new automation rules
- Understanding classification logic
- Debugging automation activity
- Extending automation to new categories

---

## Automation Overview

### Automation Flow

```
Incident Created
    ↓
hasAutomation(category)?
    ├─ Yes → Run Category-Specific Automation
    │         ├─ Classify topic
    │         ├─ Get resources
    │         ├─ Send email (if applicable)
    │         └─ Write work notes
    │
    └─ No → Run Standard Classification
            ├─ Classify topic
            ├─ Get resources
            └─ Write work notes
```

### Current Automation Status

**Fully Automated Categories:**
- ✅ **Google Workspace – Account Access** - Full automation with email notifications

**Standard Classification (No Special Automation):**
- All other categories use standard classification rules

---

## Classification Rules

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

1. **Combine Text for Matching:**
   - Combines `shortDescription` and `detailedDescription`
   - Converts to lowercase for case-insensitive matching

2. **Filter by Category:**
   - Only considers rules matching the incident category

3. **Keyword Matching:**
   - Matches against `matchKeywords` array
   - Example: "password", "login", "access" → matches "Google Workspace Account Access"

4. **Error Code Matching:**
   - Matches against `matchErrorCodes` array
   - Example: "500", "401" → matches specific error scenarios

5. **Fallback Rule:**
   - If no keyword/error code match, uses fallback rule for category
   - Fallback rules have no `matchKeywords` or `matchErrorCodes`

6. **Last Resort:**
   - If no rule matches, returns "Unclassified / Manual Review"

### Classification Output

```typescript
{
  topic: string;
  recommendedResources: Array<{
    type: 'doc' | 'video';
    label: string;
    url: string;
  }>;
}
```

**Example:**
```typescript
{
  topic: "Google Workspace Account Access",
  recommendedResources: [
    {
      type: "doc",
      label: "Google Workspace Account Access Troubleshooting",
      url: "https://support.google.com/a/answer/1728857"
    },
    {
      type: "video",
      label: "Google Workspace Admin Console Walkthrough",
      url: "https://www.loom.com/share/google-workspace-admin-console"
    }
  ]
}
```

---

## Resource Recommendations

### Resource Types

- **`doc`** - Documentation, guides, articles
- **`video`** - Video tutorials, walkthroughs

### Resource Structure

```typescript
{
  type: 'doc' | 'video';
  label: string;  // Display name
  url: string;    // Resource URL
}
```

### Resource Selection Logic

Resources are selected based on:
1. **Category** - Each category has its own resource set
2. **Topic** - Specific topics within a category may have different resources
3. **Keywords** - Keywords in the description may influence resource selection

### Example Resources

**Google Workspace – Account Access:**
- Google Workspace Account Access Troubleshooting (doc)
- Reset Google Workspace User Password (doc)
- Google Workspace Admin Console Walkthrough (video)
- Two-Factor Authentication Setup Guide (doc)

---

## Work Notes Format

### Standard Work Note Format

```
[AUTO] Classified as '<topic>'
[AUTO] Sent acknowledgement and self-service resources to <email>.
Recommended resources:
  • <resource_label> (<type>)
  • <resource_label> (<type>)
  • ...
```

### Automation-Specific Work Note Format

For categories with special automation (e.g., Google Workspace – Account Access):

```
[AUTO] Classified as '<topic>'
Acknowledgement email sent to <email>.
Recommended self-service resources:
  • <resource_label> (<type>)
  • <resource_label> (<type>)
  • ...
```

### Work Note Components

1. **`[AUTO]` Prefix:**
   - Identifies automation-generated entries
   - Used for filtering automation activity

2. **Classification Line:**
   - `[AUTO] Classified as '<topic>'`
   - Shows the classified topic

3. **Email Status:**
   - `[AUTO] Sent acknowledgement and self-service resources to <email>.`
   - Or: `Acknowledgement email sent to <email>.`
   - Or: `Acknowledgement email not sent (no email provider configured).`

4. **Resource List:**
   - Bulleted list of recommended resources
   - Format: `• <label> (<type>)`

### Example Work Note

```
[AUTO] Classified as 'Google Workspace Account Access'
Acknowledgement email sent to user@archerinsurance.com.

Recommended self-service resources:
  • Google Workspace Account Access Troubleshooting (doc)
  • Reset Google Workspace User Password (doc)
  • Google Workspace Admin Console Walkthrough (video)
  • Two-Factor Authentication Setup Guide (doc)
```

---

## Automation Activity Tracking

### How Automation Activity is Extracted

The Automation Activity tab reads from ServiceNow work notes:

1. **Query Filter:**
   ```javascript
   work_notesLIKE[AUTO]^descriptionLIKEClient:
   ```
   - Finds incidents with `[AUTO]` in work notes
   - Filters to BBP Support Counter tickets (description contains "Client:")

2. **Extract [AUTO] Lines:**
   - Splits work notes by newline
   - Filters lines starting with `[AUTO]`
   - Removes `[AUTO]` prefix to get summary

3. **Create Activity Entries:**
   - One entry per `[AUTO]` line
   - Includes timestamp, incident number, client, summary

### Activity Entry Structure

```typescript
{
  timestamp: string;        // ISO timestamp
  incidentNumber: string;   // e.g., "INC0012345"
  client: string | null;    // Extracted from description
  summary: string;          // [AUTO] line content (without prefix)
  sys_id: string;          // Incident sys_id
}
```

### Example Activity Entry

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "incidentNumber": "INC0012345",
  "client": "Archer Insurance",
  "summary": "Classified as 'Google Workspace Account Access'",
  "sys_id": "abc123def456"
}
```

---

## Category-Specific Automations

### Google Workspace – Account Access

**Automation Function:** `automateGoogleWorkspaceAccountAccess()`

**Triggers:**
- Category = "Google Workspace – Account Access"

**Actions:**
1. **Classification:**
   - Topic: "Google Workspace Account Access"
   - Resources: Predefined Google Workspace resources

2. **Email Notification:**
   - Sends acknowledgement email to resolved contact email
   - Includes incident number and topic
   - Includes self-service resources
   - **Note:** Currently stubbed (no email provider configured)

3. **Work Notes:**
   - Writes automation work note with classification and email status
   - Includes resource list

**Email Template (Stub):**
```
Hello,

We've received your request regarding "Google Workspace Account Access" (Ticket #INC0012345).

While we review your request, here are some self-service resources that may help:

• Google Workspace Account Access Troubleshooting: https://support.google.com/a/answer/1728857
• Reset Google Workspace User Password: https://support.google.com/a/answer/33319
• Google Workspace Admin Console Walkthrough: https://www.loom.com/share/google-workspace-admin-console
• Two-Factor Authentication Setup Guide: https://support.google.com/a/answer/175197

We'll update you as soon as we have more information.

Best regards,
BBP Support Team
```

**Future Email Integration:**
- Will integrate with email provider (SendGrid, AWS SES, etc.)
- Email sending will be configurable
- Email templates will be customizable

---

## Adding New Automations

### Steps to Add Automation for a New Category

1. **Update `hasAutomation()` function:**
   ```typescript
   export function hasAutomation(category: string): boolean {
     return category === 'Google Workspace – Account Access' ||
            category === 'New Category Name';
   }
   ```

2. **Create automation function:**
   ```typescript
   export async function automateNewCategory(
     payload: ClientIncidentCreate,
     sysId: string,
     incidentNumber?: string,
     resolvedEmail?: string
   ): Promise<AutomationResult> {
     // Classification logic
     // Email sending (if applicable)
     // Work notes writing
   }
   ```

3. **Add resources:**
   - Define resource array for the category
   - Include relevant documentation and videos

4. **Update classification rules:**
   - Add rules to `classification-rules.ts`
   - Define keywords and error codes

5. **Test automation:**
   - Create test incident
   - Verify work notes are written correctly
   - Verify automation activity appears in tab

---

## Cross-References

- **[ServiceNow Backend Flow](./SERVICENOW_BACKEND_FLOW.md)** - How automations are triggered
- **[ServiceNow Notifications](./SERVICENOW_NOTIFICATIONS.md)** - Email notification details
- **[BBP Support Counter Backend Spec](./BBP_SUPPORT_COUNTER_BACKEND_SPEC.md)** - Full automation specification

---

**Status:** Automation rules and tracking specification v1.0

