#!/bin/bash
set -e

echo "Starting SYB Prayer Times Backend..."

# Ensure we're in the backend directory
cd "$(dirname "$0")"

# Copy Prisma schema to backend
echo "Copying Prisma schema..."
mkdir -p prisma
cp ../prisma/schema.prisma ./prisma/

# Generate Prisma client in backend
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting scheduler..."
node dist/index.js