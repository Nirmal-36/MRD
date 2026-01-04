#!/bin/bash

# =====================================
# MRD SYSTEM - DATABASE RESTORE SCRIPT
# =====================================
# Restore PostgreSQL database from backup
# Usage: ./restore_database.sh <backup_file>

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$PROJECT_ROOT/backups/"mrd_backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "📂 Backup file: $BACKUP_FILE"
echo "🗄️  Target database: $DB_NAME"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo ""
echo "🔄 Starting database restore..."
echo "📅 Date: $(date)"
echo ""

# Extract and restore
export PGPASSWORD="$DB_PASSWORD"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Decompressing and restoring..."
    gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
else
    echo "📥 Restoring from uncompressed backup..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database restored successfully!"
    echo "🔄 You may need to restart the Django application"
else
    echo ""
    echo "❌ Error: Restore failed"
    exit 1
fi

unset PGPASSWORD
