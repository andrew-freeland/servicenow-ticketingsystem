# ServiceNow Notifications
## Email Notification Rules and Templates

This document describes when and how email notifications are sent to clients and internal staff (Andrew) for ServiceNow incidents.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Notification Overview](#notification-overview)
3. [Client Notifications](#client-notifications)
4. [Internal Notifications (Andrew)](#internal-notifications-andrew)
5. [Notification Templates](#notification-templates)
6. [Email Provider Integration](#email-provider-integration)
7. [Notification Triggers](#notification-triggers)
8. [Cross-References](#cross-references)

---

## Purpose

This document explains:

- When Andrew receives notifications
- When clients receive notifications
- Email template formats
- Email provider integration notes
- ServiceNow-native vs external delivery options

**Use this document when:**
- Configuring email notifications
- Understanding notification triggers
- Customizing email templates
- Integrating email providers

---

## Notification Overview

### Notification Types

1. **Client Acknowledgement Emails**
   - Sent to client when incident is created
   - Includes incident number and self-service resources
   - Only sent if client email is available

2. **Internal Notifications (Andrew)**
   - ServiceNow-native notifications
   - Triggered by ServiceNow workflows/rules
   - Sent to Andrew's ServiceNow user email

### Notification Status

**Current Implementation:**
- ✅ Client acknowledgement emails: **Stubbed** (logged, not sent)
- ✅ Internal notifications: **ServiceNow-native** (via workflows)

**Future Implementation:**
- Email provider integration (SendGrid, AWS SES, etc.)
- Configurable email templates
- Delivery status tracking

---

## Client Notifications

### When Client Notifications Are Sent

**Trigger:** Incident created via Client Support Counter

**Conditions:**
- ✅ Incident successfully created in ServiceNow
- ✅ Client email is available (from `clientEmail` field or resolved contact)
- ✅ Category has automation enabled (currently: "Google Workspace – Account Access")
- ⚠️ Email provider is configured (currently stubbed)

### Notification Content

**Subject:** (To be configured)

**Body Template:**
```
Hello,

We've received your request regarding "<topic>" (Ticket #<incident_number>).

While we review your request, here are some self-service resources that may help:

<resource_list>

We'll update you as soon as we have more information.

Best regards,
BBP Support Team
```

**Example:**
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

### Email Status Tracking

**Work Notes Entry:**
- If email sent: `Acknowledgement email sent to <email>.`
- If email not sent: `Acknowledgement email not sent (no email provider configured).`

**Response Payload:**
```json
{
  "automation": {
    "emailSent": true,
    "emailProvider": "sendgrid"
  }
}
```

---

## Internal Notifications (Andrew)

### When Andrew Receives Notifications

**ServiceNow-Native Notifications:**
- Triggered by ServiceNow workflows/rules
- Sent to Andrew's ServiceNow user email
- Configured in ServiceNow UI (not via API)

**Common Triggers:**
- New incident created
- Incident assigned
- Incident state changed
- Work notes added
- Incident resolved/closed

### Notification Configuration

**ServiceNow Setup:**
1. Navigate to **System Notification > Email > Notifications**
2. Create/modify notification rules
3. Set conditions (e.g., `u_source=BBP Support Counter`)
4. Set recipients (Andrew's ServiceNow user)
5. Configure email template

**Example Notification Rule:**
- **Condition:** `u_source=BBP Support Counter^state=1`
- **Recipient:** Andrew's ServiceNow user
- **Template:** New incident notification template

### Notification Content

**Subject:** (Configured in ServiceNow)

**Body:** (Configured in ServiceNow template)

**Common Fields:**
- Incident number
- Short description
- Client name
- Category
- Priority
- State
- Link to incident

---

## Notification Templates

### Client Acknowledgement Template

**Template Variables:**
- `{topic}` - Classified topic
- `{incident_number}` - ServiceNow incident number (e.g., "INC0012345")
- `{resource_list}` - Formatted list of resources
- `{client_name}` - Client name (optional)

**Template Structure:**
```
Hello,

We've received your request regarding "{topic}" (Ticket #{incident_number}).

While we review your request, here are some self-service resources that may help:

{resource_list}

We'll update you as soon as we have more information.

Best regards,
BBP Support Team
```

**Resource List Format:**
```
• <resource_label>: <resource_url>
• <resource_label>: <resource_url>
...
```

### Internal Notification Template

**Template Variables:**
- `{incident_number}` - ServiceNow incident number
- `{short_description}` - Incident short description
- `{client}` - Client name
- `{category}` - Category
- `{priority}` - Priority
- `{state}` - State
- `{incident_url}` - Link to incident in ServiceNow

**Template Structure:**
```
New Incident Created

Incident Number: {incident_number}
Client: {client}
Category: {category}
Priority: {priority}
State: {state}

Description: {short_description}

View Incident: {incident_url}
```

---

## Email Provider Integration

### Current Status

**Implementation:** Stubbed (logged, not sent)

**Code Location:** `src/docsdesk/automation.ts`

**Function:** `sendAcknowledgementEmail()`

### Future Integration Options

**Option 1: SendGrid**
- API-based email sending
- Template support
- Delivery tracking
- Bounce handling

**Option 2: AWS SES**
- Cost-effective for high volume
- Template support
- Delivery tracking
- Bounce handling

**Option 3: ServiceNow Email**
- Use ServiceNow's email capabilities
- Native integration
- Limited customization

### Integration Requirements

**Environment Variables:**
```bash
EMAIL_PROVIDER=sendgrid|ses|servicenow
SENDGRID_API_KEY=<api_key>          # If using SendGrid
AWS_SES_REGION=us-east-1             # If using AWS SES
AWS_SES_ACCESS_KEY_ID=<key>          # If using AWS SES
AWS_SES_SECRET_ACCESS_KEY=<secret>   # If using AWS SES
FROM_EMAIL=support@bbp.com           # Sender email address
```

**Implementation Steps:**
1. Choose email provider
2. Set up API credentials
3. Configure environment variables
4. Update `sendAcknowledgementEmail()` function
5. Test email delivery
6. Monitor delivery status

### Email Provider Comparison

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **SendGrid** | Easy integration, good templates | Paid tier for production | Free tier: 100/day |
| **AWS SES** | Very cost-effective, scalable | More setup required | $0.10 per 1,000 emails |
| **ServiceNow** | Native integration | Limited customization | Included with ServiceNow |

---

## Notification Triggers

### Client Notification Triggers

**Current:**
- ✅ Incident created via Client Support Counter
- ✅ Category has automation enabled
- ✅ Client email is available

**Future:**
- Incident state changed (e.g., resolved)
- Work notes added by support team
- Incident assigned

### Internal Notification Triggers

**ServiceNow-Native:**
- New incident created
- Incident assigned to Andrew
- Incident state changed
- Work notes added
- Incident resolved/closed

**Custom Triggers (Future):**
- High-priority incident created
- Client email bounce
- Automation failure

---

## Email Delivery Status

### Tracking Email Status

**Work Notes:**
- Email sent: `Acknowledgement email sent to <email>.`
- Email not sent: `Acknowledgement email not sent (no email provider configured).`

**Response Payload:**
```json
{
  "automation": {
    "emailSent": true,
    "emailProvider": "sendgrid",
    "workNoteAdded": true
  }
}
```

### Future Status Tracking

**Database Fields (Future):**
- `email_sent_at` - Timestamp when email was sent
- `email_delivered_at` - Timestamp when email was delivered
- `email_opened_at` - Timestamp when email was opened
- `email_bounced` - Boolean flag for bounce status

**ServiceNow Fields (Future):**
- `u_email_sent` - Boolean flag
- `u_email_sent_at` - Timestamp
- `u_email_provider` - Provider name

---

## Cross-References

- **[ServiceNow Automations](./SERVICENOW_AUTOMATIONS.md)** - How notifications are triggered
- **[ServiceNow Backend Flow](./SERVICENOW_BACKEND_FLOW.md)** - Notification flow in backend
- **[BBP Support Counter Backend Spec](./BBP_SUPPORT_COUNTER_BACKEND_SPEC.md)** - Full notification specification

---

**Status:** Notification rules and templates v1.0

