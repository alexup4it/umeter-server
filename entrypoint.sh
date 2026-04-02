#!/bin/sh
set -e

echo "Running database migrations..."
if ! node node_modules/prisma/build/index.js migrate deploy; then
  echo "ERROR: Migration failed. Container will NOT restart."
  echo "Fix the migration and redeploy."
  exit 0
fi

echo "Starting server..."
exec node server.js
