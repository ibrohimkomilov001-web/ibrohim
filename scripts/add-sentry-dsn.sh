#!/bin/bash
set -euo pipefail
DSN='https://3fe8617996997691347cae8be6ffeeed@o4511248945446912.ingest.de.sentry.io/4511248948985936'
ENV_FILE="/home/yc-user/topla/.env.local"
BACKUP="${ENV_FILE}.bak-$(date +%Y%m%d_%H%M%S)"

sudo cp "$ENV_FILE" "$BACKUP"
echo "BACKUP_OK: $BACKUP"

# remove any existing sentry lines
sudo sed -i '/^SENTRY_DSN=/d; /^NEXT_PUBLIC_SENTRY_DSN=/d' "$ENV_FILE"

# append new
echo "SENTRY_DSN=$DSN"             | sudo tee -a "$ENV_FILE" >/dev/null
echo "NEXT_PUBLIC_SENTRY_DSN=$DSN" | sudo tee -a "$ENV_FILE" >/dev/null

echo "--- verify ---"
sudo grep -E '^(NEXT_PUBLIC_)?SENTRY_DSN=' "$ENV_FILE" | awk -F= '{print $1, "len="length($2)}'
