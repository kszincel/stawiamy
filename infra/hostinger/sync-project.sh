#!/usr/bin/env bash
set -euo pipefail

# sync-project.sh <projectId>
# Reads BRIEF.md and RECOMMENDED_ACTIONS.md from workspace and updates Supabase.
# Run on Hostinger as: ~/bin/sync-project.sh <projectId>

PROJECT_ID="${1:?Usage: sync-project.sh <projectId>}"
ENV_FILE="${HOME}/.config/stawiamy/.env"

# shellcheck source=/dev/null
source "$ENV_FILE"

# Resolve workspace path from Supabase (supports slug-based names)
WORKSPACE=$(curl -sf \
  "${SUPABASE_URL}/rest/v1/projects?id=eq.${PROJECT_ID}&select=workspace_path" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json" | jq -r '.workspace_path // ""')

if [[ -z "$WORKSPACE" || ! -d "$WORKSPACE" ]]; then
  echo "ERROR: Workspace not found (path: ${WORKSPACE:-not set in DB})."
  exit 1
fi

echo ">>> Syncing workspace ${WORKSPACE} to Supabase..."

# Read BRIEF.md
BRIEF=""
if [[ -f "${WORKSPACE}/BRIEF.md" ]]; then
  BRIEF=$(cat "${WORKSPACE}/BRIEF.md")
fi

# Read RECOMMENDED_ACTIONS.md and parse checkboxes
ACTIONS='[]'
if [[ -f "${WORKSPACE}/RECOMMENDED_ACTIONS.md" ]]; then
  # Extract lines starting with - [ ] or - [x] (unchecked items only for ai_recommended_actions)
  ACTIONS=$(grep -E '^\s*-\s*\[[ x]\]' "${WORKSPACE}/RECOMMENDED_ACTIONS.md" 2>/dev/null | \
    sed 's/^\s*-\s*\[[ x]\]\s*//' | \
    jq -R -s 'split("\n") | map(select(length > 0))') || ACTIONS='[]'

  # Extract completed actions (checked items)
  COMPLETED=$(grep -E '^\s*-\s*\[x\]' "${WORKSPACE}/RECOMMENDED_ACTIONS.md" 2>/dev/null | \
    sed 's/^\s*-\s*\[x\]\s*//' | \
    jq -R -s 'split("\n") | map(select(length > 0))') || COMPLETED='[]'
fi

# Build JSON payload
PAYLOAD=$(jq -n \
  --arg brief "$BRIEF" \
  --argjson actions "$ACTIONS" \
  --argjson completed "${COMPLETED:-[]}" \
  '{
    ai_brief: $brief,
    ai_recommended_actions: $actions,
    completed_actions: $completed
  }')

# PATCH Supabase
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
  "${SUPABASE_URL}/rest/v1/projects?id=eq.${PROJECT_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$PAYLOAD")

if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
  echo ">>> Sync OK (HTTP ${HTTP_CODE})"
  echo "    - Brief: $(echo "$BRIEF" | wc -l | tr -d ' ') lines"
  echo "    - Actions: $(echo "$ACTIONS" | jq 'length') items"
  echo "    - Completed: $(echo "${COMPLETED:-[]}" | jq 'length') items"
else
  echo "ERROR: Supabase returned HTTP ${HTTP_CODE}"
  exit 1
fi
