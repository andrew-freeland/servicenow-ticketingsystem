# Validator Meta-Context: Understanding & Enforcement Protocol

This document explains how the **ServiceNow Integration Ruleset Validator** ("The Enforcer") must be interpreted and applied.

---

## Table of Contents

1. [Document Relationship](#document-relationship)
2. [Understanding the Validator](#understanding-the-validator)
3. [Enforcement Behavior](#enforcement-behavior)
4. [No Assumptions Policy](#no-assumptions-policy)
5. [Output Format Compliance](#output-format-compliance)
6. [Scope of Application](#scope-of-application)
7. [Missing Information Request Rules](#missing-information-request-rules)
8. [Cross-References](#cross-references)

---

## Document Relationship

### Hierarchy

```
ServiceNow Integration Ruleset v1.0
    ↓ (defines rules)
Integration Validator
    ↓ (enforces rules)
Validator Meta-Context
    ↓ (interprets validator)
Generated Code/Output
```

**Priority Rule:**
- **Ruleset v1.0 takes priority** if conflict arises
- If conflict detected: warn user and ask which version to update

### Document Roles

| Document | Role | Purpose |
|----------|------|---------|
| **Ruleset v1.0** | Knowledge base | Defines all rules, constraints, and best practices |
| **Validator** | Execution policy | Enforces ruleset compliance before code generation |
| **Meta-Context** | Interpretation guide | Explains how to apply the validator correctly |

---

## Understanding the Validator

### What It Is

- **Procedural enforcement layer** - not a replacement for the ruleset
- **Runtime guardrail** that enforces the ruleset
- **Mandatory checks** that must run before any ServiceNow output

### What It Does

- Validates all 7 categories before returning code
- Outputs standardized validation header
- Stops execution if any category fails
- Ensures compliance with Ruleset v1.0

### What It Does NOT Do

- Does not replace the ruleset
- Does not create new rules
- Does not apply to non-ServiceNow tasks

---

## Enforcement Behavior

### For Every ServiceNow-Related Request

1. **MUST** perform all 7 validation categories:
   - Ruleset compliance
   - Architecture
   - Authentication
   - API syntax
   - Error handling
   - Documentation
   - Instance constraints

2. **MUST** output validation header before any code

3. **MUST** stop if any category fails:
   - Provide no code
   - Explain violations
   - Suggest compliant alternatives
   - Ask user whether to proceed

### Validation Flow

```
ServiceNow Request Received
    ↓
Run 7-Category Validation
    ↓
All Categories Pass?
    ├─ Yes → Output Validation Header + Code
    └─ No → STOP, Explain Violations, Suggest Fix, Wait for Approval
```

---

## No Assumptions Policy

### A. Missing Information Protocol

If user instructions conflict with or lack:
- Missing credentials
- Missing field requirements
- Missing tables
- Missing ServiceNow roles
- Ambiguous endpoints
- Unclear instance state

→ **ASK the user for clarification before generating**

### B. No Speculative ServiceNow Features

**DO NOT assume:**
- ❌ Plugins are enabled
- ❌ Enterprise/licensed features are available
- ❌ Custom Scripted REST API exists (unless user confirms)
- ❌ Custom table exists (unless user confirms)
- ❌ IntegrationHub spoke is active
- ❌ Any environment other than PDI

### C. Clarification Questions

When information is missing, ask:
- "What table are we targeting?"
- "Has the Scripted REST API been created yet?"
- "What is the PDI instance name?"
- "Which authentication method should I use?"
- "Which fields are required on this table?"
- "What roles does the service account have?"

**Never guess. Always ask.**

---

## Output Format Compliance

### Required Structure

All ServiceNow-related output must include:

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

### Header Requirements

- **Must appear before any code**
- **Must include all 7 categories**
- **Must indicate Pass/Fail for each**
- **Must include brief notes explaining status**
- **Must include separator line before output**

---

## Scope of Application

### Apply Validator To:

- ✅ All ServiceNow integrations
- ✅ ServiceNow API code
- ✅ ServiceNow documentation
- ✅ ServiceNow architecture decisions
- ✅ ServiceNow configuration
- ✅ ServiceNow error handling patterns

### Do NOT Apply Validator To:

- ❌ Non-ServiceNow tasks
- ❌ General coding questions
- ❌ Unrelated documentation
- ❌ Tasks outside ServiceNow domain
- ❌ Frontend-only code (unless it calls ServiceNow APIs)

---

## Missing Information Request Rules

### Questions to Ask Before Coding

If needed to execute the Validator properly, ask:

- "Do you want a local-first or GCP-first architecture by default?"
- "Which default table should I assume (incident, sc_request, custom table, etc.)?"
- "Should I assume Basic Auth or OAuth as the default authentication method?"
- "Should I include a default exponential backoff configuration (e.g., 2^n seconds)?"
- "Should I assume TypeScript + Node.js as the runtime?"
- "What is your ServiceNow instance URL?"
- "What roles does your service account have?"
- "Are any plugins required for this integration?"

### Critical Rule

**Never begin coding until missing information is resolved.**

If you cannot validate all 7 categories due to missing information:
1. **STOP**
2. **List missing information**
3. **Ask user for clarification**
4. **Wait for response before proceeding**

---

## Cross-References

- **[ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md)** - Canonical knowledge base
- **[Integration Validator](./INTEGRATION_VALIDATOR.md)** - Validation checklist and protocol
- **[Default Architectural Profile](./DAP_v1.0.md)** - Project structure defaults

---

## Status

**Validator logic successfully assimilated and linked to Ruleset v1.0. Ready for ServiceNow-compliant development.**

