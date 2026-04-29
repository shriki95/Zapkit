#!/bin/bash
set -e

echo "🏗️  Building ZapKit..."

# Create dist directory
mkdir -p dist

# Copy home page
echo "📄 Copying home page..."
mkdir -p dist/home
cp -r home/* dist/home/

# Build TinyLink Pro
echo "🔗 Building TinyLink Pro..."
cd tinylink-pro/frontend
rm -rf node_modules package-lock.json
npm install --silent
npm run build
cd ../..
mkdir -p dist/tinylink
cp -r tinylink-pro/frontend/dist/* dist/tinylink/

# Build QR Generator Pro
echo "📱 Building QR Generator Pro..."
cd qr-generator-pro/frontend
rm -rf node_modules package-lock.json
npm install --silent
npm run build
cd ../..
mkdir -p dist/qr
cp -r qr-generator-pro/frontend/dist/* dist/qr/

echo "✅ Build complete!"
echo "📦 Files ready in dist/"
