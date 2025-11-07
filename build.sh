#!/bin/bash

# Build script for the Company Intelligence Platform Backend

set -e

echo "🚀 Building Company Intelligence Platform Backend..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run type checking
echo "🔍 Running type check..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint

# Run tests (if any)
if npm run --silent 2>/dev/null | grep -q "test"; then
    echo "🧪 Running tests..."
    npm test
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t company-sense-backend .

echo "✅ Build completed successfully!"
echo ""
echo "To run the application:"
echo "  Development: npm run dev"
echo "  Production:  docker-compose up"
echo "  Worker only: docker-compose up worker"