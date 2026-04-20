#!/bin/bash
# Update SENTRY_DSN in prod .env and .env.local with backend (Node.js) DSN.
# NEXT_PUBLIC_SENTRY_DSN (Next.js DSN) qoldiriladi.
set -euo pipefail
cd /home/yc-user/topla

BACKEND_DSN='https://8726423b94fb120f02fb2e05a98d60e3@o4511248945446912.ingest.de.sentry.io/4511249094738000'

for F in .env .env.local; do
  [ -f "$F" ] || continue
  cp "$F" "${F}.bak-backend-sentry-$(date +%Y%m%d_%H%M%S)"
  # NEXT_PUBLIC_SENTRY_DSN liniyasiga tegmasdan, faqat SENTRY_DSN= ni almashtiramiz
  sed -i '/^SENTRY_DSN=/d' "$F"
  echo "SENTRY_DSN=${BACKEND_DSN}" >> "$F"
  echo "--- $F ---"
  grep -E '^(NEXT_PUBLIC_)?SENTRY_DSN=' "$F" | awk -F= '{print $1, "len="length($2)}'
done
