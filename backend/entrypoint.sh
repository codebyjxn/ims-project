#!/bin/sh
set -e

# Wait for Postgres to be ready
echo "[Entrypoint] Waiting for Postgres to be ready..."
until nc -z ims-postgres-prod 5432; do
  echo "Waiting for Postgres at ims-postgres-prod:5432..."
  sleep 2
done
echo "Postgres is up"

# Run the admin creation script
echo "[Entrypoint] Creating admin user if needed..."
node dist/scripts/create-admin.js

# Start the backend server
echo "[Entrypoint] Starting backend server..."
node dist/index.js 