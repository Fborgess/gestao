#!/usr/bin/env bash
set -e

# Build frontend
echo "Building frontend..."
cd frontend && npm install && npm run build && cd ..

# Run backend
echo "Starting backend..."
cd backend
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
