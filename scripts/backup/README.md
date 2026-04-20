# Topla PostgreSQL Backup (B1)

Client-side tooling for backing up the Topla Managed PostgreSQL database
to Yandex Object Storage (S3-compatible).

## Layout

```
scripts/backup/
├── pg_backup.sh              # main backup driver (auto | daily | weekly)
├── pg_restore.sh             # safe restore helper
├── backup.env.example        # example env file
└── systemd/
    ├── topla-backup.service
    └── topla-backup.timer    # OnCalendar=*-*-* 03:00 UTC
```

## What it does

1. `pg_dump` in custom format with compression level 9 (`--no-owner --no-privileges`).
2. `pg_restore --list` verify pass — fails fast on a corrupt dump.
3. Optional GPG AES256 symmetric encryption (set `BACKUP_GPG_PASSPHRASE`).
4. Uploads to `s3://$S3_BUCKET_BACKUPS/{daily|weekly}/topla-*.dump[.gpg]`
   + sha256 sidecar via AWS CLI against `storage.yandexcloud.net`.
5. Client-side retention purge (belt-and-braces on top of bucket lifecycle):
   - `daily/`  — 30 days  (override `BACKUP_RETENTION_DAILY`)
   - `weekly/` — 90 days  (override `BACKUP_RETENTION_WEEKLY`)
6. Optional success ping to `$HEALTHCHECK_URL`, failure post to `$SLACK_WEBHOOK_URL`.

`pg_backup.sh auto` picks `weekly/` on Sunday, `daily/` otherwise — so one
timer covers both schedules.

## Prerequisites on the VM

```bash
# PostgreSQL client tools matching server major version (e.g. 16)
sudo apt install -y postgresql-client-16 awscli gpg curl
```

Create a dedicated unprivileged system user that will own the job:

```bash
sudo useradd -r -s /usr/sbin/nologin topla-backup
sudo mkdir -p /var/log/topla
sudo chown topla-backup:topla-backup /var/log/topla
```

## Install

```bash
# 1. Copy scripts (from this repo on the VM or via scp)
sudo install -d /opt/topla/scripts/backup
sudo install -m 0755 pg_backup.sh pg_restore.sh /opt/topla/scripts/backup/

# 2. Env file (chmod 600 — holds S3 secret + optional GPG passphrase)
sudo install -d -m 0700 /etc/topla
sudo install -m 0600 backup.env.example /etc/topla/backup.env
sudo $EDITOR /etc/topla/backup.env

# 3. Systemd units
sudo install -m 0644 systemd/topla-backup.service /etc/systemd/system/
sudo install -m 0644 systemd/topla-backup.timer   /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now topla-backup.timer
```

## Bucket setup (one-time, in Yandex Cloud console or `yc`)

```bash
# Create the backup bucket with versioning + lifecycle
aws --endpoint-url https://storage.yandexcloud.net \
    s3api create-bucket --bucket topla-backups

# Enable versioning (protects against accidental overwrite/delete)
aws --endpoint-url https://storage.yandexcloud.net \
    s3api put-bucket-versioning \
    --bucket topla-backups \
    --versioning-configuration Status=Enabled

# Lifecycle: expire non-current versions after 30d; purge daily/ >30d,
# weekly/ >90d server-side (script is a safety net, not the primary rule).
# See Yandex docs: https://yandex.cloud/en/docs/storage/s3/api-ref/lifecycles
```

Minimum IAM policy for the static access key (service account), scoped to the
backup bucket only:

- `storage.uploader` on `topla-backups`
- `storage.viewer`   on `topla-backups`
- `storage.editor`   on `topla-backups`  (needed for lifecycle purge)

## Verify

```bash
# Manual run (as the service user, reads env file)
sudo systemctl start topla-backup.service
sudo journalctl -u topla-backup.service -e

# List what's in the bucket
aws --endpoint-url https://storage.yandexcloud.net \
    s3 ls s3://topla-backups/daily/

# Show next scheduled run
systemctl list-timers topla-backup.timer
```

## Restore (disaster recovery drill)

Restores NEVER go to production by default. Create a scratch DB first:

```bash
createdb topla_restore_test    # or provision a Managed PG test instance

sudo -u topla-backup /opt/topla/scripts/backup/pg_restore.sh \
    daily/topla-daily-20260419T030000Z.dump.gpg \
    --target-db postgresql://user:pass@host:6432/topla_restore_test
```

To restore into production (outage recovery) you **must** pass the explicit
flag — this is intentional:

```bash
sudo -u topla-backup /opt/topla/scripts/backup/pg_restore.sh <key> --force-into-prod
```

## Exit codes

| Code | Meaning                |
| ---- | ---------------------- |
| 0    | success                |
| 1    | env / prerequisite     |
| 2    | pg_dump failed         |
| 3    | dump verify failed     |
| 4    | S3 upload failed       |

## Security notes

- `backup.env` holds S3 static-key secret + optional GPG passphrase.
  Must be `chmod 600` and owned by root (service reads it via
  `EnvironmentFile=` before dropping to `topla-backup`).
- Prefer GPG encryption (`BACKUP_GPG_PASSPHRASE`) so backups are useless
  to anyone who compromises the bucket. Store the passphrase in a
  separate password manager — losing it means losing restore capability.
- Service uses a locked-down systemd sandbox
  (`ProtectSystem=strict`, `NoNewPrivileges`, seccomp filter, no caps).
- Never commit `/etc/topla/backup.env` to git.
