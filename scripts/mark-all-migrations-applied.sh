#!/bin/bash
# Mark all Prisma migrations as applied
# This is needed when you manually created tables in the database

echo "Marking all Prisma migrations as applied..."

# Get all migration directories
for migration_dir in prisma/migrations/*/; do
    if [ -d "$migration_dir" ]; then
        migration_name=$(basename "$migration_dir")
        echo "Marking $migration_name as applied..."
        npx prisma migrate resolve --applied "$migration_name" || echo "Failed to mark $migration_name"
    fi
done

echo "Done! Checking status..."
npx prisma migrate status
