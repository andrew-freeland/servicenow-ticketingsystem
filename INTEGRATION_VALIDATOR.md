# ServiceNow Integration Ruleset Validator
## "The Enforcer" - Validation Checklist

This document defines the mandatory validation checks that must be performed before any ServiceNow-related code, documentation, or design is returned.

---

## ✅ VALIDATION CHECKLIST

Before returning any ServiceNow-related output, validate against these categories:

### 1. RULESET COMPLIANCE CHECK
- [ ] All behavior aligns with "ServiceNow Integration Ruleset v1.0"
- [ ] No violations of canonical rules
- [ ] If violation detected: STOP, explain, suggest alternative

### 2. ARCHITECTURE & MODULARITY CHECK
- [ ] Code is modular and placed in appropriate folders:
  - `/src/servicenow.ts` - API wrapper
  - `/src/seed.ts` - record generators
  - `/src/reports.ts` - report pullers
  - `/src/webhooks/` - SN → outbound handlers
- [ ] All credentials referenced via environment variables (never hard-coded)
- [ ] No ServiceNow plugins assumed active unless explicitly stated
- [ ] TypeScript with Zod/Joi validation
- [ ] Hot-swappable API clients for testing

### 3. AUTHENTICATION CHECK
- [ ] Uses one of: Basic Auth, OAuth 2.0, or API Key/HMAC
- [ ] Credential names match ruleset:
  - `SERVICE_NOW_INSTANCE`
  - `SERVICE_NOW_USER`
  - `SERVICE_NOW_PASSWORD`
  - `SERVICE_NOW_CLIENT_ID`
  - `SERVICE_NOW_CLIENT_SECRET`
  - `SERVICE_NOW_API_KEY` (if applicable)
- [ ] Least-privilege roles used (web_service_admin + specific access, NOT global admin)
- [ ] Credentials stored in environment variables or GCP Secret Manager

### 4. API SYNTAX CHECK
- [ ] Table API URL structure: `https://<instance>.service-now.com/api/now/table/<TableName>`
- [ ] Query parameters used correctly:
  - `sysparm_query` for filtering
  - `sysparm_limit` (max 10,000 per call)
  - `sysparm_offset` for pagination
  - `sysparm_fields` to limit returned fields
- [ ] Incremental syncs use: `sysparm_query=sys_updated_on>LAST_RUN_TIMESTAMP`
- [ ] Pagination implemented for large datasets
- [ ] User-Agent header included: "Cursor-AI-Agent/1.0"
- [ ] PATCH used for updates (not PUT) to update specific fields only
- [ ] Payloads validated locally before sending

### 5. ERROR HANDLING CHECK
- [ ] Retry logic implemented for:
  - HTTP 429 (Too Many Requests)
  - HTTP 5xx (Server Errors)
- [ ] NO retry for 4xx client errors
- [ ] Exponential backoff implemented
- [ ] Retry logic capped (no infinite loops)
- [ ] Logs redact secrets
- [ ] All failures logged

### 6. DOCUMENTATION CHECK
Every integration must include:
- [ ] List of required credentials/secrets
- [ ] API endpoints called (with method and payload example)
- [ ] Retry logic used
- [ ] Output format expected
- [ ] Required SN plugins or roles

### 7. INSTANCE CONSTRAINT CHECK
- [ ] Compatible with PDI (Personal Developer Instance)
- [ ] Assumes 10-minute inactivity shutdown
- [ ] Assumes 7-day reset cycle if unused
- [ ] Assumes ephemeral data
- [ ] No enterprise licensing features required
- [ ] Plugin activation noted as manual (cannot be done via API)

---

## 📋 REQUIRED OUTPUT FORMAT

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

---

## 🚨 FAILURE PROTOCOL

If any category fails:
1. **STOP** - Do not provide code
2. **EXPLAIN** - Detail the violation(s)
3. **SUGGEST** - Provide compliant alternative
4. **WAIT** - For user approval before proceeding

---

## 🔗 REFERENCE

This validator enforces: **ServiceNow Integration Ruleset v1.0**

