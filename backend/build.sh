#!/bin/bash
set -e

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
cd ..
npx prisma generate
cd backend

echo "Building TypeScript..."
npm run build

echo "Backend build complete!"