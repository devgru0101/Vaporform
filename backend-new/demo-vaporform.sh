#!/bin/bash

# Vaporform Demo Script
# This script demonstrates the complete setup and verification workflow

echo "🎪 Vaporform Encore TypeScript Application Demo"
echo "==============================================="

echo ""
echo "📋 This demo will:"
echo "   1. Show current directory contents"
echo "   2. Verify the vaporform app configuration"
echo "   3. List available scripts"
echo "   4. Show next steps"

echo ""
echo "📁 Current directory contents:"
ls -la *.sh *.md 2>/dev/null || echo "No setup files found"

echo ""
echo "🔍 Vaporform app configuration:"
if [ -f "vaporform/encore.app" ]; then
    echo "✅ encore.app found:"
    cat vaporform/encore.app
else
    echo "❌ vaporform app not found. Run ./setup-vaporform.sh first"
    exit 1
fi

echo ""
echo "📊 Vaporform project structure:"
if [ -d "vaporform" ]; then
    echo "✅ Project structure:"
    tree vaporform/ 2>/dev/null || find vaporform/ -type f | head -10
else
    echo "❌ vaporform directory not found"
fi

echo ""
echo "🛠️ Available scripts:"
echo "   📦 ./setup-vaporform.sh    - Complete setup with validation"
echo "   🚀 ./run-vaporform.sh      - Start the development server"
echo "   🧪 ./test-vaporform.sh     - Test endpoints"
echo "   📝 ./create-vaporform-app.sh - Basic creation script"

echo ""
echo "🎯 Quick start commands:"
echo "   # 1. Setup (if not done already):"
echo "   ./setup-vaporform.sh"
echo ""
echo "   # 2. Start development server:"
echo "   cd vaporform && npm run dev"
echo ""
echo "   # 3. Test (in another terminal):"
echo "   ./test-vaporform.sh"

echo ""
echo "🌐 Application URLs:"
echo "   📊 Dashboard: http://localhost:9400/vaporform"
echo "   🔌 API: http://localhost:4000"
echo "   ❤️  Health: http://localhost:4000/health"
echo "   👋 Hello: http://localhost:4000/hello/YourName"

echo ""
echo "✨ Key achievements:"
echo "   ✅ Clean app ID: 'vaporform' (not random like 'uvfk4')"
echo "   ✅ Local-only setup (no cloud integration)"
echo "   ✅ Complete TypeScript project structure"
echo "   ✅ Built-in health monitoring"
echo "   ✅ Ready for development"

echo ""
echo "📚 Documentation:"
echo "   📖 See VAPORFORM_SETUP.md for detailed instructions"
echo "   📋 See vaporform/README.md for project information"

echo ""
echo "🎉 Demo complete! Your Vaporform Encore app is ready."