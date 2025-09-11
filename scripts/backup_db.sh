#!/bin/bash
set -euo pipefail
BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
find "$BACKUP_DIR" -type f -mtime +7 -name 'backup_*.sql' -delete
