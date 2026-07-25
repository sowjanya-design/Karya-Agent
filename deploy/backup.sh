#!/usr/bin/env bash
# Nightly Postgres backup for the karya database. Run via cron (see
# deploy/VPS_SETUP.md step 4). Keeps 14 days of dumps, deletes older ones.
set -euo pipefail

DB_NAME="karya"
DB_USER="karya_user"
BACKUP_DIR="/var/backups/karya"
KEEP_DAYS=14
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/karya_$STAMP.dump"

mkdir -p "$BACKUP_DIR"

pg_dump -h localhost -U "$DB_USER" -Fc -f "$FILE" "$DB_NAME"
echo "[backup] wrote $FILE"

find "$BACKUP_DIR" -name 'karya_*.dump' -mtime "+$KEEP_DAYS" -delete
echo "[backup] pruned dumps older than $KEEP_DAYS days"
