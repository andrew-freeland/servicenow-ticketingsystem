# Architecture Overview

This document describes the architecture of the Client Support Counter - a ServiceNow integration system that helps manage client support requests, automatically suggest knowledge base articles, and track resolution metrics.

---

## What is This System?

The Client Support Counter is a **web application** that acts as a bridge between a simple web interface and ServiceNow (an IT service management platform). Think of it like a translator that:

1. **Receives requests** from a web form (e.g., "Client X has an issue with HubSpot")
2. **Converts them** into ServiceNow tickets (called "incidents")
3. **Suggests solutions** by searching knowledge base articles
4. **Tracks metrics** to measure how effective the support system is

**Key Components:**
- **Web Server**: Handles HTTP requests from browsers
- **ServiceNow Client**: Communicates with ServiceNow's API
- **Business Logic**: Processes requests, suggests articles, calculates metrics
- **Validation**: Ensures data is correct before sending to ServiceNow

---

## Module Map

Here's how the code is organized:

```
servicenow-playground/
├── config/
│   └── env.ts                    # Environment configuration (credentials, settings)
├── src/
│   ├── index.ts                   # Web server entry point (handles HTTP requests)
│   ├── clients/
│   │   └── servicenow.ts         # ServiceNow API client (talks to ServiceNow)
│   ├── utils/
│   │   ├── logger.ts             # Logging utility (records what happens)
│   │   ├── retry.ts              # Retry logic (handles temporary failures)
│   │   └── validation.ts         # Data validation (ensures data is correct)
│   ├── seed/
│   │   └── seed-docsdesk.ts      # Seed script (creates test data)
│   └── docsdesk/
│       ├── intake.ts             # Incident creation and listing
│       ├── kb.ts                 # Knowledge base article suggestions
│       ├── resolve.ts            # Incident resolution
│       └── stats.ts              # Statistics and metrics
└── docs/
    ├── SERVICE_NOW.md            # ServiceNow integration guide
    ├── ARCHITECTURE.md           # This file
    ├── API_REFERENCE.md          # API endpoint documentation
    └── RUNBOOK.md                # Operational guide
```

**Understanding the Structure:**
- **config/**: Configuration files (like settings)
- **src/**: Source code (the actual application)
- **clients/**: Code that talks to external services (ServiceNow)
- **utils/**: Helper functions used throughout the app
- **docsdesk/**: Business logic for the help desk features
- **docs/**: Documentation files

---

## Request Flow

Here's how a request flows through the system:

### 1. Incident Intake Flow

**What happens when someone creates a support ticket:**

```
Web Browser (User fills out form)
    ↓
HTTP Server (index.ts) - Receives the request
    ↓
Validation (validation.ts) - Checks if data is valid
    ↓
Intake Module (intake.ts) - Prepares the incident
    ↓
ServiceNow Client (servicenow.ts) - Formats the request
    ↓
Retry Logic (retry.ts) - Handles temporary failures
    ↓
ServiceNow Table API - Creates the incident
    ↓
Response flows back through the chain
    ↓
Web Browser (User sees confirmation)
```

**In Plain English:**
1. User fills out a form on the website
2. Server receives the form data
3. System checks if all required fields are filled
4. System prepares the data for ServiceNow
5. System sends the data to ServiceNow
6. If ServiceNow is busy, system waits and tries again
7. ServiceNow creates the ticket
8. System sends confirmation back to the user

### 2. KB Suggestion Flow

**What happens when the system suggests knowledge base articles:**

```
User clicks "Get Suggestions" or system auto-suggests
    ↓
HTTP Server receives request
    ↓
KB Module (kb.ts) starts working
    ↓
1. Fetches incident details from ServiceNow
    ↓
2. Extracts keywords from description
   (e.g., "OAuth", "callback", "error")
    ↓
3. Searches KB articles using those keywords
    ↓
4. Finds top 3 most relevant articles
    ↓
5. Marks incident as "suggested"
    ↓
6. Returns articles to user
```

**In Plain English:**
1. System looks at the incident description
2. Picks out important words (like "OAuth" or "error")
3. Searches knowledge base for articles with those words
4. Finds the 3 best matches
5. Marks that suggestions were provided (for tracking)
6. Shows the articles to the user

**Keyword Extraction:**
- Takes the incident description
- Removes common words (like "the", "and", "is")
- Keeps important technical terms
- Uses those terms to search KB articles

### 3. Resolution Flow

**What happens when an incident is resolved:**

```
User marks incident as resolved
    ↓
HTTP Server receives request
    ↓
Validation checks resolution note is provided
    ↓
Resolve Module (resolve.ts) prepares update
    ↓
ServiceNow Client sends update
    ↓
ServiceNow updates incident:
  - Sets state to "Resolved" (6)
  - Sets close code to "Solution provided"
  - Records resolution notes
    ↓
Confirmation sent back to user
```

**In Plain English:**
1. User indicates the problem is fixed
2. System checks that a resolution note was provided
3. System tells ServiceNow to mark the ticket as resolved
4. ServiceNow updates the ticket status
5. System confirms the update to the user

### 4. Statistics Flow

**What happens when viewing help desk statistics:**

```
User requests statistics
    ↓
HTTP Server receives request
    ↓
Stats Module (stats.ts) starts calculation
    ↓
1. Fetches all incidents from ServiceNow
   (with pagination for large datasets)
    ↓
2. Counts incidents by state:
   - Open (state < 2)
   - In Progress (state 2-5)
   - Resolved (state 6)
    ↓
3. Calculates deflection metrics:
   - How many had suggestions
   - How many were resolved after suggestions
   - Deflection rate percentage
    ↓
4. Returns aggregated statistics
```

**In Plain English:**
1. System gets all tickets from ServiceNow
2. Groups them by status (open, in progress, resolved)
3. Calculates how effective KB suggestions are
4. Returns the numbers to display on a dashboard

**Deflection Rate Calculation:**
- Deflection = (Resolved after suggestion / Total incidents) × 100
- Example: 6 resolved after suggestion out of 20 total = 30% deflection rate
- Higher is better - means KB articles are helping resolve issues

---

## Component Responsibilities

### Configuration (`config/env.ts`)

**What it does:** Loads and validates environment variables (like credentials and settings).

**Key Features:**
- Reads from `.env` file
- Validates that required variables are present
- Provides typed configuration object
- Exits with error if required variables are missing

**Environment Variables:**
- `SERVICE_NOW_INSTANCE`: Your ServiceNow URL
- `SERVICE_NOW_USER`: Username for API access
- `SERVICE_NOW_PASSWORD`: Password for API access
- `PORT`: Port for web server
- `NODE_ENV`: Environment mode (development/production)
- `AUTH_MODE`: Authentication type (basic/oauth/apiKey)

**Why it matters:** Centralizes all configuration in one place, makes it easy to change settings without modifying code.

### ServiceNow Client (`src/clients/servicenow.ts`)

**What it does:** Wraps ServiceNow's Table API - handles all communication with ServiceNow.

**Key Features:**
- Handles authentication (Basic Auth, OAuth, API Key)
- Implements retry logic for temporary failures
- Provides typed methods: `getTable`, `create`, `patch`, `del`
- Builds query strings and handles pagination
- Formats requests according to ServiceNow's API requirements

**Methods:**
- `getTable()`: Fetch records from a ServiceNow table
- `create()`: Create a new record
- `patch()`: Update an existing record
- `del()`: Delete a record

**Why it matters:** Abstracts away the complexity of ServiceNow's API - other parts of the code don't need to know ServiceNow's specific requirements.

**Understanding the API Wrapper:**
- Think of it as a translator
- Your code says "create an incident"
- The wrapper converts that to ServiceNow's format
- ServiceNow understands and responds
- The wrapper converts the response back to a simple format

### Utilities

#### Logger (`src/utils/logger.ts`)

**What it does:** Records what happens in the application (events, errors, etc.).

**Key Features:**
- Development: Human-readable console logs
- Production: JSON-formatted logs (easier to parse)
- Automatically redacts secrets (passwords, tokens, etc.)
- Different log levels (info, error, warn, debug)

**Why it matters:** Helps debug issues and monitor system health without exposing sensitive information.

**Security Feature:** Automatically hides passwords and tokens in logs - even if you accidentally log them, they won't appear in the output.

#### Retry (`src/utils/retry.ts`)

**What it does:** Automatically retries failed requests with smart timing.

**Key Features:**
- Exponential backoff (waits longer each retry: 1s, 2s, 4s, 8s...)
- Adds jitter (random variation) to prevent "thundering herd" problem
- Only retries on 429/5xx errors (temporary failures)
- Never retries on 4xx errors (permanent failures like wrong password)
- Configurable: base delay, factor, max attempts, jitter

**Why it matters:** ServiceNow (and many APIs) can be temporarily unavailable or rate-limited. Retry logic handles this automatically instead of failing immediately.

**Understanding Exponential Backoff:**
- First retry: Wait 1 second
- Second retry: Wait 2 seconds
- Third retry: Wait 4 seconds
- And so on...
- This gives the server time to recover
- Prevents overwhelming a struggling server

#### Validation (`src/utils/validation.ts`)

**What it does:** Ensures data is correct before processing.

**Key Features:**
- Uses Zod (a TypeScript validation library)
- Validates request payloads
- Validates query parameters
- Provides clear error messages if validation fails

**Schemas:**
- `IncidentCreateSchema`: Validates incident creation requests
- `ResolveRequestSchema`: Validates resolution requests
- `ListIncidentsQuerySchema`: Validates query parameters
- `SuggestRequestSchema`: Validates KB suggestion requests

**Why it matters:** Prevents bad data from reaching ServiceNow, which could cause errors or create invalid records.

**Example:**
- If someone tries to create an incident without a description
- Validation catches this before sending to ServiceNow
- Returns a clear error: "short_description is required"
- User can fix it immediately

### Help Desk Modules

#### Intake (`src/docsdesk/intake.ts`)

**What it does:** Handles creating and listing incidents.

**Functions:**
- `createIncident()`: Creates new incidents in ServiceNow
- `listIncidents()`: Retrieves incidents with filtering and pagination

**Key Features:**
- Maps request fields to ServiceNow fields
- Handles state filtering (open, resolved, etc.)
- Supports pagination for large result sets
- Logs all operations for debugging

**Why it matters:** Centralizes incident management logic - if you need to change how incidents are created, you only change this one file.

#### KB (`src/docsdesk/kb.ts`)

**What it does:** Suggests knowledge base articles based on incident descriptions.

**Functions:**
- `suggestArticles()`: Finds relevant KB articles for an incident

**How it works:**
1. Fetches incident details
2. Extracts keywords from description
3. Builds ServiceNow query to search KB articles
4. Returns top 3 most relevant articles
5. Marks incident as "suggested"

**Keyword Extraction:**
- Simple keyword matching (not AI-powered)
- Extracts technical terms from description
- Removes common words
- Uses those terms to search KB articles

**Why it matters:** Helps resolve incidents faster by suggesting existing solutions.

#### Resolve (`src/docsdesk/resolve.ts`)

**What it does:** Closes incidents and records how they were resolved.

**Functions:**
- `resolveIncident()`: Marks incidents as resolved in ServiceNow

**Key Features:**
- Sets state to 6 (Resolved)
- Sets close code (required by ServiceNow)
- Records resolution notes
- Handles ServiceNow's data policy requirements

**Why it matters:** Properly closes incidents according to ServiceNow's requirements, ensuring data integrity.

#### Stats (`src/docsdesk/stats.ts`)

**What it does:** Calculates help desk metrics and performance statistics.

**Functions:**
- `getStats()`: Calculates aggregated metrics

**Metrics Calculated:**
- Count by state (open, in-progress, resolved)
- Deflection rate (how effective KB suggestions are)
- Total incident counts

**Why it matters:** Provides insights into support performance - helps identify areas for improvement.

### Seed Script (`src/seed/seed-docsdesk.ts`)

**What it does:** Creates sample data for testing and development.

**What it creates:**
- 4 knowledge base articles (sample documentation)
- 10 incidents (various states and priorities)

**Key Features:**
- **Idempotent**: Safe to run multiple times
- Checks for existing records before creating
- Won't create duplicates
- Useful for development and demos

**Why it matters:** Quickly sets up a test environment with realistic data.

### HTTP Server (`src/index.ts`)

**What it does:** Handles all HTTP requests and routes them to the right handlers.

**Key Features:**
- Express.js web server
- All routes include validator compliance header
- Error handling middleware
- Request validation using Zod schemas
- Secret redaction in error responses
- Serves the web interface at root (`/`)

**Routes:**
- `GET /`: Web interface (Client Support Counter UI)
- `GET /health`: Health check
- `POST /seed`: Seed data
- `POST /incident`: Create incident
- `GET /incidents`: List incidents
- `POST /incident/:sys_id/suggest`: Get KB suggestions
- `POST /incident/:sys_id/resolve`: Resolve incident
- `GET /stats`: Get statistics

**Why it matters:** The entry point for all requests - coordinates everything else.

---

## Design Decisions

### 1. Modular Architecture

**Decision:** Each module has a single, clear responsibility.

**Why:**
- **Separation of concerns**: Each piece does one thing well
- **Easy testing**: Can test each module independently
- **Hot-swappable components**: Can replace one module without affecting others
- **Maintainability**: Easier to understand and modify

**Example:**
- Intake module only handles incidents
- KB module only handles knowledge base
- Stats module only calculates metrics
- If you need to change how incidents work, you only touch the intake module

### 2. Type Safety

**Decision:** Use TypeScript with strict mode and Zod for runtime validation.

**Why:**
- **Catches errors early**: TypeScript finds errors before code runs
- **Better IDE support**: Autocomplete and error detection
- **Runtime safety**: Zod validates data at runtime (TypeScript only checks at compile time)
- **Documentation**: Types serve as documentation

**Example:**
- TypeScript knows `createIncident()` expects an `IncidentCreate` object
- If you pass the wrong type, TypeScript shows an error
- Zod validates the data actually matches that type at runtime
- Prevents bugs from reaching production

### 3. Error Handling

**Decision:** Retry only for retryable errors (429/5xx), never retry client errors (4xx).

**Why:**
- **429/5xx are temporary**: Server is busy or having issues - retry makes sense
- **4xx are permanent**: Wrong password, missing field, etc. - retrying won't help
- **Prevents infinite loops**: Don't retry errors that will never succeed
- **Better user experience**: Fail fast on permanent errors, retry on temporary ones

**Example:**
- ServiceNow returns 429 (rate limited) → System waits and retries
- ServiceNow returns 401 (wrong password) → System fails immediately (no point retrying)

### 4. Authentication

**Decision:** Switchable auth modes (basic, oauth, apiKey) with default to Basic Auth.

**Why:**
- **Flexibility**: Can use different auth methods for different environments
- **Lowest friction**: Basic Auth is simplest to set up
- **Production ready**: Can switch to OAuth for production
- **All credentials from environment**: No hardcoded secrets

**Example:**
- Development: Use Basic Auth (username/password) - simple
- Production: Switch to OAuth (more secure) - just change `AUTH_MODE`

### 5. Pagination

**Decision:** Respects 10,000 record limit, uses `sysparm_limit` and `sysparm_offset`.

**Why:**
- **ServiceNow limit**: Can't fetch more than 10,000 records at once
- **Performance**: Smaller pages load faster
- **Memory efficiency**: Don't load everything into memory at once
- **Supports incremental syncs**: Can use `sys_updated_on` to only get changed records

**Example:**
- Fetch 20 incidents at a time
- Use offset to get next 20
- Much faster than fetching all 10,000 at once

### 6. Idempotency

**Decision:** Seed script checks for existing records before creating.

**Why:**
- **Safe to rerun**: Won't create duplicates
- **Recovery friendly**: Can rerun after PDI reset
- **No side effects**: Running multiple times has same effect as running once

**Example:**
- Run `pnpm seed` → Creates 4 KB articles, 10 incidents
- Run `pnpm seed` again → Skips existing records, only creates missing ones
- Same result either way

---

## Data Flow Example

### Creating an Incident

**Step-by-step:**

1. **Client** sends POST `/incident` with payload:
   ```json
   {
     "product": "HubSpot / CRM",
     "short_description": "OAuth callback failing"
   }
   ```

2. **Server** validates payload using `IncidentCreateSchema`:
   - Checks required fields are present
   - Validates data types
   - Returns 400 error if validation fails

3. **Intake module** calls `createIncident()`:
   - Maps request fields to ServiceNow fields
   - Prepares the payload

4. **ServiceNow client** builds request:
   - URL: `https://instance.service-now.com/api/now/table/incident`
   - Method: POST
   - Headers: Authorization, User-Agent, Content-Type
   - Body: Validated payload

5. **Retry logic** handles 429/5xx errors automatically:
   - If ServiceNow is busy, waits and retries
   - Uses exponential backoff

6. **ServiceNow** returns created incident:
   ```json
   {
     "sys_id": "abc123",
     "number": "INC0012345",
     "state": "1"
   }
   ```

7. **Response** sent to client with validator header:
   - Includes compliance header
   - Returns incident details

### Suggesting KB Articles

**Step-by-step:**

1. **Client** sends POST `/incident/:sys_id/suggest`

2. **KB module** fetches incident details:
   - Gets description and other fields
   - Extracts keywords: "OAuth", "callback", "failing"

3. **Keyword extraction** from description:
   - Removes common words
   - Keeps technical terms

4. **Query building** for KB articles:
   - `sysparm_query=active=true^workflow_state=published^short_descriptionLIKEOAuth`
   - Searches for articles matching keywords

5. **ServiceNow client** queries `kb_knowledge` table:
   - Sends query to ServiceNow
   - Gets matching articles

6. **Incident update** sets `x_cursor_suggested=true`:
   - Marks that suggestions were provided
   - Used for deflection rate calculation

7. **Response** returns top 3 articles:
   - Sorted by relevance
   - Limited to 3 to keep results focused

---

## Security Considerations

### 1. Secret Redaction

**What:** All logs automatically hide passwords, tokens, and secrets.

**Why:** Prevents accidental exposure of sensitive information in logs.

**How:** Logger utility detects common secret patterns and replaces them with `[REDACTED]`.

### 2. Environment Variables

**What:** No hardcoded credentials - everything comes from environment variables.

**Why:** 
- Easy to change without modifying code
- Different credentials for different environments
- Never committed to version control

### 3. Input Validation

**What:** All inputs validated with Zod before processing.

**Why:**
- Prevents bad data from reaching ServiceNow
- Prevents injection attacks
- Provides clear error messages

### 4. Error Messages

**What:** Production errors don't expose internal details.

**Why:**
- Prevents information leakage
- Hides system internals from attackers
- Still provides useful info in development

### 5. Least Privilege

**What:** Uses `web_service_admin` + specific roles, not global admin.

**Why:**
- Limits damage if credentials are compromised
- Follows security best practices
- Only grants permissions actually needed

---

## Testing Strategy

### 1. Unit Tests

**What:** Test individual modules in isolation.

**Example:** Test that `createIncident()` correctly formats data for ServiceNow.

### 2. Integration Tests

**What:** Test ServiceNow client with mock responses.

**Example:** Test that retry logic works when ServiceNow returns 429.

### 3. E2E Tests

**What:** Test full request flows.

**Example:** Test creating an incident, getting suggestions, and resolving it.

### 4. Seed Script

**What:** Provides test data for development.

**Example:** Creates realistic incidents and KB articles for testing.

---

## Future Enhancements

**Potential improvements:**

- **Webhook support**: Real-time updates when incidents change
- **Caching layer**: Cache KB articles to reduce API calls
- **Rate limiting**: Protect API endpoints from abuse
- **Metrics dashboard**: Visual display of statistics
- **Batch operations**: Create/update multiple incidents at once
- **AI-powered suggestions**: Use semantic search instead of keyword matching
- **Multi-tenant support**: Support multiple ServiceNow instances
- **Audit logging**: Track all operations for compliance

---

## Summary

The Client Support Counter is built with:

- **Modular architecture**: Each component has a clear responsibility
- **Type safety**: TypeScript + Zod prevent errors
- **Smart error handling**: Retries temporary failures, fails fast on permanent errors
- **Security first**: Secrets redacted, least privilege, input validation
- **Developer friendly**: Easy to test, maintain, and extend

The system is designed to be:
- **Reliable**: Handles failures gracefully
- **Secure**: Protects sensitive information
- **Maintainable**: Easy to understand and modify
- **Scalable**: Can handle growth with pagination and optimization

---

*Last Updated: 2024*
