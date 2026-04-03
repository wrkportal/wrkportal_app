#!/bin/sh
echo "Running database migrations..."
npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1 || echo "Migration warning: some migrations may have failed (non-fatal)"
echo "Starting server..."
exec node server.js
