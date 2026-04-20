#!/bin/bash
# ============================================================================
# TOPLA.UZ — Rollback to the most recent backup
# Usage: remote-rollback.sh [backup_name]
#        If backup_name is empty, uses the newest topla.bak-*
# ============================================================================
set -euo pipefail

REMOTE_ROOT="/home/yc-user/topla"
BACKUP_GLOB="/home/yc-user/topla.bak-*"

log()  { echo "[$(date +%H:%M:%S)] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  TARGET=$(ls -dt $BACKUP_GLOB 2>/dev/null | head -1 || true)
fi
[ -n "$TARGET" ]   || fail "no backup found (pattern $BACKUP_GLOB)"
[ -d "$TARGET" ]   || fail "backup dir not found: $TARGET"

log "Rolling back: $REMOTE_ROOT ← $TARGET"

# 1. Keep a safety backup of the (broken) current release
SAFETY="${REMOTE_ROOT}.broken-$(date +%Y%m%d_%H%M%S)"
if [ -d "$REMOTE_ROOT" ]; then
  sudo mv "$REMOTE_ROOT" "$SAFETY"
  log "Current (broken?) release saved to $SAFETY"
fi

# 2. Restore
sudo cp -a "$TARGET" "$REMOTE_ROOT"

# 3. docker compose up
cd "$REMOTE_ROOT"
log "docker compose up -d"
sudo docker compose -f docker-compose.prod.yml up -d --remove-orphans 2>&1 | tail -10

# 4. Health check
HEALTH_URL="http://127.0.0.1:3001/health"
HEALTHY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 5
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    HEALTHY=1
    log "✅ Health check passed (attempt $i)"
    break
  fi
  log "⏳ health attempt $i/10..."
done

if [ "$HEALTHY" -ne 1 ]; then
  log "⚠️ Rollback completed but health check still failing"
  exit 2
fi

log "✅ Rollback complete"
echo "DONE"
