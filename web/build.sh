#!/bin/bash
set -e

echo "Installing web dependencies..."
npm install

echo "Creating Prisma directory..."
mkdir -p prisma

echo "Copying Prisma schema..."
cp ../prisma/schema.prisma ./prisma/

echo "Generating Prisma client for web..."
npx prisma generate

echo "Building Next.js..."
npm run build

echo "Web build complete!"