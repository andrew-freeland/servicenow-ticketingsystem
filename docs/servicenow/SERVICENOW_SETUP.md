# ServiceNow Setup Guide
## Getting Started with Credentials, Roles, and Configuration

This guide explains how to set up your ServiceNow Personal Developer Instance (PDI) for use with the Client Support Counter integration.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Getting Your PDI Credentials](#getting-your-pdi-credentials)
3. [Required Roles](#required-roles)
4. [API Access Configuration](#api-access-configuration)
5. [Finding Field Names](#finding-field-names)
6. [Checking Choice Lists](#checking-choice-lists)
7. [Debugging Data Policy Failures](#debugging-data-policy-failures)
8. [Environment Variables](#environment-variables)
9. [Testing Your Setup](#testing-your-setup)
10. [Cross-References](#cross-references)

---

## Purpose

This guide helps you:

- Get your PDI instance URL and credentials
- Configure required roles for API access
- Find field names and choice list values
- Debug common configuration issues
- Set up environment variables
- Test your ServiceNow connection

**Use this guide when:**
- Setting up a new ServiceNow integration
- Configuring credentials
- Debugging authentication issues
- Finding field names for mapping

---

## Getting Your PDI Credentials

### Step 1: Access Your PDI

1. Go to [developer.servicenow.com](https://developer.servicenow.com)
2. Sign in with your ServiceNow developer account
3. Navigate to **Manage > Instances**
4. Find your Personal Developer Instance (PDI)
5. Click **Open Instance** to access your PDI

### Step 2: Get Your Instance URL

**Your instance URL format:**
```
https://<instance-id>.service-now.com
```

**Example:**
```
https://dev12345.service-now.com
```

**Note:** Your instance URL is visible in the browser address bar when you access your PDI.

### Step 3: Get Your Credentials

**Option 1: Use Your Personal Account**
- Username: Your ServiceNow developer account email
- Password: Your ServiceNow developer account password

**Option 2: Create a Service Account (Recommended)**
1. Navigate to **System Security > Users > New**
2. Create a new user with:
   - **User ID**: `api-service-account`
   - **Email**: `api-service-account@yourdomain.com`
   - **Password**: Generate a strong password
   - **Web Service Access Only**: ✅ Checked
3. Assign required roles (see [Required Roles](#required-roles))

**Why Use a Service Account:**
- ✅ Better security (separate credentials)
- ✅ Can be disabled without affecting personal account
- ✅ Easier to rotate credentials
- ✅ Web Service Access Only flag prevents UI login

---

## Required Roles

### Minimum Required Roles

Your ServiceNow user must have these roles:

1. **`web_service_admin`** - Required for API access
2. **`itil`** - Required for incident table read access
3. **`itil_admin`** - Required for full incident management (create, update, delete)
4. **`sn_incident_write`** - Required for creating incidents

### How to Assign Roles

1. Navigate to **System Security > Users**
2. Find your user (or service account)
3. Click on the user to open their record
4. Scroll to **Roles** section
5. Click **Edit**
6. Add the required roles:
   - `web_service_admin`
   - `itil`
   - `itil_admin`
   - `sn_incident_write`
7. Click **Save**

### Verifying Roles

**Test API access:**
```bash
curl -X GET \
  'https://<instance>.service-now.com/api/now/table/incident?sysparm_limit=1' \
  -u '<username>:<password>' \
  -H 'Accept: application/json'
```

**Expected Response:**
```json
{
  "result": [...]
}
```

**If you get 403 Forbidden:**
- Verify all required roles are assigned
- Check user is active
- Ensure Web Service Access Only is checked (for service accounts)

---

## API Access Configuration

### Basic Authentication

**Default authentication method** for PDIs.

**Configuration:**
```bash
AUTH_MODE=basic
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_USER=your-username
SERVICE_NOW_PASSWORD=your-password
```

### OAuth 2.0 (Optional)

**For production instances**, OAuth 2.0 is recommended.

**Setup Steps:**
1. Navigate to **System OAuth > Application Registry > New**
2. Create new OAuth application:
   - **Name**: `Client Support Counter`
   - **Redirect URL**: `https://your-app.com/oauth/callback`
   - **Client ID**: Auto-generated
   - **Client Secret**: Auto-generated (save this!)
3. Assign required roles to the OAuth application

**Configuration:**
```bash
AUTH_MODE=oauth
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_CLIENT_ID=your-client-id
SERVICE_NOW_CLIENT_SECRET=your-client-secret
```

### API Key (If Supported)

Some instances support API key authentication.

**Configuration:**
```bash
AUTH_MODE=apiKey
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_API_KEY=your-api-key
```

---

## Finding Field Names

### Method 1: Table Dictionary

1. Navigate to **System Definition > Tables**
2. Search for `incident`
3. Click on the `incident` table
4. Click **Columns** tab
5. Find the field you need
6. **Column Name** = Field name for API

**Example:**
- Display Name: "Short Description"
- Column Name: `short_description` ← Use this in API

### Method 2: Form Designer

1. Navigate to **Service Desk > Incidents**
2. Open any incident
3. Right-click on a field
4. Select **Configure > Field Properties**
5. **Name** = Field name for API

### Method 3: API Explorer

1. Navigate to **System Web Services > REST > API Explorer**
2. Select **Table API**
3. Choose `incident` table
4. Click **GET** to see available fields
5. Field names are in the response

---

## Checking Choice Lists

### Method 1: Field Dictionary

1. Navigate to **System Definition > Tables**
2. Search for `incident`
3. Click on the `incident` table
4. Click **Columns** tab
5. Find the field (e.g., `priority`)
6. Click on the field
7. **Type** = Choice
8. **Choices** tab shows all valid values

**Example - Priority:**
- 1 = Critical
- 2 = High
- 3 = Medium
- 4 = Low
- 5 = Planning

### Method 2: Form Designer

1. Navigate to **Service Desk > Incidents**
2. Open any incident
3. Right-click on a choice field (e.g., Priority dropdown)
4. Select **Configure > Field Properties**
5. **Choices** tab shows all valid values

### Method 3: API Query

**Query for all unique values:**
```bash
curl -X GET \
  'https://<instance>.service-now.com/api/now/table/incident?sysparm_fields=priority&sysparm_display_value=true' \
  -u '<username>:<password>' \
  -H 'Accept: application/json'
```

---

## Debugging Data Policy Failures

### What is a Data Policy?

**Data Policies** enforce business rules when creating/updating records.

**Common Issues:**
- Required fields not provided
- Invalid field values
- Field dependencies not met

### How to Debug

**Step 1: Check Error Response**
```json
{
  "error": {
    "message": "Data policy violation",
    "detail": "Field 'category' is required"
  }
}
```

**Step 2: Find Data Policies**
1. Navigate to **System Policy > Data > Data Policies**
2. Filter by table: `incident`
3. Review active policies
4. Check conditions and actions

**Step 3: Test with API Explorer**
1. Navigate to **System Web Services > REST > API Explorer**
2. Select **Table API > incident**
3. Try creating a record with minimal fields
4. See which fields are required

**Step 4: Check Field Properties**
1. Navigate to **System Definition > Tables > incident**
2. Click **Columns** tab
3. Find the field causing issues
4. Check **Mandatory** checkbox
5. Check **Read Only** checkbox

### Common Data Policy Issues

**Issue: Required Field Missing**
- **Solution**: Add field to payload

**Issue: Invalid Choice Value**
- **Solution**: Use valid choice value from choice list

**Issue: Field Dependency**
- **Solution**: Ensure dependent fields are set

---

## Environment Variables

### Required Variables

**Basic Authentication:**
```bash
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_USER=your-username
SERVICE_NOW_PASSWORD=your-password
AUTH_MODE=basic
```

**OAuth 2.0:**
```bash
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_CLIENT_ID=your-client-id
SERVICE_NOW_CLIENT_SECRET=your-client-secret
AUTH_MODE=oauth
```

**Optional:**
```bash
NODE_ENV=development
PORT=3000
```

### Setting Environment Variables

**Development (.env file):**
```bash
# .env
SERVICE_NOW_INSTANCE=https://dev12345.service-now.com
SERVICE_NOW_USER=api-service-account
SERVICE_NOW_PASSWORD=your-password
AUTH_MODE=basic
```

**Production (GCP Secret Manager or similar):**
- Store credentials in secret manager
- Reference via environment variables
- Never commit credentials to version control

---

## Testing Your Setup

### Test 1: Health Check

**Endpoint:** `GET /health`

**Expected Response:**
```json
{
  "status": "ok"
}
```

### Test 2: List Incidents

**Endpoint:** `GET /incidents`

**Expected Response:**
```json
{
  "incidents": [...]
}
```

### Test 3: Create Incident

**Endpoint:** `POST /incident`

**Request:**
```json
{
  "client": "Test Client",
  "category": "Other",
  "shortDescription": "Test incident"
}
```

**Expected Response:**
```json
{
  "sys_id": "abc123",
  "number": "INC0012345",
  "client": "Test Client",
  "category": "Other",
  "shortDescription": "Test incident",
  "state": "1"
}
```

### Test 4: Direct API Call

**cURL:**
```bash
curl -X GET \
  'https://<instance>.service-now.com/api/now/table/incident?sysparm_limit=1' \
  -u '<username>:<password>' \
  -H 'Accept: application/json' \
  -H 'User-Agent: Cursor-AI-Agent/1.0'
```

**Expected Response:**
```json
{
  "result": [
    {
      "sys_id": "abc123",
      "number": "INC0012345",
      "short_description": "..."
    }
  ]
}
```

---

## Cross-References

- **[ServiceNow Integration Ruleset v1.0](./SERVICENOW_RULESET_v1.0.md)** - Authentication and security rules
- **[ServiceNow Table API Guide](./SERVICENOW_TABLE_API_GUIDE.md)** - API usage examples
- **[ServiceNow Error Handling Guide](./SERVICENOW_ERROR_HANDLING_GUIDE.md)** - Debugging errors

---

**Status:** Complete setup guide v1.0

