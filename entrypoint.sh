#!/bin/sh
echo "Running database migrations..."
node /app/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma 2>&1
if [ $? -ne 0 ]; then
  echo "ERROR: Database migration failed. Retrying in 5 seconds..."
  sleep 5
  node /app/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=prisma/schema.prisma 2>&1
  if [ $? -ne 0 ]; then
    echo "FATAL: Database migration failed after retry. Aborting startup."
    exit 1
  fi
fi
echo "Migrations complete. Starting server..."
exec node server.js
