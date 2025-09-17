#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if server address is provided
if [ -z "$1" ]; then
  echo "Usage: $0 user@server.address"
  exit 1
fi

SERVER=$1
# IMPORTANT: Change this to the actual path of your application on the server
APP_DIR="/path/to/your/app"

echo "🚀 Deploying to ${SERVER}..."

ssh $SERVER << EOF
  set -e
  echo "→ Navigating to application directory: ${APP_DIR}"
  cd ${APP_DIR}

  if [ ! -f ".env" ] && [ ! -f "backend/.env" ]; then
    echo "❌ لا يوجد .env في $APP_DIR أو backend/.env" >&2
    exit 1
  fi
  echo "✅ .env جاهز"

  echo "→ Pulling latest changes from main branch..."
  git pull origin main

  echo "→ Installing backend dependencies..."
  cd backend
  npm install --production

  echo "→ Building backend..."
  npm run build

  echo "→ Running database migrations..."
  npm run migrate:up

  echo "→ Reloading application with PM2..."
  npm run prod:reload

  echo "✅ Deployment successful!"
EOF
