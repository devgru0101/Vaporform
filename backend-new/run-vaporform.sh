#!/bin/bash
set -e

# Run Vaporform Encore Application
# This script sets up the environment and runs the Vaporform app

echo "🚀 Starting Vaporform Encore Application..."

# Add Encore to PATH if it's not already there
export PATH="/home/scott-sitzer/.encore/bin:$PATH"

# Verify Encore is available
if ! command -v encore &> /dev/null; then
    echo "❌ Encore CLI not found. Please install Encore first."
    echo "   Visit: https://encore.dev/docs/install"
    exit 1
fi

echo "✅ Encore CLI found: $(encore version 2>/dev/null || echo 'version check failed')"

# Change to the vaporform directory
cd vaporform

echo "📦 Installing/updating dependencies..."
npm install

echo "🔍 Verifying project structure..."
if [ ! -f "encore.app" ]; then
    echo "❌ encore.app file not found"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json file not found"  
    exit 1
fi

echo "✅ Project structure verified"

echo "🎯 Your Vaporform app will be available at:"
echo "   Dashboard: http://localhost:9400/vaporform"
echo "   API: http://localhost:4000"
echo ""
echo "📊 Available endpoints:"
echo "   GET /health - Health check"
echo "   GET /hello/:name - Welcome greeting"
echo ""
echo "🚀 Starting Encore development server..."
echo "   Press Ctrl+C to stop"
echo ""

# Start the Encore development server
exec npm run dev