#!/bin/bash
# Rotate MEILISEARCH_API_KEY + add COOKIE_SECRET if missing
# Creates a backup first. Idempotent-safe.
set -euo pipefail

ENV_FILE="/home/yc-user/topla/.env"
BACKUP="${ENV_FILE}.bak-$(date +%Y%m%d_%H%M%S)"

[ -f "$ENV_FILE" ] || { echo "FAIL: $ENV_FILE missing"; exit 1; }

# Generate 48-char base64 (URL-safe, no padding)
COOKIE_SECRET=$(openssl rand -base64 48 | tr -d '=/+\n' | head -c 48)
MEILI_KEY=$(openssl rand -base64 48 | tr -d '=/+\n' | head -c 48)

echo "COOKIE_LEN=${#COOKIE_SECRET}"
echo "MEILI_LEN=${#MEILI_KEY}"

# Backup
cp "$ENV_FILE" "$BACKUP"
echo "BACKUP_OK: $BACKUP"

# Rotate MEILI key
if grep -q '^MEILISEARCH_API_KEY=' "$ENV_FILE"; then
  sed -i "s|^MEILISEARCH_API_KEY=.*|MEILISEARCH_API_KEY=${MEILI_KEY}|" "$ENV_FILE"
  echo "MEILI_KEY rotated"
else
  echo "MEILISEARCH_API_KEY=${MEILI_KEY}" >> "$ENV_FILE"
  echo "MEILI_KEY added"
fi

# Add COOKIE_SECRET if missing or empty
if grep -qE '^COOKIE_SECRET=.+' "$ENV_FILE"; then
  echo "COOKIE_SECRET already present — SKIP"
else
  # Remove any empty-value lines first
  sed -i '/^COOKIE_SECRET=$/d' "$ENV_FILE"
  echo "COOKIE_SECRET=${COOKIE_SECRET}" >> "$ENV_FILE"
  echo "COOKIE_SECRET added"
fi

echo "--- verify (lengths only) ---"
grep -E '^(COOKIE_SECRET|MEILISEARCH_API_KEY)=' "$ENV_FILE" | awk -F= '{print $1, "len="length($2)}'
