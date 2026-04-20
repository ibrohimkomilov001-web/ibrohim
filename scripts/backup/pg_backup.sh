#!/usr/bin/env bash
# ==============================================================================
#  Topla PostgreSQL -> Yandex Object Storage backup
# ==============================================================================
#  - Daily dump with 30-day retention (prefix daily/)
#  - Weekly dump (Sun) with 90-day retention (prefix weekly/)
#  - Encrypts with gpg (AES256) if BACKUP_GPG_PASSPHRASE is set
#  - Verifies dump restore integrity with `pg_restore --list` (fail fast)
#  - Designed to be idempotent under systemd OnCalendar timers
#
#  Required env (read from /etc/topla/backup.env if present):
#    DATABASE_URL              postgresql://user:pass@host:6432/db?sslmode=require
#    S3_ENDPOINT               https://storage.yandexcloud.net
#    S3_REGION                 ru-central1
#    S3_ACCESS_KEY             YC static-key id
#    S3_SECRET_KEY             YC static-key secret
#    S3_BUCKET_BACKUPS         topla-backups
#  Optional:
#    BACKUP_GPG_PASSPHRASE     enables encryption
#    BACKUP_RETENTION_DAILY    days (default 30)
#    BACKUP_RETENTION_WEEKLY   days (default 90)
#    HEALTHCHECK_URL           optional hc ping URL (curl on success)
#    SLACK_WEBHOOK_URL         optional failure notification
#
#  Exit codes:
#    0  success
#    1  env / prerequisite failure
#    2  pg_dump failure
#    3  verify failure
#    4  upload failure
# ==============================================================================

set -Eeuo pipefail
umask 077

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
err() { log "ERROR: $*" >&2; }

notify_failure() {
    local msg="$1"
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -fsS -m 10 -X POST -H 'Content-Type: application/json' \
            --data "{\"text\":\"[topla-backup] ${msg}\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null || true
    fi
}

on_error() {
    local ec=$?
    err "backup failed (exit $ec) at line $BASH_LINENO"
    notify_failure "backup failed (exit $ec) on $(hostname)"
    exit "$ec"
}
trap on_error ERR

# --- Load env file if present -------------------------------------------------
ENV_FILE="${BACKUP_ENV_FILE:-/etc/topla/backup.env}"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
fi

# --- Validate required vars ---------------------------------------------------
required=(DATABASE_URL S3_ENDPOINT S3_REGION S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET_BACKUPS)
for v in "${required[@]}"; do
    if [[ -z "${!v:-}" ]]; then
        err "missing env var: $v"
        exit 1
    fi
done

# --- Tool checks --------------------------------------------------------------
for tool in pg_dump aws gzip; do
    command -v "$tool" >/dev/null 2>&1 || { err "required tool missing: $tool"; exit 1; }
done
if [[ -n "${BACKUP_GPG_PASSPHRASE:-}" ]]; then
    command -v gpg >/dev/null 2>&1 || { err "gpg required when BACKUP_GPG_PASSPHRASE set"; exit 1; }
fi

RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-30}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-90}"

# --- Determine prefix (daily / weekly) ----------------------------------------
TS=$(date -u +%Y%m%dT%H%M%SZ)
DOW=$(date -u +%u)  # 1..7 (Mon..Sun)
MODE="${1:-${BACKUP_MODE:-auto}}"
case "$MODE" in
    auto)   if [[ "$DOW" == "7" ]]; then PREFIX=weekly; else PREFIX=daily; fi ;;
    daily)  PREFIX=daily ;;
    weekly) PREFIX=weekly ;;
    *) err "invalid MODE: $MODE (expected auto|daily|weekly)"; exit 1 ;;
esac

# --- Work dir -----------------------------------------------------------------
WORKDIR=$(mktemp -d -t topla-backup.XXXXXX)
trap 'rm -rf "$WORKDIR"; on_error' ERR
cleanup() { rm -rf "$WORKDIR"; }
trap 'cleanup' EXIT

BASENAME="topla-${PREFIX}-${TS}.dump"
DUMP_FILE="$WORKDIR/$BASENAME"

log "starting $PREFIX backup -> $BASENAME"

# --- pg_dump (custom format + compression level 9) ----------------------------
# NOTE: --no-owner/--no-privileges makes the dump portable across Managed PG
# instances when credentials differ. Adjust if you need role ownership.
if ! pg_dump \
        --dbname="$DATABASE_URL" \
        --format=custom \
        --compress=9 \
        --no-owner \
        --no-privileges \
        --file="$DUMP_FILE"; then
    err "pg_dump failed"
    exit 2
fi

DUMP_SIZE=$(stat -c '%s' "$DUMP_FILE")
log "dump created: ${DUMP_SIZE} bytes"

# --- Integrity check ----------------------------------------------------------
if ! pg_restore --list "$DUMP_FILE" >/dev/null; then
    err "dump verify failed"
    exit 3
fi
log "dump verified"

# --- Optional encryption ------------------------------------------------------
UPLOAD_FILE="$DUMP_FILE"
UPLOAD_NAME="$BASENAME"
if [[ -n "${BACKUP_GPG_PASSPHRASE:-}" ]]; then
    log "encrypting with gpg AES256"
    echo -n "$BACKUP_GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
        --symmetric --cipher-algo AES256 \
        --output "${DUMP_FILE}.gpg" "$DUMP_FILE"
    UPLOAD_FILE="${DUMP_FILE}.gpg"
    UPLOAD_NAME="${BASENAME}.gpg"
fi

# --- Compute sha256 sidecar ---------------------------------------------------
SHA_FILE="$WORKDIR/${UPLOAD_NAME}.sha256"
( cd "$WORKDIR" && sha256sum "$(basename "$UPLOAD_FILE")" > "$SHA_FILE" )

# --- Upload to Yandex Object Storage (S3-compatible) --------------------------
export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
export AWS_DEFAULT_REGION="$S3_REGION"

S3_URI="s3://${S3_BUCKET_BACKUPS}/${PREFIX}/${UPLOAD_NAME}"
SHA_URI="s3://${S3_BUCKET_BACKUPS}/${PREFIX}/${UPLOAD_NAME}.sha256"

log "uploading -> $S3_URI"
if ! aws --endpoint-url "$S3_ENDPOINT" s3 cp "$UPLOAD_FILE" "$S3_URI" \
        --storage-class STANDARD --only-show-errors; then
    err "upload failed"
    exit 4
fi
aws --endpoint-url "$S3_ENDPOINT" s3 cp "$SHA_FILE" "$SHA_URI" \
    --storage-class STANDARD --only-show-errors

# --- Retention purge ----------------------------------------------------------
# Yandex Object Storage honours S3 lifecycle rules — those are preferred for
# production. This script also enforces retention at the client level as a
# safety net (idempotent: deletes only files older than N days in the prefix).
purge_prefix() {
    local prefix="$1" days="$2"
    local cutoff
    cutoff=$(date -u -d "$days days ago" +%s)
    log "purging s3://${S3_BUCKET_BACKUPS}/${prefix}/ older than $days days"
    aws --endpoint-url "$S3_ENDPOINT" s3api list-objects-v2 \
        --bucket "$S3_BUCKET_BACKUPS" --prefix "${prefix}/" \
        --query 'Contents[].[Key,LastModified]' --output text 2>/dev/null \
        | while read -r key lastmod; do
            [[ -z "$key" || "$key" == "None" ]] && continue
            local mod_ts
            mod_ts=$(date -u -d "$lastmod" +%s 2>/dev/null || echo 0)
            if (( mod_ts > 0 && mod_ts < cutoff )); then
                log "  delete $key"
                aws --endpoint-url "$S3_ENDPOINT" s3 rm \
                    "s3://${S3_BUCKET_BACKUPS}/${key}" --only-show-errors || true
            fi
        done
}

case "$PREFIX" in
    daily)  purge_prefix daily  "$RETENTION_DAILY" ;;
    weekly) purge_prefix weekly "$RETENTION_WEEKLY" ;;
esac

# --- Health ping --------------------------------------------------------------
if [[ -n "${HEALTHCHECK_URL:-}" ]]; then
    curl -fsS -m 10 "$HEALTHCHECK_URL" >/dev/null || true
fi

log "SUCCESS: $UPLOAD_NAME (${DUMP_SIZE} bytes) -> $S3_URI"
exit 0
