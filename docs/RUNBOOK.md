# Runbook

Operational guide for running and maintaining the Client Support Counter - a ServiceNow integration that helps manage client support requests.

---

## What is This System?

The Client Support Counter is a web-based tool that connects to ServiceNow (an IT service management platform) to:
- **Create support tickets** when clients report issues
- **Suggest knowledge base articles** that might help resolve problems
- **Track resolution metrics** to measure how effective your support system is

Think of it as a simplified help desk interface that talks to ServiceNow behind the scenes.

---

## Prerequisites

### ServiceNow PDI Setup

A **PDI (Personal Developer Instance)** is a free ServiceNow environment for development and testing. It's like having your own private ServiceNow server to experiment with.

**1. Create ServiceNow PDI**
   - Go to [developer.servicenow.com](https://developer.servicenow.com)
   - Sign up for a free account (if you don't have one)
   - Create a new Personal Developer Instance
   - Wait for it to be provisioned (usually takes a few minutes)
   - Note your instance URL (e.g., `https://dev12345.service-now.com`)

**2. Create Service Account User**
   - In your ServiceNow instance, go to **User Administration > Users**
   - Click "New" to create a new user
   - Username: Something like `sn_api` or `api_user`
   - Set a secure password (save this - you'll need it)
   - Email: Use a real email (required)
   - Click "Submit"

**3. Assign Required Roles**
   - Still in the user record, scroll to the "Roles" section
   - Click the "+" icon to add roles
   - Add these roles (one at a time):
     - `web_service_admin` - Allows API access (required)
     - `itil` - Allows access to incident table (required)
     - `kb_admin` or `kb_knowledge_base` - Allows access to knowledge base articles (required)
   - **Important:** Never use the `admin` role unless absolutely necessary - it's a security risk
   - Click "Save"

**4. Create Custom Field (Optional)**
   - Go to **System Definition > Tables**
   - Search for and open the `incident` table
   - Click "New" in the "Columns" section
   - Field name: `x_cursor_suggested`
   - Type: Boolean (true/false)
   - Label: "KB Suggested"
   - Click "Submit"
   - This field tracks whether KB suggestions have been generated for an incident

**Understanding Roles:**
- **Roles** in ServiceNow are like permissions - they control what a user can do
- `web_service_admin` = "This user can use the API"
- `itil` = "This user can work with support tickets"
- `kb_admin` = "This user can access knowledge base articles"

---

## Local Setup

### 1. Install Dependencies

**What you need:**
- Node.js 18 or higher (check with `node --version`)
- pnpm package manager (install with `npm install -g pnpm`)

**Install project dependencies:**
```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Install all project dependencies
pnpm install
```

**What this does:** Downloads all the code libraries this project needs to run (like Express for the web server, TypeScript for type checking, etc.)

### 2. Configure Environment

**Create environment file:**
```bash
# Copy the example file (if it exists)
cp .env.example .env

# Or create a new .env file
touch .env
```

**Edit `.env` with your ServiceNow credentials:**
```env
# Your ServiceNow instance URL (no trailing slash)
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com

# The service account username you created
SERVICE_NOW_USER=sn_api

# The password for that user
SERVICE_NOW_PASSWORD=your-secure-password

# Port for the web server (default: 3000)
PORT=3000

# Environment mode (development or production)
NODE_ENV=development

# Authentication mode (basic, oauth, or apiKey)
AUTH_MODE=basic
```

**Security Note:** 
- **Never commit `.env` to version control** (it's already in `.gitignore`)
- **Never share your `.env` file** - it contains sensitive credentials
- **Use different credentials for production** than development

**Understanding the Settings:**
- `SERVICE_NOW_INSTANCE`: The web address of your ServiceNow PDI
- `SERVICE_NOW_USER`: The username of the service account (the one with API roles)
- `SERVICE_NOW_PASSWORD`: The password for that account
- `PORT`: Which port the web server runs on (3000 is common, but you can use 3002, 8080, etc.)
- `AUTH_MODE`: How to authenticate with ServiceNow (start with "basic" - it's simplest)

### 3. Verify Configuration

**Check for errors:**
```bash
# Type check - ensures TypeScript code is valid
pnpm typecheck

# Build - compiles TypeScript to JavaScript
pnpm build
```

**If you see errors:**
- Type check errors usually mean code issues - check the error messages
- Build errors might indicate missing dependencies - try `pnpm install` again

---

## Running the Application

### Development Mode

**Start the development server:**
```bash
pnpm dev
```

**What this does:**
- Starts the web server on `http://localhost:3000` (or your configured port)
- Watches for file changes and automatically restarts
- Shows detailed error messages and logs

**You should see:**
```
Docs & Integrations Help Desk server running on port 3000
Environment: development
ServiceNow instance: https://dev12345.service-now.com
```

**Access the web interface:**
- Open your browser to `http://localhost:3000`
- You should see the Client Support Counter interface

**To stop the server:**
- Press `Ctrl+C` in the terminal

### Production Mode

**For production deployment:**
```bash
# First, compile the TypeScript code
pnpm build

# Then start the production server
pnpm start
```

**Differences from development:**
- No automatic restarts on file changes
- Less verbose error messages (for security)
- Optimized performance
- Usually runs on a different port (set via `PORT` environment variable)

### Seed Data

**Populate ServiceNow with sample data:**
```bash
pnpm seed
```

**What this creates:**
- 4 knowledge base articles (sample documentation)
- 10 test incidents (various states and priorities)

**Important Notes:**
- **Idempotent**: Safe to run multiple times - won't create duplicates
- **Non-destructive**: Won't delete existing data
- **Development only**: Use for testing, not with real customer data

**When to run:**
- First time setup
- After a PDI reset (PDIs reset after 7 days of inactivity)
- When you need fresh test data

---

## Common Operations

### Check Health

**Verify the server is running:**
```bash
curl http://localhost:3000/health
```

**Expected response:**
```json
{"status":"ok"}
```

**If you get an error:**
- Server might not be running - check if `pnpm dev` is still active
- Wrong port - check your `PORT` environment variable
- Network issue - try `localhost` instead of `127.0.0.1`

### Create an Incident

**Create a test support ticket:**
```bash
curl -X POST http://localhost:3000/incident \
  -H "Content-Type: application/json" \
  -d '{
    "product": "HubSpot / CRM",
    "short_description": "OAuth callback failing"
  }'
```

**What this does:** Creates a new incident in ServiceNow and returns the incident details.

### List Incidents

**View all open incidents:**
```bash
curl http://localhost:3000/incidents
```

**View resolved incidents:**
```bash
curl "http://localhost:3000/incidents?state=resolved"
```

**With pagination:**
```bash
# First 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=0"

# Next 20 incidents
curl "http://localhost:3000/incidents?limit=20&offset=20"
```

### Get KB Suggestions

**Get knowledge base suggestions for an incident:**
```bash
# Replace <SYS_ID> with an actual incident sys_id
curl -X POST http://localhost:3000/incident/<SYS_ID>/suggest
```

**How to find sys_id:**
- Create an incident first (see above)
- The response includes a `sys_id` field
- Copy that value and use it in the suggest endpoint

### Resolve Incident

**Mark an incident as resolved:**
```bash
curl -X POST http://localhost:3000/incident/<SYS_ID>/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_note": "Resolved via KB-0001. User updated OAuth redirect URI."
  }'
```

**What this does:**
- Sets the incident status to "Resolved"
- Records your resolution notes
- Updates the close code (required by ServiceNow)

### Get Statistics

**View help desk metrics:**
```bash
curl http://localhost:3000/stats
```

**Returns:**
- Count of open, in-progress, and resolved incidents
- Deflection rate (how effective KB suggestions are)
- Overall support metrics

---

## Troubleshooting

### 401 Unauthorized

**Symptoms:**
- API calls return `401` status code
- Error message: "User not authenticated" or similar
- Server logs show authentication failures

**What it means:** ServiceNow rejected your credentials - either wrong username/password, or the user doesn't have API access.

**Solutions:**

1. **Verify credentials in `.env`:**
   ```bash
   # Check if variables are set (don't run this if it would expose passwords)
   echo $SERVICE_NOW_USER
   echo $SERVICE_NOW_PASSWORD
   ```

2. **Test credentials manually:**
   ```bash
   # Try accessing ServiceNow directly with your credentials
   curl -u "$SERVICE_NOW_USER:$SERVICE_NOW_PASSWORD" \
     "$SERVICE_NOW_INSTANCE/api/now/table/incident?sysparm_limit=1"
   ```
   - If this works, credentials are correct
   - If this fails, check username/password in ServiceNow

3. **Check user roles in ServiceNow:**
   - Log into ServiceNow as an admin
   - Go to **User Administration > Users**
   - Find your service account user
   - Verify it has `web_service_admin` role
   - Verify it has `itil` role for incident access

4. **Verify instance URL format:**
   - Should be: `https://dev12345.service-now.com`
   - **No trailing slash** (don't end with `/`)
   - Must use `https://` not `http://`

### 403 Forbidden

**Symptoms:**
- API calls return `403` status code
- Error: "Access denied" or "Forbidden"
- Other endpoints work, but specific operations fail

**What it means:** Your user has the right credentials, but doesn't have permission to perform the specific action.

**Solutions:**

1. **Verify user has required roles:**
   - `web_service_admin` - Required for any API access
   - `itil` - Required for incident table operations
   - `kb_admin` or `kb_knowledge_base` - Required for KB article access

2. **Check table-level ACLs (Access Control Lists):**
   - In ServiceNow, go to **System Security > ACLs**
   - Search for ACLs related to `incident` table
   - Verify they allow API access for your user's roles
   - This is usually automatic, but worth checking if issues persist

3. **Check if PDI is active:**
   - PDIs automatically shut down after 10 minutes of inactivity
   - Open your PDI in a web browser to wake it up
   - Wait 30-60 seconds for it to fully start
   - Then try your API call again

**Understanding ACLs:**
- ACLs (Access Control Lists) are ServiceNow's way of controlling who can do what
- They're like file permissions - they say "this role can read incidents" or "this role can create incidents"
- Usually, having the right roles is enough, but sometimes ACLs need adjustment

### 429 Too Many Requests

**Symptoms:**
- API calls return `429` status code
- Error: "Too Many Requests"
- Happens after making many rapid API calls

**What it means:** ServiceNow is rate-limiting your requests - you're making too many calls too quickly.

**Solutions:**

1. **Automatic retry:** The system has built-in retry logic that handles this automatically
   - It waits a bit, then tries again
   - Uses exponential backoff (waits longer each time)

2. **Reduce request frequency:**
   - Add small delays between requests if you're making many calls
   - Use pagination to limit records per call
   - Batch operations when possible

3. **Wait and retry:**
   - If automatic retry doesn't work, wait 1-2 minutes
   - Then try your request again

**Understanding Rate Limiting:**
- ServiceNow limits how many API calls you can make per minute
- This prevents abuse and ensures fair resource usage
- The exact limits vary by instance type
- PDIs are usually more lenient than production instances

### 500 Server Error

**Symptoms:**
- API calls return `500` status code
- Error: "Internal server error"
- Server logs show connection or processing errors

**What it means:** Something went wrong on the server side - could be ServiceNow connection issues, network problems, or application errors.

**Solutions:**

1. **Check ServiceNow instance status:**
   - Open your PDI in a web browser
   - If it doesn't load, the instance might be sleeping or reset
   - PDIs shut down after 10 minutes of inactivity
   - Accessing it in a browser wakes it up

2. **Check ServiceNow logs (if accessible):**
   - In ServiceNow, go to **System Logs > System Log**
   - Look for errors related to your API calls
   - This can reveal what ServiceNow is rejecting

3. **Verify PDI hasn't reset:**
   - PDIs reset if not accessed within 7 days
   - All data is lost when this happens
   - You'll need to re-seed data (see below)

4. **Check application logs:**
   - Look at the terminal where you ran `pnpm dev`
   - Error messages there usually explain what went wrong
   - Common issues: network timeouts, connection refused, SSL errors

### Connection Timeout

**Symptoms:**
- Requests hang and eventually timeout
- Error: "ECONNREFUSED" or "ETIMEDOUT"
- No response from ServiceNow

**What it means:** Can't reach the ServiceNow instance - either it's down, sleeping, or there's a network issue.

**Solutions:**

1. **Verify PDI is active:**
   - PDIs automatically shut down after 10 minutes of inactivity
   - Open your PDI URL in a web browser
   - If it loads, the instance is active
   - Wait 30-60 seconds after waking it up before making API calls

2. **Check network connectivity:**
   ```bash
   # Test if you can reach the ServiceNow server
   ping dev12345.service-now.com
   ```
   - If ping fails, there's a network issue
   - Check your internet connection
   - Verify the instance URL is correct

3. **Verify instance URL is correct:**
   - Should be: `https://dev12345.service-now.com`
   - **No `http://`** - must use HTTPS
   - No trailing slash
   - Check for typos in the subdomain (dev12345)

**Understanding PDI Sleep:**
- PDIs are free development instances
- To save resources, they "sleep" after 10 minutes of no activity
- Waking them up takes 30-60 seconds
- This is normal behavior, not an error

### Seed Script Fails

**Symptoms:**
- `pnpm seed` command errors out
- No data created in ServiceNow
- Error messages about permissions or connection

**Solutions:**

1. **Check ServiceNow connection:**
   ```bash
   # Test if you can connect to ServiceNow
   curl -u "$SERVICE_NOW_USER:$SERVICE_NOW_PASSWORD" \
     "$SERVICE_NOW_INSTANCE/api/now/table/incident?sysparm_limit=1"
   ```
   - If this works, connection is good
   - If this fails, fix connection issues first

2. **Verify user has create permissions:**
   - User must have `itil` role (for incidents)
   - User must have `kb_admin` or `kb_knowledge_base` role (for KB articles)
   - Check roles in ServiceNow: **User Administration > Users**

3. **Check if records already exist:**
   - Seed script is idempotent - it checks for existing records
   - If records exist, it skips creating duplicates
   - This is normal behavior - not an error

4. **Review seed script logs:**
   - Look at the terminal output when running `pnpm seed`
   - Error messages there explain what failed
   - Common issues: missing roles, connection timeouts, invalid data

### KB Articles Not Appearing in Queries

**Symptoms:**
- KB articles are created but don't show up in search results
- `suggestArticles()` returns empty results
- Articles exist in ServiceNow but queries find nothing

**Solutions:**

1. **Check workflow state:**
   - Articles must be **published** to be queryable
   - In ServiceNow, go to **Knowledge > Articles**
   - Find your articles and check their state
   - They should be in "Published" state, not "Draft"
   - If draft, publish them manually

2. **Verify knowledge base assignment:**
   - Articles must belong to a knowledge base
   - Default is usually the "IT" knowledge base
   - In ServiceNow: **Knowledge > Knowledge Bases**
   - Find the KB base sys_id (you might need this for queries)

3. **Check active status:**
   - Articles must have `active=true`
   - Check in ServiceNow UI - there's usually an "Active" checkbox
   - Inactive articles won't appear in queries

4. **Verify valid_to date:**
   - Articles must have a future expiration date
   - If `valid_to` is in the past, articles are considered expired
   - Update the date if needed

5. **Check query syntax:**
   - Queries must include: `active=true^workflow_state=published`
   - Example: `active=true^workflow_state=published^short_descriptionLIKEkeyword`
   - Missing these conditions will return no results

6. **Verify user roles:**
   - User needs `kb_admin` or `kb_knowledge_base` role
   - Check user roles in ServiceNow

**Finding KB Base sys_id:**
```bash
# Get all KB bases
curl -u "$SERVICE_NOW_USER:$SERVICE_NOW_PASSWORD" \
  "$SERVICE_NOW_INSTANCE/api/now/table/kb_knowledge_base?sysparm_fields=sys_id,title"

# Get specific KB base by name
curl -u "$SERVICE_NOW_USER:$SERVICE_NOW_PASSWORD" \
  "$SERVICE_NOW_INSTANCE/api/now/table/kb_knowledge_base?sysparm_query=title=IT&sysparm_fields=sys_id,title"
```

### Incident Resolution Code (Close Code)

**Important:** In ServiceNow, when you resolve an incident, you must provide a "close code" (also called "resolution code"). This is a required field that categorizes how the incident was resolved.

**Current Implementation:**
- The resolve endpoint automatically sets `close_code = 'Solution provided'`
- This value must match one of the valid choices in your ServiceNow instance
- Valid choices typically include:
  - `No resolution provided`
  - `Resolved by request`
  - `Resolved by caller`
  - `Solution provided` ← **Currently used by this service**
  - `Duplicate`
  - `Resolved by change`
  - `Workaround provided`
  - `Known error`
  - `Resolved by problem`
  - `User error`

**How the Resolve Endpoint Works:**
1. Sets `state = '6'` (Resolved)
2. Sets `close_code = 'Solution provided'` (required by data policy)
3. Sets `close_notes` from your `resolution_note` request body field

**Finding Available Close Codes:**
1. **In ServiceNow UI:**
   - Go to **System Definition > Tables**
   - Open `incident` table
   - Find `close_code` field (labeled "Resolution code")
   - Click on the field and view the "Choices" tab
   - This shows all valid values

2. **Via API:**
   ```bash
   # Get close code choices
   curl -u "$SERVICE_NOW_USER:$SERVICE_NOW_PASSWORD" \
     "$SERVICE_NOW_INSTANCE/api/now/table/sys_choice?name=incident&element=close_code"
   ```

**Note:** Close codes may vary by ServiceNow instance. If "Solution provided" doesn't exist in your instance, you may need to update the code to use a different value.

---

## Recovery Procedures

### Recover from 401/403

**Steps:**
1. Verify credentials in `.env` file
2. Test credentials manually (see troubleshooting section)
3. Check user roles in ServiceNow
4. Restart the application:
   ```bash
   # Stop server (Ctrl+C)
   # Restart
   pnpm dev
   ```

### Recover from 429

**Steps:**
1. Wait 1-2 minutes (automatic retry should handle this)
2. If automatic retry doesn't work, reduce request frequency
3. Use smaller page sizes (limit parameter)
4. Implement delays between requests if making many calls

### Recover from PDI Shutdown

**Steps:**
1. Open your PDI in a web browser to wake it up
2. Wait 30-60 seconds for instance to fully start
3. Verify it's active by accessing the ServiceNow UI
4. Retry your API calls

**Understanding PDI Sleep:**
- PDIs are free, so they sleep after 10 minutes of inactivity
- This is normal - not an error
- Just wake them up by accessing in a browser

### Recover from Data Loss

**If your PDI reset (happens after 7 days of inactivity):**

1. **Re-run seed script:**
   ```bash
   pnpm seed
   ```
   This recreates all sample data.

2. **Verify data:**
   ```bash
   curl http://localhost:3000/incidents
   curl http://localhost:3000/stats
   ```

**Important:** PDIs are ephemeral (temporary). Don't store important production data in them.

### Cleanup and Reseed

**To start fresh with clean test data:**

1. **Option 1: Delete via ServiceNow UI**
   - Go to **Incidents** in ServiceNow
   - Delete test records manually
   - Go to **Knowledge > Articles**
   - Delete test articles manually

2. **Option 2: Reseed (Idempotent)**
   - Seed script checks for existing records
   - Safe to run multiple times
   - Won't create duplicates
   ```bash
   pnpm seed
   ```

---

## Monitoring

### Health Checks

**Set up periodic health checks:**
```bash
# Cron job example (runs every 5 minutes)
*/5 * * * * curl -f http://localhost:3000/health || alert
```

**What to monitor:**
- Server is responding (200 status)
- ServiceNow connection is working
- No error rates increasing

### Log Monitoring

**Monitor application logs for:**
- Error rates (should be low)
- 429 responses (rate limiting - might indicate too many requests)
- 5xx responses (server errors - indicates problems)
- Authentication failures (401/403 - credential issues)

**Where to find logs:**
- Development: Terminal where you ran `pnpm dev`
- Production: Check your deployment platform's log viewer

### ServiceNow Monitoring

**Monitor ServiceNow instance:**
- **PDI activity**: Check if instance is sleeping (10-minute inactivity)
- **API usage**: Monitor how many API calls you're making
- **Error logs**: Check ServiceNow system logs for issues

---

## Maintenance

### Regular Tasks

**Weekly:**
- Verify PDI is active (access it in browser)
- Check for data loss (PDI resets after 7 days)
- Review error logs for patterns

**Monthly:**
- Update dependencies:
  ```bash
  pnpm update
  ```
- Review and update KB articles
- Clean up old test incidents
- Check for security updates

### Backup Strategy

**PDIs are ephemeral - important points:**
- Data can be lost if PDI resets (7 days inactivity)
- Don't store production data in PDIs
- Export important data via API if needed
- Use seed scripts to recreate test data
- Consider version control for seed data

**For production:**
- Use proper ServiceNow instances (not PDIs)
- Implement regular backups
- Use ServiceNow's built-in backup features
- Export critical data regularly

---

## Performance Tuning

### Reduce API Calls

**Optimize your usage:**
- Use pagination with appropriate limits (don't fetch everything at once)
- Cache KB articles if possible (they don't change often)
- Batch operations when possible (create multiple incidents in one go if supported)

### Optimize Queries

**Make queries more efficient:**
- Use `sysparm_fields` to limit returned data (only get fields you need)
- Use specific queries instead of fetching all records
- Use incremental syncs with `sys_updated_on` (only get changed records)

**Example:**
```bash
# Bad: Gets all fields
curl "$SERVICE_NOW_INSTANCE/api/now/table/incident"

# Good: Only gets needed fields
curl "$SERVICE_NOW_INSTANCE/api/now/table/incident?sysparm_fields=sys_id,number,short_description"
```

---

## Security Best Practices

1. **Never commit `.env` to version control**
   - It contains sensitive credentials
   - Already in `.gitignore`, but double-check

2. **Use least-privilege roles**
   - Don't use global `admin` role
   - Use specific roles like `web_service_admin` + `itil`
   - Only grant permissions needed for the task

3. **Rotate credentials regularly**
   - Change passwords periodically
   - Use strong, unique passwords
   - Don't reuse passwords from other systems

4. **Monitor for unauthorized access**
   - Check ServiceNow audit logs
   - Watch for unexpected API calls
   - Set up alerts for suspicious activity

5. **Use HTTPS in production**
   - Never use HTTP for production
   - HTTPS encrypts data in transit
   - ServiceNow requires HTTPS anyway

6. **Implement API authentication** (future enhancement)
   - Add API keys for the web interface
   - Use OAuth 2.0 for secure access
   - Add request signing to prevent tampering

---

## Support

**If you encounter issues:**

1. **Check this runbook** - Most common issues are covered here
2. **Review API Reference** - See `docs/API_REFERENCE.md` for endpoint details
3. **Check ServiceNow developer documentation** - [developer.servicenow.com](https://developer.servicenow.com)
4. **Review application logs** - Error messages usually explain what went wrong
5. **Verify environment variables** - Make sure all required variables are set

---

## Quick Reference

**Common Commands:**
```bash
# Start development server
pnpm dev

# Seed data
pnpm seed

# Build for production
pnpm build

# Run production server
pnpm start

# Type check
pnpm typecheck

# Health check
curl http://localhost:3000/health

# List incidents
curl http://localhost:3000/incidents

# Get stats
curl http://localhost:3000/stats
```

**Common URLs:**
- Web interface: `http://localhost:3000` (or your configured port)
- Health check: `http://localhost:3000/health`
- API docs: See `docs/API_REFERENCE.md`

**Important Files:**
- `.env` - Environment variables (credentials, configuration)
- `docs/API_REFERENCE.md` - Complete API documentation
- `docs/ARCHITECTURE.md` - System architecture
- `docs/RUNBOOK.md` - This file

---

*Last Updated: 2024*
