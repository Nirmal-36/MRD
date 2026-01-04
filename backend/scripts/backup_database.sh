#!/bin/bash

# =====================================
# MRD SYSTEM - DATABASE BACKUP SCRIPT
# =====================================
# Automated PostgreSQL backup with rotation
# Usage: ./backup_database.sh

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

# Backup configuration
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mrd_backup_$DATE.sql"
BACKUP_COMPRESSED="$BACKUP_FILE.gz"
RETENTION_DAYS=30  # Keep backups for 30 days

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📅 Date: $(date)"
echo "🗄️  Database: $DB_NAME"
echo "📁 Backup location: $BACKUP_COMPRESSED"
echo ""

# Perform backup
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --no-owner \
    --no-acl \
    --format=plain \
    --file="$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully"
    
    # Compress the backup
    echo "🗜️  Compressing backup..."
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_COMPRESSED" | cut -f1)
        echo "✅ Backup compressed: $BACKUP_SIZE"
        
        # Remove old backups
        echo "🗑️  Cleaning up old backups (older than $RETENTION_DAYS days)..."
        find "$BACKUP_DIR" -name "mrd_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
        
        REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "mrd_backup_*.sql.gz" -type f | wc -l)
        echo "📊 Total backups: $REMAINING_BACKUPS"
        
        echo ""
        echo "✅ Backup completed successfully!"
        echo "📍 Location: $BACKUP_COMPRESSED"
    else
        echo "❌ Error: Failed to compress backup"
        exit 1
    fi
else
    echo "❌ Error: Backup failed"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Optional: Upload to cloud storage (uncomment and configure as needed)
# echo "☁️  Uploading to cloud storage..."
# aws s3 cp "$BACKUP_COMPRESSED" "s3://your-bucket/mrd-backups/" --region your-region
# OR
# rclone copy "$BACKUP_COMPRESSED" remote:mrd-backups/

echo ""
echo "💡 To restore this backup, run:"
echo "   gunzip -c $BACKUP_COMPRESSED | psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USER -d \$DB_NAME"
echo ""

unset PGPASSWORD
