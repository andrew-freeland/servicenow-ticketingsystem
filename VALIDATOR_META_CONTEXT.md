# Validator Meta-Context: Understanding & Enforcement Protocol

This document explains how the **ServiceNow Integration Ruleset Validator** ("The Enforcer") must be interpreted and applied.

---

## 🎯 Document Relationship

### Hierarchy
- **Ruleset v1.0** = Knowledge base (the "law")
- **Validator** = Execution policy (the "law enforcement")

### Priority Rule
- **Ruleset v1.0 takes priority** if conflict arises
- If conflict detected: warn user and ask which version to update

---

## 🔍 Understanding the Validator

### What It Is
- **Procedural enforcement layer** - not a replacement for the ruleset
- **Runtime guardrail** that enforces the ruleset
- **Mandatory checks** that must run before any ServiceNow output

### What It Does
- Validates all 7 categories before returning code
- Outputs standardized validation header
- Stops execution if any category fails
- Ensures compliance with Ruleset v1.0

---

## ✅ Enforcement Behavior

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

---

## 🚫 No Assumptions Policy

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
- Plugins are enabled
- Enterprise/licensed features are available
- Custom Scripted REST API exists (unless user confirms)
- Custom table exists (unless user confirms)
- IntegrationHub spoke is active
- Any environment other than PDI

### C. Clarification Questions

When information is missing, ask:
- "What table are we targeting?"
- "Has the Scripted REST API been created yet?"
- "What is the PDI instance name?"
- "Which authentication method should I use?"
- "Which fields are required on this table?"

**Never guess.**

---

## 📋 Output Format Compliance

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

---

## 🔄 Scope of Application

### Apply Validator To:
- All ServiceNow integrations
- ServiceNow API code
- ServiceNow documentation
- ServiceNow architecture decisions
- ServiceNow configuration

### Do NOT Apply Validator To:
- Non-ServiceNow tasks
- General coding questions
- Unrelated documentation
- Tasks outside ServiceNow domain

---

## ❓ Missing Information Request Rules

### Questions to Ask Before Coding

If needed to execute the Validator properly, ask:

- "Do you want a local-first or GCP-first architecture by default?"
- "Which default table should I assume (incident, sc_request, custom table, etc.)?"
- "Should I assume Basic Auth or OAuth as the default authentication method?"
- "Should I include a default exponential backoff configuration (e.g., 2^n seconds)?"
- "Should I assume TypeScript + Node.js as the runtime?"

### Critical Rule
**Never begin coding until missing information is resolved.**

---

## 🔗 Reference Documents

- **ServiceNow Integration Ruleset v1.0** - Canonical knowledge base
- **INTEGRATION_VALIDATOR.md** - Validation checklist and protocol

---

## ✅ Status

**Validator logic successfully assimilated and linked to Ruleset v1.0. Ready for ServiceNow-compliant development.**

