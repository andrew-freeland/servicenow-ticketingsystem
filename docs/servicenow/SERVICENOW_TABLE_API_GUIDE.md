# ServiceNow Table API Guide
## Complete API Usage Reference

This document provides comprehensive examples and best practices for using the ServiceNow Table API.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Base URL Structure](#base-url-structure)
3. [HTTP Methods](#http-methods)
4. [Query Parameters](#query-parameters)
5. [Request Examples](#request-examples)
6. [Response Formats](#response-formats)
7. [Pagination](#pagination)
8. [Field Selection](#field-selection)
9. [Best Practices](#best-practices)
10. [Cross-References](#cross-references)

---

## Purpose

This guide provides:

- Complete Table API syntax reference
- GET/POST/PATCH/DELETE examples
- Query parameter usage
- Pagination patterns
- Field selection strategies
- Ruleset-compliant code samples

**Use this guide when:**
- Implementing ServiceNow API calls
- Debugging API issues
- Understanding query syntax
- Optimizing API performance

---

## Base URL Structure

### Standard Table API URL

```
https://<instance>.service-now.com/api/now/table/<TableName>
```

**Components:**
- `<instance>` - Your ServiceNow instance (e.g., `dev12345.service-now.com`)
- `<TableName>` - ServiceNow table name (e.g., `incident`, `kb_knowledge`)

### Examples

```
https://dev12345.service-now.com/api/now/table/incident
https://dev12345.service-now.com/api/now/table/kb_knowledge
https://dev12345.service-now.com/api/now/table/sys_user
```

### Record-Specific URLs

For operations on specific records:

```
https://<instance>.service-now.com/api/now/table/<TableName>/<sys_id>
```

**Example:**
```
https://dev12345.service-now.com/api/now/table/incident/abc123def456
```

---

## HTTP Methods

### GET - Retrieve Records

**Use Case:** List or query records

**URL:** `https://<instance>.service-now.com/api/now/table/<TableName>`

**Query Parameters:** `sysparm_query`, `sysparm_limit`, `sysparm_offset`, `sysparm_fields`

### POST - Create Records

**Use Case:** Create new records

**URL:** `https://<instance>.service-now.com/api/now/table/<TableName>`

**Body:** JSON object with field values

### PATCH - Update Records

**Use Case:** Update specific fields (preferred over PUT)

**URL:** `https://<instance>.service-now.com/api/now/table/<TableName>/<sys_id>`

**Body:** JSON object with only fields to update

### PUT - Full Record Replacement

**Use Case:** Replace entire record (use sparingly)

**URL:** `https://<instance>.service-now.com/api/now/table/<TableName>/<sys_id>`

**Body:** JSON object with all fields

### DELETE - Delete Records

**Use Case:** Delete records

**URL:** `https://<instance>.service-now.com/api/now/table/<TableName>/<sys_id>`

**No Body Required**

---

## Query Parameters

### sysparm_query

**Purpose:** Filter records using ServiceNow query syntax

**Format:** ServiceNow encoded query string

**Operators:**
- `=` - Equals
- `!=` - Not equals
- `>` - Greater than
- `<` - Less than
- `>=` - Greater than or equal
- `<=` - Less than or equal
- `LIKE` - Contains (case-insensitive)
- `STARTSWITH` - Starts with
- `ENDSWITH` - Ends with
- `^` - AND operator
- `^OR` - OR operator
- `^NQ` - NOT operator

**Examples:**
```
state<6
priority=1^category=hardware
short_descriptionLIKEprinter
state=1^ORstate=2
```

### sysparm_limit

**Purpose:** Maximum number of records to return

**Format:** Integer (1-10,000)

**Default:** 10,000

**Best Practice:** Use 1,000 or less for optimal performance

**Example:**
```
sysparm_limit=20
```

### sysparm_offset

**Purpose:** Pagination offset

**Format:** Integer (0 or greater)

**Default:** 0

**Example:**
```
sysparm_offset=100
```

### sysparm_fields

**Purpose:** Limit fields returned in response

**Format:** Comma-separated list of field names

**Best Practice:** Always use to reduce payload size

**Example:**
```
sysparm_fields=sys_id,number,short_description,state
```

### sysparm_display_value

**Purpose:** Return display values instead of sys_ids

**Format:** `true` or `false`

**Default:** `false` (returns sys_ids)

**Example:**
```
sysparm_display_value=true
```

---

## Request Examples

### GET - List Open Incidents

**cURL:**
```bash
curl -X GET \
  'https://dev12345.service-now.com/api/now/table/incident?sysparm_query=state<6&sysparm_limit=20&sysparm_fields=sys_id,number,short_description,state' \
  -H 'Authorization: Basic <encoded_credentials>' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0'
```

**TypeScript:**
```typescript
const result = await servicenowClient.getTable('incident', {
  sysparm_query: 'state<6',
  sysparm_limit: 20,
  sysparm_fields: 'sys_id,number,short_description,state',
});
```

### GET - Query with Multiple Conditions

**cURL:**
```bash
curl -X GET \
  'https://dev12345.service-now.com/api/now/table/incident?sysparm_query=state<6^priority=1^category=hardware' \
  -H 'Authorization: Basic <encoded_credentials>' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0'
```

**TypeScript:**
```typescript
const result = await servicenowClient.getTable('incident', {
  sysparm_query: 'state<6^priority=1^category=hardware',
});
```

### POST - Create Incident

**cURL:**
```bash
curl -X POST \
  'https://dev12345.service-now.com/api/now/table/incident' \
  -H 'Authorization: Basic <encoded_credentials>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0' \
  -d '{
    "short_description": "Printer not working",
    "category": "hardware",
    "priority": "1",
    "impact": "2",
    "urgency": "1"
  }'
```

**TypeScript:**
```typescript
const result = await servicenowClient.create('incident', {
  short_description: 'Printer not working',
  category: 'hardware',
  priority: '1',
  impact: '2',
  urgency: '1',
});
```

### PATCH - Update Incident

**cURL:**
```bash
curl -X PATCH \
  'https://dev12345.service-now.com/api/now/table/incident/abc123def456' \
  -H 'Authorization: Basic <encoded_credentials>' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0' \
  -d '{
    "state": "2",
    "work_notes": "Issue resolved"
  }'
```

**TypeScript:**
```typescript
const result = await servicenowClient.patch('incident', 'abc123def456', {
  state: '2',
  work_notes: 'Issue resolved',
});
```

### DELETE - Delete Incident

**cURL:**
```bash
curl -X DELETE \
  'https://dev12345.service-now.com/api/now/table/incident/abc123def456' \
  -H 'Authorization: Basic <encoded_credentials>' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0'
```

**TypeScript:**
```typescript
await servicenowClient.del('incident', 'abc123def456');
```

---

## Response Formats

### GET Response

**Success (200 OK):**
```json
{
  "result": [
    {
      "sys_id": "abc123def456",
      "number": "INC0012345",
      "short_description": "Printer not working",
      "state": "1"
    }
  ]
}
```

**Empty Result:**
```json
{
  "result": []
}
```

### POST Response

**Success (201 Created):**
```json
{
  "result": {
    "sys_id": "abc123def456",
    "number": "INC0012345",
    "short_description": "Printer not working",
    "state": "1"
  }
}
```

### PATCH Response

**Success (200 OK):**
```json
{
  "result": {
    "sys_id": "abc123def456",
    "state": "2",
    "work_notes": "Issue resolved"
  }
}
```

### Error Response

**4xx Client Error:**
```json
{
  "error": {
    "message": "User not authenticated",
    "detail": "Invalid credentials"
  },
  "status": "failure"
}
```

**5xx Server Error:**
```json
{
  "error": {
    "message": "Internal server error",
    "detail": "An unexpected error occurred"
  },
  "status": "failure"
}
```

---

## Pagination

### Basic Pagination Pattern

```typescript
let offset = 0;
const limit = 1000;
let hasMore = true;
const allRecords = [];

while (hasMore) {
  const result = await servicenowClient.getTable('incident', {
    sysparm_query: 'state<6',
    sysparm_limit: limit,
    sysparm_offset: offset,
    sysparm_fields: 'sys_id,number,short_description',
  });
  
  allRecords.push(...result.result);
  
  hasMore = result.result.length === limit;
  offset += limit;
}
```

### Incremental Sync Pattern

```typescript
const lastRun = '2024-01-15 10:00:00';
const query = `sys_updated_on>${lastRun}`;

const result = await servicenowClient.getTable('incident', {
  sysparm_query: query,
  sysparm_limit: 1000,
});
```

---

## Field Selection

### Always Use sysparm_fields

**Why:**
- Reduces payload size
- Improves performance
- Reduces bandwidth usage

**Example:**
```typescript
// Good: Only request needed fields
const result = await servicenowClient.getTable('incident', {
  sysparm_fields: 'sys_id,number,short_description,state',
});

// Bad: Requests all fields (slower, larger payload)
const result = await servicenowClient.getTable('incident', {});
```

### Common Field Sets

**Incident List:**
```
sysparm_fields=sys_id,number,short_description,state,priority,category,sys_created_on
```

**Incident Detail:**
```
sysparm_fields=sys_id,number,short_description,description,state,priority,impact,urgency,category,work_notes
```

---

## Best Practices

### 1. Always Use sysparm_fields

✅ **Good:**
```typescript
sysparm_fields=sys_id,number,short_description
```

❌ **Bad:**
```typescript
// No sysparm_fields - returns all fields
```

### 2. Use PATCH for Updates

✅ **Good:**
```typescript
await servicenowClient.patch('incident', sysId, {
  state: '2',
});
```

❌ **Bad:**
```typescript
await servicenowClient.put('incident', sysId, {
  // All fields required
});
```

### 3. Implement Pagination

✅ **Good:**
```typescript
const limit = 1000;
let offset = 0;
// Pagination loop
```

❌ **Bad:**
```typescript
// Fetching all records at once (may exceed 10,000 limit)
```

### 4. Always Include User-Agent Header

✅ **Good:**
```typescript
headers: {
  'User-Agent': 'Cursor-AI-Agent/1.0',
}
```

❌ **Bad:**
```typescript
// No User-Agent header
```

### 5. Validate Payloads Locally

✅ **Good:**
```typescript
const schema = z.object({
  short_description: z.string().min(1),
});
const validated = schema.parse(payload);
await servicenowClient.create('incident', validated);
```

❌ **Bad:**
```typescript
// No validation - may send invalid data
await servicenowClient.create('incident', payload);
```

### 6. Handle Errors Properly

✅ **Good:**
```typescript
try {
  const result = await servicenowClient.create('incident', payload);
} catch (error) {
  if (error.statusCode === 429 || error.statusCode >= 500) {
    // Retry logic
  } else {
    // Don't retry 4xx errors
    throw error;
  }
}
```

❌ **Bad:**
```typescript
// Retrying all errors
```

---

## Cross-References

- **[ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md)** - API usage rules
- **[ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Error handling patterns
- **[ServiceNow Setup Guide](./SERVICENOW_SETUP.md)** - How to find field names and test API calls

---

**Status:** Complete Table API reference v1.0

