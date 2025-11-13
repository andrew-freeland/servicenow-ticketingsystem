# ServiceNow Error Handling Guide
## Complete Error Handling Patterns and Best Practices

This document provides comprehensive guidance on handling errors from ServiceNow API calls, including retry logic, error categories, and logging practices.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Error Categories](#error-categories)
3. [Retry Strategy](#retry-strategy)
4. [Error Response Formats](#error-response-formats)
5. [Logging Format](#logging-format)
6. [Common Error Scenarios](#common-error-scenarios)
7. [Best Practices](#best-practices)
8. [Cross-References](#cross-references)

---

## Purpose

This guide explains:

- When to retry requests (429, 5xx)
- When NOT to retry (4xx client errors)
- Exponential backoff implementation
- Error logging with secret redaction
- Common error scenarios and solutions

**Use this guide when:**
- Implementing retry logic
- Debugging API errors
- Configuring error handling
- Understanding error responses

---

## Error Categories

### HTTP Status Code Categories

| Status Code | Category | Retry? | Description |
|-------------|----------|--------|-------------|
| **200-299** | Success | ❌ No | Request succeeded |
| **400** | Bad Request | ❌ No | Malformed request, invalid field |
| **401** | Unauthorized | ❌ No | Authentication failed |
| **403** | Forbidden | ❌ No | Permission denied |
| **404** | Not Found | ❌ No | Resource doesn't exist |
| **429** | Too Many Requests | ✅ Yes | Rate limit exceeded |
| **500-599** | Server Error | ✅ Yes | Temporary server issue |

### Error Type Classification

**Client Errors (4xx):**
- ❌ **Never retry** - These indicate problems with the request
- Examples: Invalid credentials, missing fields, permission issues

**Server Errors (5xx):**
- ✅ **Always retry** - These indicate temporary server issues
- Examples: Internal server error, service unavailable

**Rate Limiting (429):**
- ✅ **Always retry** - Rate limit exceeded, should retry after delay
- May include `Retry-After` header

---

## Retry Strategy

### When to Retry

**Retry on:**
- ✅ **HTTP 429** (Too Many Requests) - Rate limit exceeded
- ✅ **HTTP 5xx** (Server Errors) - Temporary server issues

**Do NOT retry on:**
- ❌ **HTTP 4xx** (Client Errors) - Bad request, authentication, permissions

### Retry Configuration

**Default Parameters:**
- **Base delay**: 500ms
- **Exponential factor**: 2
- **Maximum attempts**: 5
- **Jitter**: ±15%

**Retry Formula:**
```
delay = baseDelay * (2 ^ attempt) + jitter
```

**Example Delays:**
- Attempt 1: ~500ms
- Attempt 2: ~1000ms
- Attempt 3: ~2000ms
- Attempt 4: ~4000ms
- Attempt 5: ~8000ms

### Retry-After Header

**ServiceNow may include `Retry-After` header:**
```
Retry-After: 30
```

**Implementation:**
```typescript
const retryAfter = response.headers.get('retry-after');
if (retryAfter) {
  const retryAfterSeconds = parseInt(retryAfter, 10);
  // Use retryAfterSeconds instead of calculated delay
}
```

### Retry Implementation Example

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 5
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry 4xx errors
      if (error.statusCode >= 400 && error.statusCode < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const baseDelay = 500;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = delay * 0.15 * (Math.random() * 2 - 1);
      const totalDelay = delay + jitter;
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError!;
}
```

---

## Error Response Formats

### 4xx Client Error

**401 Unauthorized:**
```json
{
  "error": {
    "message": "User not authenticated",
    "detail": "Invalid credentials provided"
  },
  "status": "failure"
}
```

**400 Bad Request:**
```json
{
  "error": {
    "message": "Invalid field value",
    "detail": "Field 'priority' must be a valid choice value"
  },
  "status": "failure"
}
```

**403 Forbidden:**
```json
{
  "error": {
    "message": "User not authorized",
    "detail": "User does not have required role: itil"
  },
  "status": "failure"
}
```

### 429 Rate Limit

**Response:**
```json
{
  "error": {
    "message": "Rate limit exceeded",
    "detail": "Too many requests. Please retry after 30 seconds"
  },
  "status": "failure"
}
```

**Headers:**
```
Retry-After: 30
```

### 5xx Server Error

**500 Internal Server Error:**
```json
{
  "error": {
    "message": "Internal server error",
    "detail": "An unexpected error occurred"
  },
  "status": "failure"
}
```

**503 Service Unavailable:**
```json
{
  "error": {
    "message": "Service temporarily unavailable",
    "detail": "ServiceNow instance is currently unavailable"
  },
  "status": "failure"
}
```

---

## Logging Format

### Secret Redaction

**Always redact secrets in logs:**
- Passwords
- API keys
- Tokens
- Client secrets

**Redaction Pattern:**
```typescript
function redactSecrets(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };
  const secretFields = ['password', 'api_key', 'token', 'secret'];
  
  for (const field of secretFields) {
    if (redacted[field]) {
      redacted[field] = '***REDACTED***';
    }
  }
  
  return redacted;
}
```

### Logging Examples

**Success Log:**
```typescript
logger.info('Incident created', {
  sys_id: result.result.sys_id,
  number: result.result.number,
});
```

**Error Log (with redaction):**
```typescript
logger.error('Failed to create incident', {
  error: error.message,
  statusCode: error.statusCode,
  payload: redactSecrets(payload),
});
```

**Retry Log:**
```typescript
logger.warn('Retrying request', {
  attempt: attempt,
  maxAttempts: maxAttempts,
  delay: totalDelay,
  statusCode: error.statusCode,
});
```

### Log Format Standards

**Include:**
- ✅ Error message
- ✅ Status code
- ✅ Request context (redacted)
- ✅ Timestamp (automatic)
- ✅ Stack trace (development only)

**Exclude:**
- ❌ Full credentials
- ❌ API keys
- ❌ Tokens
- ❌ Passwords

---

## Common Error Scenarios

### 401 Unauthorized

**Cause:**
- Invalid credentials
- Expired password
- Wrong authentication method

**Solution:**
- Verify credentials in environment variables
- Check authentication mode (basic/oauth/apiKey)
- Ensure credentials are not expired

**Example:**
```typescript
// Check credentials
if (!config.SERVICE_NOW_USER || !config.SERVICE_NOW_PASSWORD) {
  throw new Error('ServiceNow credentials not configured');
}
```

### 403 Forbidden

**Cause:**
- Missing required roles
- Table-level ACL restrictions
- Insufficient permissions

**Solution:**
- Verify user has required roles (`web_service_admin`, `itil`, etc.)
- Check table-level ACLs in ServiceNow
- Ensure user has write access to target table

**Example:**
```typescript
// Verify roles in ServiceNow UI
// User must have: web_service_admin, itil, sn_incident_write
```

### 400 Bad Request

**Cause:**
- Invalid field value
- Missing required field
- Field type mismatch

**Solution:**
- Validate payload locally before sending
- Check field names and types
- Verify required fields are present

**Example:**
```typescript
// Validate before sending
const schema = z.object({
  short_description: z.string().min(1),
  priority: z.enum(['1', '2', '3', '4', '5']),
});
const validated = schema.parse(payload);
```

### 429 Too Many Requests

**Cause:**
- Rate limit exceeded
- Too many requests in short time

**Solution:**
- Implement retry with exponential backoff
- Respect `Retry-After` header
- Reduce request frequency

**Example:**
```typescript
// Retry logic already handles this
const result = await withRetry(() => 
  servicenowClient.create('incident', payload)
);
```

### 500 Internal Server Error

**Cause:**
- ServiceNow server issue
- PDI instance may be down
- Temporary service disruption

**Solution:**
- Retry with exponential backoff
- Check ServiceNow instance status
- Verify PDI is active (may have shut down)

**Example:**
```typescript
// Retry logic handles this
// Check instance status if retries fail
```

### 404 Not Found

**Cause:**
- Record doesn't exist
- Invalid sys_id
- Table doesn't exist

**Solution:**
- Verify sys_id is correct
- Check table name is correct
- Ensure record exists in ServiceNow

**Example:**
```typescript
// Verify record exists before updating
const existing = await servicenowClient.getTable('incident', {
  sysparm_query: `sys_id=${sysId}`,
});
if (existing.result.length === 0) {
  throw new Error('Incident not found');
}
```

---

## Best Practices

### 1. Always Validate Locally First

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

### 2. Never Retry 4xx Errors

✅ **Good:**
```typescript
if (error.statusCode >= 400 && error.statusCode < 500) {
  throw error; // Don't retry
}
```

❌ **Bad:**
```typescript
// Retrying 4xx errors wastes time
```

### 3. Always Redact Secrets in Logs

✅ **Good:**
```typescript
logger.error('Error', {
  payload: redactSecrets(payload),
});
```

❌ **Bad:**
```typescript
logger.error('Error', { payload }); // May contain secrets
```

### 4. Cap Retry Attempts

✅ **Good:**
```typescript
const maxAttempts = 5;
```

❌ **Bad:**
```typescript
// Infinite retries - may loop forever
```

### 5. Use Exponential Backoff with Jitter

✅ **Good:**
```typescript
const delay = baseDelay * Math.pow(2, attempt) + jitter;
```

❌ **Bad:**
```typescript
// Fixed delay - doesn't scale
const delay = 1000;
```

### 6. Log All Failures

✅ **Good:**
```typescript
try {
  await servicenowClient.create('incident', payload);
} catch (error) {
  logger.error('Failed to create incident', {
    error: error.message,
    statusCode: error.statusCode,
  });
  throw error;
}
```

❌ **Bad:**
```typescript
// Silent failures - hard to debug
```

---

## Cross-References

- **[ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md)** - Error handling rules
- **[ServiceNow Table API Guide](./SERVICENOW_TABLE_API_GUIDE.md)** - API usage examples
- **[ServiceNow Setup Guide](./SERVICENOW_SETUP.md)** - How to debug errors

---

**Status:** Complete error handling guide v1.0

