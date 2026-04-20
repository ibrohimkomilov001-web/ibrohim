#!/bin/bash
# Env audit — lengths only, never print values
set -uo pipefail
ENV_FILE="${1:-/home/yc-user/topla/.env}"
if [ ! -r "$ENV_FILE" ]; then
  echo "Cannot read $ENV_FILE" >&2
  exit 1
fi

check() {
  local key="$1"; local min="$2"
  local val
  val=$(grep -E "^${key}=" "$ENV_FILE" | head -1 | sed "s/^${key}=//")
  if [ -z "$val" ]; then
    echo "MISSING  $key"
    return
  fi
  local n=${#val}
  if [ "$n" -ge "$min" ]; then
    echo "OK       $key len=$n"
  elif [ "$n" -ge $((min/2)) ]; then
    echo "WEAK     $key len=$n (need >=$min)"
  else
    echo "CRITICAL $key len=$n (need >=$min)"
  fi
}

echo "=== Secret length audit ==="
for k in JWT_SECRET JWT_REFRESH_SECRET COOKIE_SECRET MEILISEARCH_API_KEY REDIS_PASSWORD POSTGRES_PASSWORD S3_SECRET_KEY TURNSTILE_SECRET_KEY RECAPTCHA_SECRET_KEY BACKUP_GPG_PASSPHRASE; do
  check "$k" 32
done

echo ""
echo "=== Checks ==="
jwt=$(grep -E '^JWT_SECRET=' "$ENV_FILE" | head -1 | sed 's/^JWT_SECRET=//')
jwtr=$(grep -E '^JWT_REFRESH_SECRET=' "$ENV_FILE" | head -1 | sed 's/^JWT_REFRESH_SECRET=//')
if [ -n "$jwt" ] && [ "$jwt" = "$jwtr" ]; then
  echo "CRITICAL JWT_SECRET == JWT_REFRESH_SECRET (must differ)"
else
  echo "OK       JWT_SECRET != JWT_REFRESH_SECRET"
fi

if grep -qE '^CORS_ORIGINS=.*localhost' "$ENV_FILE"; then
  echo "WARN     CORS_ORIGINS contains localhost"
else
  echo "OK       CORS_ORIGINS no localhost"
fi

if grep -qE '^DATABASE_URL=.*sslmode=(require|verify-full)' "$ENV_FILE"; then
  echo "OK       DATABASE_URL sslmode present"
else
  echo "WARN     DATABASE_URL missing sslmode=require"
fi

if grep -qE '^NODE_ENV=production' "$ENV_FILE"; then
  echo "OK       NODE_ENV=production"
else
  echo "WARN     NODE_ENV != production"
fi

for default in 'CHANGE_ME' 'your-secret' 'replace-me' 'topla-dev'; do
  if grep -qiE "=.*${default}" "$ENV_FILE"; then
    echo "CRITICAL default placeholder '$default' detected"
  fi
done
