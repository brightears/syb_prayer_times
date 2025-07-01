#!/bin/bash
set -e

echo "Creating Prisma directory..."
mkdir -p prisma

echo "Copying Prisma schema..."
cp ../prisma/schema.prisma ./prisma/

echo "Installing web dependencies (will also generate Prisma client)..."
npm install --legacy-peer-deps

echo "Building Next.js..."
npm run build

echo "Web build complete!"