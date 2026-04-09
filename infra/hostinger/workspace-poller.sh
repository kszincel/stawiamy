#!/usr/bin/env bash
set -euo pipefail

# workspace-poller.sh
# Runs via cron every minute. Checks Supabase for projects with
# workspace_requested=true and no workspace_path, then bootstraps them.
# Crontab: * * * * * /root/bin/workspace-poller.sh >> /var/log/workspace-poller.log 2>&1

ENV_FILE="${HOME}/.config/stawiamy/.env"
LOCKFILE="/tmp/workspace-poller.lock"
BOOTSTRAP="${HOME}/bin/bootstrap-project.sh"

# Prevent overlapping runs
if [[ -f "$LOCKFILE" ]]; then
  LOCK_PID=$(cat "$LOCKFILE")
  if kill -0 "$LOCK_PID" 2>/dev/null; then
    exit 0
  fi
fi
echo $$ > "$LOCKFILE"
trap 'rm -f "$LOCKFILE"' EXIT

# shellcheck source=/dev/null
source "$ENV_FILE"

# Find projects that need bootstrapping
PROJECTS=$(curl -sf \
  "${SUPABASE_URL}/rest/v1/projects?workspace_requested=eq.true&workspace_path=is.null&select=id" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  2>/dev/null || echo "[]")

COUNT=$(echo "$PROJECTS" | jq 'length')

if [[ "$COUNT" -eq 0 ]]; then
  exit 0
fi

echo "[$(date -Iseconds)] Found ${COUNT} projects to bootstrap"

echo "$PROJECTS" | jq -r '.[].id' | while read -r PROJECT_ID; do
  echo "[$(date -Iseconds)] Bootstrapping ${PROJECT_ID}..."

  # Clear the flag immediately to prevent re-processing
  curl -sf -X PATCH \
    "${SUPABASE_URL}/rest/v1/projects?id=eq.${PROJECT_ID}" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d '{"workspace_requested": false}' \
    >/dev/null 2>&1 || true

  # Run bootstrap
  if "$BOOTSTRAP" "$PROJECT_ID"; then
    echo "[$(date -Iseconds)] SUCCESS: ${PROJECT_ID}"
  else
    echo "[$(date -Iseconds)] FAILED: ${PROJECT_ID}"
  fi
done
