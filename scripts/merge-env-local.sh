#!/bin/bash
# Merge .env.local missing keys into .env (idempotent).
# .env wins for duplicates.
set -euo pipefail
cd /home/yc-user/topla

[ -f .env ] || { echo "FAIL: .env missing"; exit 1; }
[ -f .env.local ] || { echo "FAIL: .env.local missing"; exit 1; }

BACKUP=".env.bak-pre-merge-$(date +%Y%m%d_%H%M%S)"
cp .env "$BACKUP"
echo "BACKUP: $BACKUP"

# Append keys from .env.local that don't exist in .env
awk -F= 'NR==FNR{ if (/^[A-Z_]/) { sub(/=.*/,""); a[$0]=1 } ; next } /^[A-Z_]/ { k=$1; if (!(k in a)) print }' .env .env.local >> .env

echo "--- KEYS in .env now ---"
grep -cE '^[A-Z_]' .env
echo "--- SENTRY/RECAPTCHA in .env ---"
grep -E '^(NEXT_PUBLIC_)?(SENTRY|RECAPTCHA)' .env | awk -F= '{print $1, "len="length($2)}'
