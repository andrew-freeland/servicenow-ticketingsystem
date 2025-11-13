#!/bin/bash
# Demo script for Docs & Integrations Help Desk
# Run this to demonstrate the full workflow

set -e

PORT=${PORT:-3000}
BASE_URL="http://localhost:${PORT}"

echo "🚀 Docs & Integrations Help Desk - Demo Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health check
echo -e "${BLUE}1. Health Check${NC}"
echo "GET ${BASE_URL}/health"
RESPONSE=$(curl -s "${BASE_URL}/health")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 2. Seed data
echo -e "${BLUE}2. Seed KB Articles and Incidents${NC}"
echo "POST ${BASE_URL}/seed"
RESPONSE=$(curl -s -X POST "${BASE_URL}/seed")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 3. Create incident
echo -e "${BLUE}3. Create New Incident${NC}"
echo "POST ${BASE_URL}/incident"
RESPONSE=$(curl -s -X POST "${BASE_URL}/incident" \
  -H "Content-Type: application/json" \
  -d '{
    "product": "Product X",
    "short_description": "OAuth callback failing in production"
  }')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract sys_id from response
SYS_ID=$(echo "$RESPONSE" | jq -r '.sys_id' 2>/dev/null || echo "")

if [ -z "$SYS_ID" ] || [ "$SYS_ID" = "null" ]; then
  echo -e "${YELLOW}⚠️  Could not extract sys_id from response. Please run manually.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Created incident with sys_id: ${SYS_ID}${NC}"
echo ""

# 4. Suggest KB articles
echo -e "${BLUE}4. Get KB Article Suggestions${NC}"
echo "POST ${BASE_URL}/incident/${SYS_ID}/suggest"
RESPONSE=$(curl -s -X POST "${BASE_URL}/incident/${SYS_ID}/suggest")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# 5. Resolve incident
echo -e "${BLUE}5. Resolve Incident${NC}"
echo "POST ${BASE_URL}/incident/${SYS_ID}/resolve"
RESPONSE=$(curl -s -X POST "${BASE_URL}/incident/${SYS_ID}/resolve" \
  -H "Content-Type: application/json" \
  -d '{
    "resolution_note": "Resolved via KB article guidance. User updated OAuth redirect URI."
  }')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "${GREEN}✓ Incident resolved (state=6, close_code='Solution provided')${NC}"
echo ""

# 6. Get statistics
echo -e "${BLUE}6. Get Help Desk Statistics${NC}"
echo "GET ${BASE_URL}/stats"
RESPONSE=$(curl -s "${BASE_URL}/stats")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "================================================"
echo -e "${GREEN}✅ Demo Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Open ServiceNow UI and navigate to the incident: ${SYS_ID}"
echo "2. Verify:"
echo "   - State = Resolved (6)"
echo "   - Resolution code = Solution provided"
echo "   - Close notes = 'Resolved via KB article guidance...'"
echo ""

