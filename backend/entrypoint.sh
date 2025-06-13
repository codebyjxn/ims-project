#!/bin/sh
set -e

# Wait for Postgres to be ready
/app/wait-for-it.sh ims-postgres-prod:5432 --timeout=60 --strict -- echo "Postgres is up"

# Run the admin creation script
echo "[Entrypoint] Creating admin user if needed..."
node dist/scripts/create-admin.js

# Start the backend server
echo "[Entrypoint] Starting backend server..."
node dist/index.js 