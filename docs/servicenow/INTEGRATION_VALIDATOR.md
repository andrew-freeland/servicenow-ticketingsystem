# ServiceNow Integration Ruleset Validator
## "The Enforcer" - Validation Checklist

This document defines the mandatory validation checks that must be performed before any ServiceNow-related code, documentation, or design is returned.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Validation Checklist](#validation-checklist)
3. [Required Output Format](#required-output-format)
4. [Failure Protocol](#failure-protocol)
5. [Cross-References](#cross-references)

---

## Purpose

The Integration Validator is the **enforcement layer** for the [ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md). It ensures all ServiceNow-related outputs comply with the ruleset before being returned to the user.

**This validator must be applied to:**
- All ServiceNow integration code
- ServiceNow API code
- ServiceNow documentation
- ServiceNow architecture decisions
- ServiceNow configuration

**This validator does NOT apply to:**
- Non-ServiceNow tasks
- General coding questions
- Unrelated documentation
- Tasks outside ServiceNow domain

---

## Validation Checklist

Before returning any ServiceNow-related output, validate against these **7 categories**:

### 1. RULESET COMPLIANCE CHECK

- [ ] All behavior aligns with "ServiceNow Integration Ruleset v1.0"
- [ ] No violations of canonical rules
- [ ] If violation detected: **STOP**, explain, suggest alternative

**What to check:**
- Authentication methods match ruleset (Basic/OAuth/API Key)
- Credential storage follows ruleset (env vars, never hardcoded)
- API syntax matches ruleset (Table API URL structure, query params)
- Retry logic matches ruleset (exponential backoff, no retry on 4xx)
- Code structure matches ruleset (modular, TypeScript, Zod validation)

---

### 2. ARCHITECTURE & MODULARITY CHECK

- [ ] Code is modular and placed in appropriate folders:
  - `/src/clients/servicenow.ts` - API wrapper
  - `/src/seed/` - Record generators
  - `/src/docsdesk/` - Domain-specific modules
  - `/src/webhooks/` - ServiceNow → outbound handlers
- [ ] All credentials referenced via environment variables (never hard-coded)
- [ ] No ServiceNow plugins assumed active unless explicitly stated
- [ ] TypeScript with Zod/Joi validation
- [ ] Hot-swappable API clients for testing

**What to check:**
- Files are in correct directories per DAP v1.0
- No hardcoded credentials anywhere
- No assumptions about plugins being enabled
- Input validation using Zod or Joi
- Client can be mocked for testing

---

### 3. AUTHENTICATION CHECK

- [ ] Uses one of: Basic Auth, OAuth 2.0, or API Key/HMAC
- [ ] Credential names match ruleset:
  - `SERVICE_NOW_INSTANCE`
  - `SERVICE_NOW_USER`
  - `SERVICE_NOW_PASSWORD`
  - `SERVICE_NOW_CLIENT_ID`
  - `SERVICE_NOW_CLIENT_SECRET`
  - `SERVICE_NOW_API_KEY` (if applicable)
- [ ] Least-privilege roles used (`web_service_admin` + specific access, NOT global admin)
- [ ] Credentials stored in environment variables or GCP Secret Manager

**What to check:**
- Auth mode is explicitly set (basic/oauth/apiKey)
- Environment variable names match exactly
- No admin role usage unless explicitly required
- Secrets are never logged (redacted in logs)

---

### 4. API SYNTAX CHECK

- [ ] Table API URL structure: `https://<instance>.service-now.com/api/now/table/<TableName>`
- [ ] Query parameters used correctly:
  - `sysparm_query` for filtering
  - `sysparm_limit` (max 10,000 per call)
  - `sysparm_offset` for pagination
  - `sysparm_fields` to limit returned fields
- [ ] Incremental syncs use: `sysparm_query=sys_updated_on>LAST_RUN_TIMESTAMP`
- [ ] Pagination implemented for large datasets
- [ ] User-Agent header included: `"Cursor-AI-Agent/1.0"`
- [ ] PATCH used for updates (not PUT) to update specific fields only
- [ ] Payloads validated locally before sending

**What to check:**
- URLs follow correct Table API structure
- Query params are properly encoded
- Pagination is implemented (not fetching all records at once)
- User-Agent header is present
- Updates use PATCH, not PUT
- Input validation happens before API calls

---

### 5. ERROR HANDLING CHECK

- [ ] Retry logic implemented for:
  - HTTP 429 (Too Many Requests)
  - HTTP 5xx (Server Errors)
- [ ] NO retry for 4xx client errors
- [ ] Exponential backoff implemented
- [ ] Retry logic capped (no infinite loops)
- [ ] Logs redact secrets
- [ ] All failures logged

**What to check:**
- Retry logic exists and is properly configured
- 4xx errors are NOT retried
- Exponential backoff with jitter is implemented
- Maximum retry attempts are capped (typically 5)
- Secrets are redacted in logs (passwords, tokens replaced with `***REDACTED***`)
- All errors are logged with context

---

### 6. DOCUMENTATION CHECK

Every integration must include:

- [ ] List of required credentials/secrets
- [ ] API endpoints called (with method and payload example)
- [ ] Retry logic used
- [ ] Output format expected
- [ ] Required ServiceNow plugins or roles

**What to check:**
- README or documentation file exists
- Credentials are documented
- API endpoints are documented with examples
- Retry configuration is documented
- Expected response format is documented
- Required roles/plugins are listed

---

### 7. INSTANCE CONSTRAINT CHECK

- [ ] Compatible with PDI (Personal Developer Instance)
- [ ] Assumes 10-minute inactivity shutdown
- [ ] Assumes 7-day reset cycle if unused
- [ ] Assumes ephemeral data
- [ ] No enterprise licensing features required
- [ ] Plugin activation noted as manual (cannot be done via API)

**What to check:**
- Code doesn't assume enterprise features
- Code handles PDI shutdown gracefully
- Seed operations are idempotent (can be re-run)
- No assumptions about plugins being enabled
- No API calls to enable plugins

---

## Required Output Format

Every ServiceNow-related response must include this validation header:

```
✔ RULESET COMPLIANCE: [Pass/Fail + notes]
✔ ARCHITECTURE: [Pass/Fail + notes]
✔ AUTH: [Pass/Fail + notes]
✔ API SYNTAX: [Pass/Fail + notes]
✔ ERROR HANDLING: [Pass/Fail + notes]
✔ DOCUMENTATION: [Pass/Fail + notes]
✔ INSTANCE CONSTRAINTS: [Pass/Fail + notes]

--- FINAL OUTPUT BELOW THIS LINE ---
[Generated code or instructions]
```

**Example Pass Header:**
```
✔ RULESET COMPLIANCE: Pass - All behavior aligns with Integration Ruleset v1.0
✔ ARCHITECTURE: Pass - Modular structure, TypeScript + Zod, environment variables
✔ AUTH: Pass - Basic Auth default, switchable to OAuth/API Key, credentials in env vars
✔ API SYNTAX: Pass - Table API with correct URL structure, query params, User-Agent header
✔ ERROR HANDLING: Pass - Retry logic for 429/5xx only, exponential backoff with jitter, no retry on 4xx
✔ DOCUMENTATION: Pass - All required documentation included
✔ INSTANCE CONSTRAINTS: Pass - PDI compatible, no enterprise features, ephemeral data assumed

--- FINAL OUTPUT BELOW THIS LINE ---
```

**Example Fail Header:**
```
✔ RULESET COMPLIANCE: Fail - Using PUT instead of PATCH for updates
✔ ARCHITECTURE: Pass - Modular structure, TypeScript + Zod
✔ AUTH: Pass - Basic Auth, credentials in env vars
✔ API SYNTAX: Fail - Using PUT method, should use PATCH per ruleset
✔ ERROR HANDLING: Pass - Retry logic implemented correctly
✔ DOCUMENTATION: Pass - Documentation included
✔ INSTANCE CONSTRAINTS: Pass - PDI compatible

--- STOPPED: VALIDATION FAILURE ---
Please fix the following violations:
1. API SYNTAX: Use PATCH instead of PUT for updates (per Ruleset v1.0)
2. RULESET COMPLIANCE: Update method violates ruleset

Suggested fix:
- Change PUT to PATCH
- Only include fields being updated in payload
```

---

## Failure Protocol

If any category fails:

1. **STOP** - Do not provide code
2. **EXPLAIN** - Detail the violation(s) clearly
3. **SUGGEST** - Provide compliant alternative
4. **WAIT** - For user approval before proceeding

**Do not proceed with code generation if validation fails.** Always explain the violation and suggest a fix.

---

## Cross-References

- **[ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md)** - The canonical ruleset this validator enforces
- **[Validator Meta-Context](./VALIDATOR_META_CONTEXT.md)** - How to interpret and apply this validator
- **[Default Architectural Profile](./DAP_v1.0.md)** - Project structure defaults

---

**Status:** Validator v1.0 - Enforcement layer for ServiceNow Integration Ruleset v1.0

