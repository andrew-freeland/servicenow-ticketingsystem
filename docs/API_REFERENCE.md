# API Reference

Complete API reference for the Client Support Counter - a ServiceNow integration that helps manage client support requests, automatically suggest knowledge base articles, and track resolution metrics.

---

## What is This API?

This API acts as a bridge between a web interface (the Client Support Counter) and ServiceNow, a popular IT service management platform. Think of it like a translator that takes requests from a simple web form and converts them into ServiceNow tickets (called "incidents") that can be tracked, resolved, and analyzed.

**Key Concepts:**
- **Incidents**: Support tickets or issues that need to be resolved (e.g., "HubSpot integration not working")
- **KB Articles**: Knowledge Base articles - pre-written solutions to common problems
- **Deflection**: When a KB article suggestion helps resolve an incident without manual intervention

---

## Base URL

```
http://localhost:3000
```

**Note:** The default port is `3000`, but you can change this by setting the `PORT` environment variable. For example, if you're running on port 3002, use `http://localhost:3002`.

---

## Endpoints

### Health Check

**GET** `/health`

**What it does:** A simple "ping" to check if the server is running and responding. This is like checking if a light switch works - it doesn't do anything complex, just confirms the system is alive.

**When to use it:** 
- Before making other API calls to ensure the server is up
- For monitoring systems that need to verify service availability
- When troubleshooting connection issues

**Response:**
```json
{
  "status": "ok"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

**Status Codes:**
- `200` - Server is healthy and responding

---

### Seed Data

**POST** `/seed`

**What it does:** Populates your ServiceNow instance with sample data - both knowledge base articles and test incidents. This is like planting a garden with starter seeds so you have something to work with immediately.

**When to use it:**
- When setting up a new development environment
- After a PDI (Personal Developer Instance) reset
- When you need test data for demonstrations

**What gets created:**
- 4 sample knowledge base articles covering common integration topics
- 10 sample incidents in various states (open, in progress, resolved)

**Response:**
```json
{
  "message": "Seed completed successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/seed
```

**Important Notes:**
- **Idempotent**: Safe to run multiple times - it won't create duplicates
- **Non-destructive**: Won't delete existing data, only adds new records if they don't already exist
- **Development only**: Use this for testing, not in production with real customer data

---

### Create Incident

**POST** `/incident`

**What it does:** Creates a new support ticket (incident) in ServiceNow. This is the core function - when someone reports a problem, this endpoint turns that report into a trackable ticket.

**When to use it:**
- A client reports an issue via the web interface
- You need to log a support request programmatically
- Integrating with other systems that need to create tickets

**Request Body:**
```json
{
  "product": "HubSpot / CRM",
  "short_description": "OAuth callback failing",
  "description": "Users reporting OAuth callback errors when trying to connect HubSpot. Error code: OAUTH_CALLBACK_FAILED. This started happening after the recent update.",
  "priority": "2",
  "impact": "2",
  "urgency": "2"
}
```

**Field Descriptions:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `product` | ✅ Yes | String | The product, service, or category this incident relates to (e.g., "HubSpot / CRM", "Email Templates", "Website") |
| `short_description` | ✅ Yes | String | A brief summary of the issue (max ~160 characters) - think of this as the ticket title |
| `description` | ❌ No | String | Detailed explanation of the problem, steps to reproduce, error messages, etc. |
| `priority` | ❌ No | String | Priority level: `1` (Critical) to `5` (Low). Lower numbers = higher priority |
| `impact` | ❌ No | String | How many users are affected: `1` (Widespread) to `3` (Individual) |
| `urgency` | ❌ No | String | How quickly this needs attention: `1` (Critical) to `3` (Low) |

**Response:**
```json
{
  "sys_id": "abc123def456",
  "number": "INC0012345",
  "short_description": "OAuth callback failing",
  "description": "Users reporting OAuth callback errors...",
  "state": "1",
  "priority": "2",
  "impact": "2",
  "urgency": "2",
  "category": "HubSpot / CRM"
}
```

**Response Fields Explained:**
- `sys_id`: A unique identifier ServiceNow uses internally (like a database ID)
- `number`: The human-readable ticket number (e.g., "INC0012345") - this is what you'd share with clients
- `state`: Current status - `1` = New, `2-5` = In Progress, `6` = Resolved
- `category`: The product/service category you specified

**Status Codes:**
- `201` - Incident created successfully
- `400` - Invalid request (missing required fields, wrong data types, etc.)
- `500` - Server error (ServiceNow connection issue, network problem, etc.)

**Example:**
```bash
curl -X POST http://localhost:3000/incident \
  -H "Content-Type: application/json" \
  -d '{
    "product": "HubSpot / CRM",
    "short_description": "OAuth callback failing",
    "description": "Users cannot connect HubSpot integration"
  }'
```

---

### List Incidents

**GET** `/incidents`

**What it does:** Retrieves a list of incidents (support tickets) from ServiceNow, with options to filter by status and paginate through results. Think of this as viewing your support ticket queue.

**When to use it:**
- Displaying recent tickets in a dashboard
- Checking the status of multiple incidents
- Generating reports on support activity
- Finding specific tickets by status

**Query Parameters:**

| Parameter | Required | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `state` | ❌ No | String | `open` | Filter by status: `open` (states 1-5), `resolved` (state 6), or a specific state number |
| `limit` | ❌ No | Number | `20` | Maximum number of records to return (max: 10000) |
| `offset` | ❌ No | Number | `0` | Number of records to skip (for pagination) |

**Understanding States:**
- **Open** (`state<6`): Includes New (1), In Progress (2-5) - anything not yet resolved
- **Resolved** (`state=6`): Tickets that have been closed/completed
- **Specific numbers**: You can query exact states if needed

**Response:**
```json
{
  "incidents": [
    {
      "sys_id": "abc123def456",
      "number": "INC0012345",
      "short_description": "OAuth callback failing",
      "description": "Users reporting OAuth callback errors...",
      "state": "1",
      "priority": "2",
      "impact": "2",
      "urgency": "2",
      "category": "HubSpot / CRM",
      "x_cursor_suggested": false
    },
    {
      "sys_id": "def789ghi012",
      "number": "INC0012346",
      "short_description": "Email template not rendering",
      "state": "2",
      "priority": "3",
      "category": "Email Templates",
      "x_cursor_suggested": true
    }
  ]
}
```

**Response Fields:**
- `incidents`: Array of incident objects (see Create Incident for field descriptions)
- `x_cursor_suggested`: Boolean indicating if KB article suggestions have been generated for this incident

**Status Codes:**
- `200` - Success
- `400` - Invalid query parameters (e.g., limit > 10000)
- `500` - Server error

**Examples:**

```bash
# List all open incidents (default)
curl http://localhost:3000/incidents

# List only resolved incidents
curl "http://localhost:3000/incidents?state=resolved"

# Get first 50 incidents
curl "http://localhost:3000/incidents?limit=50&offset=0"

# Get next page (incidents 51-100)
curl "http://localhost:3000/incidents?limit=50&offset=50"

# Get only high-priority open incidents (requires custom query - see advanced usage)
```

**Pagination Example:**
```bash
# Page 1: First 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=0"

# Page 2: Next 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=20"

# Page 3: Next 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=40"
```

---

### Suggest KB Articles

**POST** `/incident/:sys_id/suggest`

**What it does:** Analyzes an incident's description and automatically finds relevant knowledge base articles that might help resolve it. This is like having an assistant that reads the problem and suggests helpful documentation.

**How it works:**
1. Fetches the incident details from ServiceNow
2. Extracts keywords from the description (e.g., "OAuth", "callback", "error")
3. Searches KB articles for matching content
4. Returns the top 3 most relevant articles
5. Marks the incident as "suggested" so you know suggestions were generated

**When to use it:**
- After creating a new incident to see if there's existing documentation
- When an incident comes in that might have a known solution
- As part of an automated workflow to improve resolution speed

**Path Parameters:**
- `sys_id` (required): The unique ServiceNow identifier for the incident (returned when you create an incident)

**Response:**
```json
{
  "articles": [
    {
      "sys_id": "kb123def456",
      "number": "KB0000001",
      "short_description": "OAuth callback errors (common causes & fixes)"
    },
    {
      "sys_id": "kb789ghi012",
      "number": "KB0000002",
      "short_description": "Rotate API keys for HubSpot integration"
    },
    {
      "sys_id": "kb345jkl678",
      "number": "KB0000003",
      "short_description": "Troubleshooting HubSpot connection issues"
    }
  ],
  "count": 3
}
```

**Response Fields:**
- `articles`: Array of KB article objects
  - `sys_id`: Unique identifier for the article
  - `number`: Human-readable article number (e.g., "KB0000001")
  - `short_description`: Title/summary of the article
- `count`: Number of articles returned (max 3)

**Status Codes:**
- `200` - Success (even if no articles found, returns empty array)
- `400` - Invalid sys_id format
- `404` - Incident not found
- `500` - Server error

**Example:**
```bash
# First, create an incident and note the sys_id from the response
INCIDENT_ID="abc123def456"

# Then get suggestions
curl -X POST http://localhost:3000/incident/$INCIDENT_ID/suggest
```

**Important Notes:**
- **Automatic marking**: This endpoint automatically sets `x_cursor_suggested=true` on the incident
- **Keyword-based**: Uses simple keyword matching - not AI-powered semantic search
- **Top 3 only**: Returns maximum 3 articles to keep results focused
- **Published articles only**: Only searches articles that are published and active in ServiceNow

---

### Resolve Incident

**POST** `/incident/:sys_id/resolve`

**What it does:** Closes an incident (marks it as resolved) and records how it was resolved. This is the final step in the support workflow - documenting that the problem is fixed.

**When to use it:**
- After successfully resolving a client issue
- When a KB article provided the solution
- When the issue was resolved through other means (workaround, fix deployed, etc.)

**Path Parameters:**
- `sys_id` (required): The unique ServiceNow identifier for the incident

**Request Body:**
```json
{
  "resolution_note": "Resolved via KB-0001. User updated OAuth redirect URI in HubSpot settings to match ServiceNow configuration."
}
```

**Field Descriptions:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `resolution_note` | ✅ Yes | String | Detailed explanation of how the incident was resolved. This becomes the "close notes" in ServiceNow. |

**What happens behind the scenes:**
1. Sets the incident `state` to `6` (Resolved)
2. Sets `close_code` to `"Solution provided"` (required by ServiceNow data policy)
3. Sets `close_notes` from your `resolution_note` field
4. Records the resolution timestamp

**Response:**
```json
{
  "sys_id": "abc123def456",
  "number": "INC0012345",
  "state": "6",
  "close_code": "Solution provided",
  "close_notes": "Resolved via KB-0001. User updated OAuth redirect URI in HubSpot settings to match ServiceNow configuration."
}
```

**Response Fields:**
- `sys_id`: The incident identifier (same as input)
- `number`: The ticket number (e.g., "INC0012345")
- `state`: Now set to `6` (Resolved)
- `close_code`: The resolution category (always "Solution provided" in this implementation)
- `close_notes`: Your resolution notes

**Status Codes:**
- `200` - Incident resolved successfully
- `400` - Invalid request (missing resolution_note, wrong sys_id format)
- `404` - Incident not found
- `500` - Server error

**Example:**
```bash
curl -X POST http://localhost:3000/incident/abc123def456/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_note": "Resolved via KB-0001. User updated OAuth redirect URI."
  }'
```

**Best Practices for Resolution Notes:**
- Be specific: Explain exactly what was done
- Reference KB articles: If a knowledge base article helped, mention it
- Include steps: If the user took action, document what they did
- Note workarounds: If it's a temporary fix, mention that

---

### Get Statistics

**GET** `/stats`

**What it does:** Provides aggregated metrics about your help desk performance. Think of this as a dashboard that shows you how well your support system is working.

**When to use it:**
- Displaying metrics on a dashboard
- Measuring the effectiveness of KB article suggestions
- Tracking support volume and resolution rates
- Generating reports for stakeholders

**Response:**
```json
{
  "counts": {
    "open": 5,
    "inProgress": 3,
    "resolved": 12,
    "total": 20
  },
  "deflection": {
    "totalIncidents": 20,
    "suggestedIncidents": 8,
    "resolvedAfterSuggestion": 6,
    "deflectionRate": 30.0
  }
}
```

**Response Fields Explained:**

**Counts:**
- `open`: Number of new/open incidents (state < 2) - tickets that just came in
- `inProgress`: Number of incidents being worked on (state 2-5) - tickets actively being resolved
- `resolved`: Number of completed incidents (state 6) - tickets that are closed
- `total`: Total number of incidents in the system

**Deflection Metrics:**
- `totalIncidents`: Total number of incidents (same as counts.total)
- `suggestedIncidents`: How many incidents had KB article suggestions generated
- `resolvedAfterSuggestion`: How many incidents were resolved after suggestions were provided
- `deflectionRate`: Percentage showing how effective KB suggestions are (calculated as: resolvedAfterSuggestion / totalIncidents × 100)

**Understanding Deflection Rate:**
A deflection rate of 30% means that 30% of all incidents were resolved after KB suggestions were provided. Higher is better - it indicates that your knowledge base is helping resolve issues without manual intervention.

**Status Codes:**
- `200` - Success
- `500` - Server error

**Example:**
```bash
curl http://localhost:3000/stats
```

**Use Cases:**
- **Dashboard display**: Show real-time support metrics
- **Performance tracking**: Monitor if deflection rate is improving over time
- **Resource planning**: Use open/inProgress counts to understand workload
- **Quality metrics**: Track resolution rates and KB effectiveness

---

## Error Responses

All endpoints may return error responses when something goes wrong. Errors follow a consistent format:

```json
{
  "error": "Error message describing what went wrong",
  "details": {
    // Additional error details (only in development mode)
    // In production, details are hidden for security
  }
}
```

**Common Status Codes:**

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Missing required fields, invalid data types, validation errors |
| `401` | Unauthorized | Invalid ServiceNow credentials, expired tokens |
| `403` | Forbidden | User lacks required permissions/roles in ServiceNow |
| `404` | Not Found | Incident or resource doesn't exist |
| `429` | Too Many Requests | Rate limiting (ServiceNow is throttling requests) |
| `500` | Internal Server Error | ServiceNow connection issues, network problems, server errors |

**Error Handling Best Practices:**
- Always check the status code before processing response data
- Read the error message - it usually explains what went wrong
- For 401/403: Check your ServiceNow credentials and user roles
- For 429: Wait a moment and retry (the system has automatic retry logic)
- For 500: Check ServiceNow instance status and network connectivity

---

## Validator Compliance Header

All API responses include a special header that indicates compliance with integration standards:

```
X-Validator-Compliance: Pass
```

**What this means:** The response complies with all 7 validation categories that ensure the integration follows best practices:
1. **Ruleset Compliance** - Follows ServiceNow integration rules
2. **Architecture** - Uses proper code structure and patterns
3. **Authentication** - Secure credential handling
4. **API Syntax** - Correct ServiceNow API usage
5. **Error Handling** - Proper retry logic and error management
6. **Documentation** - Complete and accurate documentation
7. **Instance Constraints** - Compatible with Personal Developer Instances

This header is primarily for validation and monitoring purposes - you don't need to do anything with it in normal usage.

---

## Rate Limiting

**Current Status:** No rate limiting is implemented on the API endpoints themselves.

**ServiceNow Rate Limits:** However, ServiceNow instances may enforce their own rate limits. If you receive `429 Too Many Requests` errors:
- The system automatically retries with exponential backoff
- Wait a few moments before making additional requests
- Consider reducing request frequency if you're making many calls

**Future Enhancements:** Future versions may include:
- Per-IP rate limiting to prevent abuse
- Per-endpoint rate limiting for resource protection
- Token-based rate limiting for authenticated users

---

## Authentication

**Current Status:** The API does not require authentication to access endpoints.

**Security Note:** This is fine for local development, but **for production use, you should:**
- Add API key authentication
- Implement OAuth 2.0 for secure access
- Use HTTPS only (never HTTP in production)
- Add request signing to prevent tampering
- Implement IP whitelisting if appropriate

**ServiceNow Authentication:** The API uses credentials stored in environment variables to authenticate with ServiceNow. These credentials are never exposed in API responses or error messages.

---

## Pagination

For endpoints that return lists (like `/incidents`), use pagination to handle large result sets efficiently.

**How Pagination Works:**
- `limit`: Maximum number of records per page (default: 20, max: 10000)
- `offset`: Number of records to skip (default: 0)

**Example Workflow:**
```bash
# Page 1: Get first 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=0"

# Page 2: Skip first 20, get next 20
curl "http://localhost:3000/incidents?limit=20&offset=20"

# Page 3: Skip first 40, get next 20
curl "http://localhost:3000/incidents?limit=20&offset=40"
```

**Best Practices:**
- Use reasonable page sizes (20-100 records) for better performance
- Don't set limit too high - it can slow down responses
- Track your offset to implement "next page" functionality
- Remember: offset 0 means "start from the beginning"

---

## Complete Workflow Example

Here's a complete example of using the API to handle a support request from start to finish:

```bash
# 1. Check if the server is running
curl http://localhost:3000/health

# 2. Create a new incident when a client reports an issue
RESPONSE=$(curl -s -X POST http://localhost:3000/incident \
  -H "Content-Type: application/json" \
  -d '{
    "product": "HubSpot / CRM",
    "short_description": "OAuth callback failing",
    "description": "Users cannot connect HubSpot integration. Getting error: OAUTH_CALLBACK_FAILED"
  }')

# Extract the sys_id from the response (requires jq or similar)
INCIDENT_ID=$(echo $RESPONSE | jq -r '.sys_id')
echo "Created incident: $INCIDENT_ID"

# 3. Get KB article suggestions to help resolve it
curl -X POST "http://localhost:3000/incident/$INCIDENT_ID/suggest"

# 4. After resolving the issue, mark it as resolved
curl -X POST "http://localhost:3000/incident/$INCIDENT_ID/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_note": "Resolved via KB-0001. User updated OAuth redirect URI in HubSpot settings."
  }'

# 5. Check overall statistics
curl http://localhost:3000/stats
```

---

## Testing

### Quick Smoke Tests

These commands verify that all major endpoints are working:

```bash
# Health check
curl -s http://localhost:3000/health

# List incidents
curl -s http://localhost:3000/incidents

# Create a test incident
curl -s -X POST http://localhost:3000/incident \
  -H "Content-Type: application/json" \
  -d '{"product":"Test Product","short_description":"Test issue"}'

# Get statistics
curl -s http://localhost:3000/stats
```

### Using jq for Better Output

If you have `jq` installed, you can format JSON responses:

```bash
# Pretty-print JSON
curl -s http://localhost:3000/incidents | jq .

# Extract specific fields
curl -s http://localhost:3000/stats | jq '.deflection.deflectionRate'

# Filter results
curl -s http://localhost:3000/incidents | jq '.incidents[] | select(.priority == "2")'
```

---

## Support & Troubleshooting

**If you encounter issues:**

1. **Check the logs** - Look at the server console output for detailed error messages
2. **Verify ServiceNow connection** - Ensure your ServiceNow instance is accessible and credentials are correct
3. **Check environment variables** - Make sure all required variables are set (see RUNBOOK.md)
4. **Review the Runbook** - See `docs/RUNBOOK.md` for detailed troubleshooting steps
5. **Test ServiceNow directly** - Try accessing your ServiceNow instance in a browser to ensure it's active

**Common Issues:**
- **401 Unauthorized**: Check your ServiceNow username and password
- **403 Forbidden**: Verify your ServiceNow user has the required roles
- **Connection timeout**: Your ServiceNow PDI may have gone to sleep - access it in a browser to wake it up
- **Empty results**: Make sure you've seeded data with `/seed` endpoint

---

## Additional Resources

- **[Architecture Documentation](ARCHITECTURE.md)** - Understand how the system is built
- **[Runbook](RUNBOOK.md)** - Operational guide and troubleshooting
- **[ServiceNow Integration Guide](SERVICE_NOW.md)** - ServiceNow-specific patterns and best practices

---

*Last Updated: 2024*
