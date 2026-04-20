#!/usr/bin/env bash
# ==============================================================================
#  Topla PostgreSQL restore — interactive, safety-first
# ==============================================================================
#  Usage: pg_restore.sh <s3-key-or-local-file> [--target-db URL]
#
#  Examples:
#    pg_restore.sh daily/topla-daily-20260419T030000Z.dump.gpg
#    pg_restore.sh ./local.dump --target-db postgresql://user:pass@host/db_test
#
#  Behaviour:
#    - Downloads from s3://$S3_BUCKET_BACKUPS/<key> if argument is not a file
#    - Decrypts if filename ends with .gpg (uses BACKUP_GPG_PASSPHRASE)
#    - Refuses to restore into DATABASE_URL unless --force-into-prod is passed
#    - Always uses pg_restore --clean --if-exists to replace
# ==============================================================================

set -Eeuo pipefail
umask 077

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
err() { log "ERROR: $*" >&2; }

ENV_FILE="${BACKUP_ENV_FILE:-/etc/topla/backup.env}"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
fi

if [[ $# -lt 1 ]]; then
    err "usage: $0 <s3-key|local-file> [--target-db URL] [--force-into-prod]"
    exit 1
fi

INPUT="$1"; shift || true
TARGET_DB=""
FORCE_PROD=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target-db) TARGET_DB="$2"; shift 2 ;;
        --force-into-prod) FORCE_PROD=1; shift ;;
        *) err "unknown arg: $1"; exit 1 ;;
    esac
done

if [[ -z "$TARGET_DB" ]]; then
    TARGET_DB="${DATABASE_URL:-}"
    if [[ -z "$TARGET_DB" ]]; then
        err "no --target-db and no DATABASE_URL in env"
        exit 1
    fi
    if [[ "$FORCE_PROD" != "1" ]]; then
        err "refusing to restore into DATABASE_URL without --force-into-prod"
        exit 1
    fi
fi

WORKDIR=$(mktemp -d -t topla-restore.XXXXXX)
trap 'rm -rf "$WORKDIR"' EXIT

if [[ -f "$INPUT" ]]; then
    SRC="$INPUT"
else
    : "${S3_BUCKET_BACKUPS:?required}" "${S3_ENDPOINT:?required}"
    export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY:?required}"
    export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY:?required}"
    export AWS_DEFAULT_REGION="${S3_REGION:-ru-central1}"
    SRC="$WORKDIR/$(basename "$INPUT")"
    log "downloading s3://${S3_BUCKET_BACKUPS}/${INPUT}"
    aws --endpoint-url "$S3_ENDPOINT" s3 cp \
        "s3://${S3_BUCKET_BACKUPS}/${INPUT}" "$SRC" --only-show-errors
fi

if [[ "$SRC" == *.gpg ]]; then
    : "${BACKUP_GPG_PASSPHRASE:?required for encrypted backup}"
    OUT="${SRC%.gpg}"
    log "decrypting"
    echo -n "$BACKUP_GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
        --decrypt --output "$OUT" "$SRC"
    SRC="$OUT"
fi

log "verifying dump"
pg_restore --list "$SRC" >/dev/null

log "restoring into target DB"
pg_restore --dbname="$TARGET_DB" --clean --if-exists --no-owner --no-privileges \
    --exit-on-error --jobs=4 "$SRC"

log "SUCCESS"
