#!/usr/bin/env bash
set -euo pipefail

# bootstrap-project.sh <projectId>
# Fetches project from Supabase, creates workspace on Hostinger, inits repo.
# Run on Hostinger as: ~/bin/bootstrap-project.sh <projectId>

PROJECT_ID="${1:?Usage: bootstrap-project.sh <projectId>}"
PROJECTS_ROOT="${HOME}/projects"
ENV_FILE="${HOME}/.config/stawiamy/.env"
GITHUB_ORG="ikonmediapl"

# ─── Load env ───────────────────────────────────────────────────────────────

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Create it with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in $ENV_FILE"
  exit 1
fi

# ─── Fetch project from Supabase ───────────────────────────────────────────

echo ">>> Fetching project ${PROJECT_ID}..."

PROJECT_JSON=$(curl -sf \
  "${SUPABASE_URL}/rest/v1/projects?id=eq.${PROJECT_ID}&select=*" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json")

if [[ -z "$PROJECT_JSON" || "$PROJECT_JSON" == "null" ]]; then
  echo "ERROR: Project ${PROJECT_ID} not found in Supabase."
  exit 1
fi

# Extract fields
PROMPT=$(echo "$PROJECT_JSON" | jq -r '.prompt // "Brak opisu"')
PRODUCT_TYPE=$(echo "$PROJECT_JSON" | jq -r '.product_type // "unknown"')
PACKAGE=$(echo "$PROJECT_JSON" | jq -r '.package // "unknown"')
PREVIEW_TYPE=$(echo "$PROJECT_JSON" | jq -r '.preview_type // "brief"')
ESTIMATED_PRICE=$(echo "$PROJECT_JSON" | jq -r '.estimated_price // 0')
DEPOSIT_AMOUNT=$(echo "$PROJECT_JSON" | jq -r '.deposit_amount // 0')
TIMELINE=$(echo "$PROJECT_JSON" | jq -r '.timeline // "do ustalenia"')
DESCRIPTION=$(echo "$PROJECT_JSON" | jq -r '.description // ""')
STATUS=$(echo "$PROJECT_JSON" | jq -r '.status // "unknown"')
CONTACT_NAME=$(echo "$PROJECT_JSON" | jq -r '.contact_name // ""')
CONTACT_EMAIL=$(echo "$PROJECT_JSON" | jq -r '.contact_email // ""')
BRIEF=$(echo "$PROJECT_JSON" | jq -r '.ai_brief // .brief // ""')
FEATURES=$(echo "$PROJECT_JSON" | jq -r '(.features // []) | if type == "array" then map("- " + .) | join("\n") else "" end')
DETAILS_JSON=$(echo "$PROJECT_JSON" | jq -r '.details // {}')
ATTACHMENTS_JSON=$(echo "$PROJECT_JSON" | jq -r '.attachments // []')
SOURCE_URL=$(echo "$PROJECT_JSON" | jq -r '.source_url // ""')
PREVIEW_HTML_URL=$(echo "$PROJECT_JSON" | jq -r '.preview_html_url // ""')
MISSING_INFO=$(echo "$PROJECT_JSON" | jq -r '(.ai_missing_info // []) | if type == "array" then map("- " + .) | join("\n") else "" end')
RECOMMENDED_ACTIONS=$(echo "$PROJECT_JSON" | jq -r '(.ai_recommended_actions // []) | if type == "array" then map("- [ ] " + .) | join("\n") else "" end')
CREATED_AT=$(echo "$PROJECT_JSON" | jq -r '.created_at // ""')
ADMIN_ATTACHMENTS_JSON=$(echo "$PROJECT_JSON" | jq -r '.admin_attachments // []')
ADMIN_NOTES_JSON=$(echo "$PROJECT_JSON" | jq -r '.admin_notes // []')

# Generate human-readable slug from prompt (e.g. "doktorat-domi", "landing-kancelaria")
SLUG=$(echo "$PROMPT" | \
  sed 's/[ąĄ]/a/g; s/[ćĆ]/c/g; s/[ęĘ]/e/g; s/[łŁ]/l/g; s/[ńŃ]/n/g; s/[óÓ]/o/g; s/[śŚ]/s/g; s/[źżŹŻ]/z/g' | \
  tr '[:upper:]' '[:lower:]' | \
  sed 's/[^a-z0-9 ]/ /g' | \
  tr -s ' ' | \
  awk '{for(i=1;i<=NF && i<=4;i++) printf "%s-",$i}' | \
  sed 's/-$//' | \
  cut -c1-40)
# Fallback if slug is empty
SLUG="${SLUG:-projekt-${PROJECT_ID:0:8}}"

WORKSPACE="${PROJECTS_ROOT}/${SLUG}"
REPO_NAME="${SLUG}"

echo ">>> Project: ${PROMPT:0:80}"
echo ">>> Type: ${PRODUCT_TYPE} / ${PACKAGE}"
echo ">>> Workspace: ${WORKSPACE}"

# ─── Create workspace ──────────────────────────────────────────────────────

if [[ -d "$WORKSPACE" ]]; then
  echo ">>> Workspace already exists. Updating files..."
else
  echo ">>> Creating workspace..."
  mkdir -p "$WORKSPACE"
fi

# ─── Download attachments ──────────────────────────────────────────────────

ATTACHMENT_COUNT=$(echo "$ATTACHMENTS_JSON" | jq 'length')
if [[ "$ATTACHMENT_COUNT" -gt 0 ]]; then
  echo ">>> Downloading ${ATTACHMENT_COUNT} attachments..."
  mkdir -p "${WORKSPACE}/attachments"

  echo "$ATTACHMENTS_JSON" | jq -c '.[]' | while read -r att; do
    ATT_URL=$(echo "$att" | jq -r '.url')
    ATT_FILENAME=$(echo "$att" | jq -r '.filename')
    if [[ -n "$ATT_URL" && -n "$ATT_FILENAME" && ! -f "${WORKSPACE}/attachments/${ATT_FILENAME}" ]]; then
      echo "    Downloading: ${ATT_FILENAME}"
      curl -sfo "${WORKSPACE}/attachments/${ATT_FILENAME}" "$ATT_URL" || echo "    WARNING: Failed to download ${ATT_FILENAME}"
    fi
  done
fi

# ─── Download admin attachments ───────────────────────────────────────────

ADMIN_ATTACHMENT_COUNT=$(echo "$ADMIN_ATTACHMENTS_JSON" | jq 'length')
if [[ "$ADMIN_ATTACHMENT_COUNT" -gt 0 ]]; then
  echo ">>> Downloading ${ADMIN_ATTACHMENT_COUNT} admin attachments..."
  mkdir -p "${WORKSPACE}/attachments/admin"

  echo "$ADMIN_ATTACHMENTS_JSON" | jq -c '.[]' | while read -r att; do
    ATT_URL=$(echo "$att" | jq -r '.url')
    ATT_FILENAME=$(echo "$att" | jq -r '.filename')
    if [[ -n "$ATT_URL" && -n "$ATT_FILENAME" && ! -f "${WORKSPACE}/attachments/admin/${ATT_FILENAME}" ]]; then
      echo "    Downloading: ${ATT_FILENAME}"
      curl -sfo "${WORKSPACE}/attachments/admin/${ATT_FILENAME}" "$ATT_URL" || echo "    WARNING: Failed to download ${ATT_FILENAME}"
    fi
  done
fi

# ─── Format details from form ─────────────────────────────────────────────

DETAILS_FORMATTED=""
if [[ "$DETAILS_JSON" != "{}" && "$DETAILS_JSON" != "null" ]]; then
  DETAILS_FORMATTED=$(echo "$DETAILS_JSON" | jq -r '
    to_entries | map(
      "- **" + (.key | gsub("_"; " ") | split(" ") | map(if length > 0 then (.[0:1] | ascii_upcase) + .[1:] else . end) | join(" ")) + ":** " +
      (if .value | type == "array" then (.value | join(", ")) else (.value | tostring) end)
    ) | join("\n")
  ')
fi

# ─── Build attachments list for CLAUDE.md ──────────────────────────────────

ATTACHMENTS_LIST=""
if [[ "$ATTACHMENT_COUNT" -gt 0 ]]; then
  ATTACHMENTS_LIST=$(echo "$ATTACHMENTS_JSON" | jq -r '.[] | "- attachments/" + .filename + " (" + .type + ", " + (.size | tostring) + " bytes)"' )
fi

ADMIN_ATTACHMENTS_LIST=""
if [[ "$ADMIN_ATTACHMENT_COUNT" -gt 0 ]]; then
  ADMIN_ATTACHMENTS_LIST=$(echo "$ADMIN_ATTACHMENTS_JSON" | jq -r '.[] | "- attachments/admin/" + .filename + " (" + .type + ", " + (.size | tostring) + " bytes)"')
fi

ADMIN_NOTES_FORMATTED=""
ADMIN_NOTES_COUNT=$(echo "$ADMIN_NOTES_JSON" | jq 'length')
if [[ "$ADMIN_NOTES_COUNT" -gt 0 ]]; then
  ADMIN_NOTES_FORMATTED=$(echo "$ADMIN_NOTES_JSON" | jq -r '.[] | "### " + .created_at + "\n" + .content + "\n"')
fi

# ─── Generate CLAUDE.md ────────────────────────────────────────────────────

echo ">>> Generating CLAUDE.md..."

cat > "${WORKSPACE}/CLAUDE.md" << CLAUDEEOF
# Projekt: ${PROMPT:0:80}

Klient: ${CONTACT_NAME} <${CONTACT_EMAIL}>
Status: ${STATUS}
Utworzono: ${CREATED_AT}
Admin panel: https://stawiamy.vercel.app/dashboard/${PROJECT_ID}
Project ID: ${PROJECT_ID}

## Co klient zamowil

${PROMPT}

## Klasyfikacja

- Typ: ${PRODUCT_TYPE}
- Pakiet: ${PACKAGE}
- Cena: ${ESTIMATED_PRICE} PLN (zaliczka ${DEPOSIT_AMOUNT} PLN)
- Timeline: ${TIMELINE}
- Opis: ${DESCRIPTION}

## Kluczowe elementy

${FEATURES}

## Szczegoly z formularza

${DETAILS_FORMATTED:-Brak danych z formularza.}

## Zalaczniki klienta

${ATTACHMENTS_LIST:-Brak zalacznikow.}

## Materialy admina

${ADMIN_ATTACHMENTS_LIST:-Brak materialow admina.}

## Brief

${BRIEF:-Brak briefu.}
${SOURCE_URL:+
## Strona zrodlowa

URL: ${SOURCE_URL}
${PREVIEW_HTML_URL:+Preview HTML: ${PREVIEW_HTML_URL}}
}

## Brakujace informacje

${MISSING_INFO:-Brak.}

## Zalecane akcje

${RECOMMENDED_ACTIONS:-Brak.}

## Notatki admina

${ADMIN_NOTES_FORMATTED:-Brak notatek.}

## Co juz zrobilismy

- (puste na start, dopisuj w miare pracy)

---

# Reguly pracy

- Jezyk outputu dla klienta: polski, prosty, bez korpo-zargonu i anglicyzmow
- Deploy target: Vercel (auto-deploy z main)
- Commituj czesto, push do main
- Po kazdym wiekszym milestone: zaktualizuj BRIEF.md
- Jezeli nie wiesz co robic - przeczytaj BRIEF.md i attachments/

## Workflow

1. Przeczytaj CLAUDE.md, BRIEF.md i pliki w attachments/
2. Zaplanuj prace, zapytaj jezeli cos niejasne
3. Buduj iteracyjnie - po kazdej sekcji: build/test
4. Commituj i pushuj
5. Jak skonczysz: dopisz "## Status: gotowe do review" w BRIEF.md
CLAUDEEOF

# ─── Generate BRIEF.md ─────────────────────────────────────────────────────

if [[ ! -f "${WORKSPACE}/BRIEF.md" ]]; then
  cat > "${WORKSPACE}/BRIEF.md" << BRIEFEOF
# Brief: ${PROMPT:0:80}

## Cel

${DESCRIPTION}

## Plan dzialan

${BRIEF:-Do uzupelnienia.}

## Postep

- [ ] Rozpoczecie pracy
BRIEFEOF
fi

# ─── Generate RECOMMENDED_ACTIONS.md ────────────────────────────────────────

if [[ ! -f "${WORKSPACE}/RECOMMENDED_ACTIONS.md" ]]; then
  cat > "${WORKSPACE}/RECOMMENDED_ACTIONS.md" << ACTIONSEOF
# Zalecane akcje

${RECOMMENDED_ACTIONS:-Brak na start.}
ACTIONSEOF
fi

# ─── Save raw project JSON ─────────────────────────────────────────────────

echo "$PROJECT_JSON" | jq '.' > "${WORKSPACE}/.context.json"

# ─── Init git repo + GitHub ────────────────────────────────────────────────

cd "$WORKSPACE"

if [[ ! -d ".git" ]]; then
  echo ">>> Creating GitHub repo ${GITHUB_ORG}/${REPO_NAME}..."

  # Check if repo already exists on GitHub
  if gh repo view "${GITHUB_ORG}/${REPO_NAME}" &>/dev/null; then
    echo ">>> Repo exists, cloning..."
    cd ..
    rm -rf "$WORKSPACE"
    gh repo clone "${GITHUB_ORG}/${REPO_NAME}" "$WORKSPACE"
    cd "$WORKSPACE"
  else
    git init
    git branch -M main

    # .gitignore
    cat > .gitignore << 'GIEOF'
node_modules/
.next/
.vercel/
.env
.env.local
.context.json
dist/
GIEOF

    git add -A
    git commit -m "Bootstrap workspace for project ${SHORT_ID}"

    gh repo create "${GITHUB_ORG}/${REPO_NAME}" --private --source=. --push
  fi
else
  echo ">>> Git repo already initialized."
fi

# ─── Init project template based on product_type ───────────────────────────

init_nextjs() {
  if [[ ! -f "package.json" ]]; then
    echo ">>> Initializing Next.js project..."
    npx --yes create-next-app@latest . --ts --tailwind --app --src-dir --import-alias "@/*" --use-npm --eslint --no-turbopack 2>/dev/null || true
    git add -A
    git commit -m "Initialize Next.js template" || true
    git push origin main || true
  fi
}

case "$PRODUCT_TYPE" in
  website|app|redesign|digital_product)
    init_nextjs
    ;;
  automation|agent)
    # No template - Claude Code will create what's needed
    echo ">>> Automation/agent project - no template needed."
    ;;
  *)
    echo ">>> Unknown product type: ${PRODUCT_TYPE}. Skipping template."
    ;;
esac

# ─── Update Supabase with workspace info ───────────────────────────────────

echo ">>> Updating project in Supabase..."
REPO_URL="https://github.com/${GITHUB_ORG}/${REPO_NAME}"

curl -sf -X PATCH \
  "${SUPABASE_URL}/rest/v1/projects?id=eq.${PROJECT_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"workspace_path\": \"${WORKSPACE}\", \"workspace_repo_url\": \"${REPO_URL}\"}" \
  || echo "WARNING: Failed to update Supabase (columns may not exist yet)"

# ─── Done ──────────────────────────────────────────────────────────────────

echo ""
echo "=========================================="
echo " Workspace ready!"
echo "=========================================="
echo ""
echo " Path:    ${WORKSPACE}"
echo " Repo:    https://github.com/${GITHUB_ORG}/${REPO_NAME}"
echo ""
echo " To start working:"
echo "   tmux new -A -s p-${SHORT_ID} -c ${WORKSPACE} claude"
echo ""
echo " To attach to existing session:"
echo "   tmux attach -t p-${SHORT_ID}"
echo ""
