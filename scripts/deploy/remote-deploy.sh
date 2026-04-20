#!/bin/bash
# ============================================================================
# TOPLA.UZ — VM-side deploy script
# Called by scripts/deploy.ps1 over SSH
# Usage: remote-deploy.sh <archive_path> <release_id>
# ============================================================================
set -euo pipefail

ARCHIVE="${1:-}"
RELEASE_ID="${2:-$(date +%Y%m%d_%H%M%S)}"
REMOTE_ROOT="/home/yc-user/topla"
BACKUP_RETENTION=3
HEALTH_URL="https://api.topla.uz/health"
HEALTH_RETRIES=12
HEALTH_DELAY=5

log()  { echo "[$(date +%H:%M:%S)] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }

[ -n "$ARCHIVE" ] || fail "archive path required"
[ -f "$ARCHIVE" ] || fail "archive not found: $ARCHIVE"

BACKUP_DIR="${REMOTE_ROOT}.bak-${RELEASE_ID}"
ENV_FILE="${REMOTE_ROOT}/.env"
ENV_LOCAL_FILE="${REMOTE_ROOT}/.env.local"

# --- 1. Backup current release ----------------------------------------------
if [ -d "$REMOTE_ROOT" ]; then
  log "Backing up current release → $BACKUP_DIR"
  sudo cp -a "$REMOTE_ROOT" "$BACKUP_DIR"
else
  log "No current release; fresh install"
  sudo mkdir -p "$REMOTE_ROOT"
fi

# --- 2. Preserve env files --------------------------------------------------
# Saqlab qo'yamiz, keyinroq qaytaramiz
TMP_ENV="$(mktemp -d)"
for f in .env .env.local; do
  if [ -f "${REMOTE_ROOT}/${f}" ]; then
    sudo cp "${REMOTE_ROOT}/${f}" "${TMP_ENV}/${f}"
    log "Preserved ${f}"
  fi
done

# --- 3. Extract new release into REMOTE_ROOT --------------------------------
log "Wiping stale source (keeping uploads/ and env files)"
# Eskirgan source fayllarni tozalaymiz, lekin `uploads/` ma'lumotlarini saqlaymiz.
# .env fayllari TMP_ENV'da saqlangan, ular keyinroq qaytariladi.
sudo find "$REMOTE_ROOT" -mindepth 1 -maxdepth 1 \
  ! -name 'uploads' \
  ! -name '.env' \
  ! -name '.env.local' \
  ! -name '.env.*' \
  -exec rm -rf {} +

log "Extracting archive → $REMOTE_ROOT"
sudo tar -xzf "$ARCHIVE" -C "$REMOTE_ROOT" --no-same-owner

# --- 4. Restore env files ---------------------------------------------------
for f in .env .env.local; do
  if [ -f "${TMP_ENV}/${f}" ]; then
    sudo cp "${TMP_ENV}/${f}" "${REMOTE_ROOT}/${f}"
  fi
done
rm -rf "$TMP_ENV"

# --- 5. Build + up ----------------------------------------------------------
cd "$REMOTE_ROOT"

# docker compose default faqat .env ni o'qiydi — shuning uchun .env.local ichidagi
# yetishmayotgan kalitlarni .env'ga qo'shib qo'yamiz (idempotent). .env har doim ustunlik qiladi.
if [ -f .env.local ] && [ ! -f .env ]; then
  sudo cp .env.local .env
elif [ -f .env ] && [ -f .env.local ]; then
  sudo cp .env ".env.bak-pre-merge-${RELEASE_ID}"
  sudo awk -F= 'NR==FNR{ if (/^[A-Z_]/) { sub(/=.*/,""); a[$0]=1 } ; next } /^[A-Z_]/ { k=$1; if (!(k in a)) print }' \
    .env .env.local | sudo tee -a .env >/dev/null
  log "Merged new keys from .env.local → .env"
fi

log "docker compose build"
sudo docker compose -f docker-compose.prod.yml build 2>&1 | tail -30

log "docker compose up -d"
sudo docker compose -f docker-compose.prod.yml up -d --remove-orphans 2>&1 | tail -10

# --- 6. Health check --------------------------------------------------------
log "Health check ($HEALTH_URL)"
HEALTHY=0
for i in $(seq 1 $HEALTH_RETRIES); do
  sleep $HEALTH_DELAY
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    log "✅ Health check passed (attempt $i/$HEALTH_RETRIES)"
    HEALTHY=1
    break
  fi
  log "⏳ attempt $i/$HEALTH_RETRIES — waiting..."
done

# --- 7. Auto-rollback on failure --------------------------------------------
if [ "$HEALTHY" -ne 1 ]; then
  log "❌ Health check FAILED — rolling back to $BACKUP_DIR"
  if [ -d "$BACKUP_DIR" ]; then
    sudo rm -rf "$REMOTE_ROOT"
    sudo mv "$BACKUP_DIR" "$REMOTE_ROOT"
    cd "$REMOTE_ROOT"
    sudo docker compose -f docker-compose.prod.yml up -d --remove-orphans 2>&1 | tail -5
    log "Rollback complete — still investigate what went wrong."
  else
    log "⚠️ No backup to rollback to — manual intervention required"
  fi
  exit 1
fi

# --- 8. Prune old backups (keep last N) -------------------------------------
log "Pruning old backups (keep last $BACKUP_RETENTION)"
# shellcheck disable=SC2012
OLD_BACKUPS=$(ls -dt /home/yc-user/topla.bak-* 2>/dev/null | tail -n +$((BACKUP_RETENTION + 1)) || true)
if [ -n "$OLD_BACKUPS" ]; then
  echo "$OLD_BACKUPS" | xargs -r sudo rm -rf
  log "Removed $(echo "$OLD_BACKUPS" | wc -l) old backup(s)"
fi

# --- 9. Show final status ---------------------------------------------------
log "Final container status:"
sudo docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'topla-|nginx|api|web|postgres|redis|meili|clip|certbot' || true

log "✅ Deploy complete — release $RELEASE_ID"
echo "DONE $RELEASE_ID"
