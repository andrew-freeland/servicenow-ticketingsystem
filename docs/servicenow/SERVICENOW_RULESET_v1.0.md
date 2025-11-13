# ServiceNow Integration Ruleset v1.0

**Canonical Knowledge Base for ServiceNow Integration Development**

This document defines the complete set of rules, constraints, and best practices for building integrations with ServiceNow Personal Developer Instances (PDIs). All ServiceNow-related code, documentation, and architecture decisions must comply with this ruleset.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Authentication & Security Rules](#authentication--security-rules)
3. [Rate Limiting, Retries, and Performance](#rate-limiting-retries-and-performance)
4. [API Usage Rules](#api-usage-rules)
5. [Best Practices for Integrations & Agent Code](#best-practices-for-integrations--agent-code)
6. [Instance & Platform Constraints](#instance--platform-constraints)
7. [Sample API Contracts](#sample-api-contracts)
8. [Cross-References](#cross-references)

---

## Purpose

This ruleset serves as the **single source of truth** for all ServiceNow integration development. It defines:

- Required authentication patterns and credential storage
- API syntax and usage constraints
- Error handling and retry policies
- Code structure and modularity requirements
- PDI-specific limitations and constraints
- Naming conventions and documentation standards

**All ServiceNow integrations must align with this ruleset.** The [Integration Validator](./INTEGRATION_VALIDATOR.md) enforces compliance before code generation.

---

## Authentication & Security Rules

### Supported Authentication Methods

Always use one of the following authentication types:

1. **Basic Auth** with username and password
2. **OAuth 2.0** with `client_id` and `client_secret`
3. **API Key / HMAC Token** (if instance supports it)

### Credential Storage

**Never hardcode credentials in code.**

Store all secrets in:
- Environment variables (development)
- GCP Secret Manager (production deployments)

### Expected Environment Variable Names

```bash
SERVICE_NOW_INSTANCE          # Instance URL (e.g., dev12345.service-now.com)
SERVICE_NOW_USER              # Username for Basic Auth
SERVICE_NOW_PASSWORD          # Password for Basic Auth
SERVICE_NOW_CLIENT_ID         # OAuth client ID
SERVICE_NOW_CLIENT_SECRET      # OAuth client secret
SERVICE_NOW_API_KEY           # API Key token (if using token auth)
AUTH_MODE                     # "basic" | "oauth" | "apiKey"
```

### Required Roles

**Minimum required roles:**
- `web_service_admin` - Required for API access
- `itil` - Required for incident table access
- `itil_admin` - Required for full incident management
- `sn_incident_write` - Required for creating incidents

**Never use the global admin role** unless explicitly required. Always follow the principle of least privilege.

### Security Best Practices

- ✅ Use service accounts with minimal required roles
- ✅ Rotate credentials regularly
- ✅ Redact secrets in logs (replace with `***REDACTED***`)
- ✅ Never commit credentials to version control
- ❌ Never use admin accounts for API access

---

## Rate Limiting, Retries, and Performance

### PDI Rate Limiting

ServiceNow PDIs (Personal Developer Instances) have **no fixed global rate limits**, but:

- They may return **HTTP 429 Too Many Requests** if rate-limiting rules are configured
- They may slow down or expire if unused
- They automatically shut down after 10 minutes of inactivity

### Retry Strategy

**Always implement retry logic with exponential backoff for:**
- **HTTP 429** (Too Many Requests) - Rate limit exceeded
- **HTTP 5xx** (Server Errors) - Temporary server issues

**Do NOT retry on:**
- **HTTP 4xx** (Client Errors) - Bad request, authentication issues, permission errors

### Retry Configuration

Default retry parameters:
- **Base delay**: 500ms
- **Exponential factor**: 2
- **Maximum attempts**: 5
- **Jitter**: ±15%

**Retry formula:**
```
delay = baseDelay * (2 ^ attempt) + jitter
```

Example delays:
- Attempt 1: ~500ms
- Attempt 2: ~1000ms
- Attempt 3: ~2000ms
- Attempt 4: ~4000ms
- Attempt 5: ~8000ms

**All retry logic must be capped** to avoid infinite loops.

### Data Volume Rules

- **Default maximum records per API call**: 10,000
- **Recommended**: 1,000 records per call for optimal performance
- **Always use `sysparm_limit` and `sysparm_offset`** for large queries
- **Use `sysparm_query=sys_updated_on>LAST_RUN_TIMESTAMP`** for incremental syncs

---

## API Usage Rules

### Supported APIs

| API | Description | Use Case |
|-----|-------------|----------|
| **Table API** | Full CRUD operations on any table | Standard record management |
| **Scripted REST API** | Custom endpoints built in ServiceNow Studio | Custom business logic |
| **Import Set API** | Bulk record ingestion using staging tables | Large data imports |

### Table API Syntax

**Base URL structure:**
```
https://<instance>.service-now.com/api/now/table/<TableName>
```

**Supported HTTP methods:**
- `GET` - Retrieve records
- `POST` - Create records
- `PATCH` - Update specific fields (preferred over PUT)
- `PUT` - Full record replacement (use sparingly)
- `DELETE` - Delete records

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `sysparm_query` | ServiceNow query syntax filter | `state<6^priority=1` |
| `sysparm_limit` | Maximum records to return (max 10,000) | `20` |
| `sysparm_offset` | Pagination offset | `100` |
| `sysparm_fields` | Comma-separated list of fields to return | `sys_id,number,short_description` |
| `sysparm_display_value` | Return display values instead of sys_ids | `true` or `false` |

### Required Headers

All requests must include:
- `Authorization`: Based on auth mode (Basic, Bearer, etc.)
- `Content-Type`: `application/json`
- `Accept`: `application/json`
- `User-Agent`: `Cursor-AI-Agent/1.0` (for traceability)

### Table API Payload Safety

- ✅ **Use `sysparm_fields`** to limit fields returned
- ✅ **Use PATCH** to update specific fields only (not PUT)
- ✅ **Validate required fields locally** before sending to ServiceNow
- ✅ **Use pagination** for large datasets
- ❌ Never send entire record objects when only updating one field

### Scripted REST API Rules

**Important:** Scripted REST APIs must be **manually created** inside the ServiceNow instance. AI cannot create them via API.

All REST scripts must be wrapped in:
```javascript
function process(request, response) {
  // Your code here
  response.setStatus(200);
  response.setBody({ result: data });
}
```

**Always return JSON** with `setBody({})` and appropriate status codes.

---

## Best Practices for Integrations & Agent Code

### Code Structure

Always organize code by domain:

```
/src
  /clients
    servicenow.ts          # API wrapper
  /seed
    seed.ts                # Record generators
  /reports
    reports.ts             # Report pullers
  /webhooks
    inbound.ts             # ServiceNow → External handlers
    outbound.ts            # External → ServiceNow handlers
  /utils
    logger.ts              # Logging utilities
    retry.ts               # Retry logic
    validation.ts          # Input validation (Zod/Joi)
```

### Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Validation**: Zod or Joi
- **Package Manager**: pnpm (preferred) or npm

### Modularity

Agent components must support **hot-swappable API clients**:

- You may replace `ServiceNowClient` with mocks for dry runs
- Environment-specific config (instance, creds, polling schedule) should live in `config.ts`
- All API calls should go through a centralized client wrapper

### Documentation Requirements

Every integration must include:

- ✅ List of required credentials/secrets
- ✅ API endpoints called (with method and payload example)
- ✅ Retry logic used
- ✅ Output format expected
- ✅ Required ServiceNow plugins or roles
- ✅ PDI limitations and recovery steps

### Testing Strategy

- ✅ Provide test record generators (`/seed.ts`)
- ✅ Include ATF payloads (if applicable) to import test plans into the PDI
- ✅ Log outbound requests and responses with redacted secrets
- ✅ Support mock clients for unit testing

---

## Instance & Platform Constraints

### Personal Developer Instances (PDIs)

**Characteristics:**
- ✅ Free with full-feature access
- ⚠️ Automatically shut down after **10 minutes of inactivity**
- ⚠️ Reset if not accessed within **7 days**
- ⚠️ All data is **ephemeral** (may be lost)
- ⚠️ May require **manual plugin activation**

### Plugin Management

**Cursor cannot enable plugins** — prompt user to enable manually if required.

**Common plugin IDs:**
- `com.glide.automated_testing_framework` - ATF
- `com.glide.rest.scripted` - Scripted REST API

### PDI Reset Recovery

If your PDI instance sleeps or resets:

1. **Wake the instance** - Access it via browser or API call
2. **Re-seed data** - Run seed operations to recreate test data
3. **Verify connection** - Run health checks to confirm everything works

The service should be designed to be **idempotent** - re-running seed operations won't create duplicates.

### Enterprise Features

**Do NOT assume:**
- ❌ Enterprise licensing features are available
- ❌ IntegrationHub spokes are active
- ❌ Custom tables exist (unless user confirms)
- ❌ Custom Scripted REST APIs exist (unless user confirms)
- ❌ Any environment other than PDI

---

## Sample API Contracts

### Table API - POST (Create Incident)

**Request:**
```http
POST https://<instance>.service-now.com/api/now/table/incident
Authorization: Basic <encoded_user_pass>
Content-Type: application/json
User-Agent: Cursor-AI-Agent/1.0

{
  "short_description": "Printer not working",
  "category": "hardware",
  "impact": "2",
  "urgency": "1"
}
```

**Response:**
```json
{
  "result": {
    "sys_id": "abc123",
    "number": "INC0012345",
    "short_description": "Printer not working",
    "state": "1"
  }
}
```

### Table API - GET (List Incidents)

**Request:**
```http
GET https://<instance>.service-now.com/api/now/table/incident?sysparm_query=state<6&sysparm_limit=20&sysparm_fields=sys_id,number,short_description,state
Authorization: Basic <encoded_user_pass>
User-Agent: Cursor-AI-Agent/1.0
```

**Response:**
```json
{
  "result": [
    {
      "sys_id": "abc123",
      "number": "INC0012345",
      "short_description": "Printer not working",
      "state": "1"
    }
  ]
}
```

### Table API - PATCH (Update Incident)

**Request:**
```http
PATCH https://<instance>.service-now.com/api/now/table/incident/abc123
Authorization: Basic <encoded_user_pass>
Content-Type: application/json
User-Agent: Cursor-AI-Agent/1.0

{
  "state": "2",
  "work_notes": "Issue resolved"
}
```

**Response:**
```json
{
  "result": {
    "sys_id": "abc123",
    "state": "2",
    "work_notes": "Issue resolved"
  }
}
```

---

## Cross-References

- **[Integration Validator](./INTEGRATION_VALIDATOR.md)** - Enforcement layer for this ruleset
- **[Validator Meta-Context](./VALIDATOR_META_CONTEXT.md)** - Interpretation guide
- **[Default Architectural Profile](./DAP_v1.0.md)** - Project structure defaults
- **[ServiceNow Table API Guide](./SERVICENOW_TABLE_API_GUIDE.md)** - Detailed API usage examples
- **[ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Error handling patterns
- **[ServiceNow Setup Guide](./SERVICENOW_SETUP.md)** - Getting started with credentials and roles

---

## Remember

- You are working against a **ServiceNow Developer Instance**, not production
- You will **never be charged API fees** for this instance
- **Minimize errors** by validating all payloads, deduplicating data, and logging all failures
- **All retry logic must be capped** to avoid infinite loops
- **When in doubt, consult this ruleset before acting**

---

**Status:** Canonical ruleset v1.0 - All ServiceNow integrations must comply with these rules.

