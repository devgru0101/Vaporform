#!/bin/bash

# Test Vaporform Encore Application
# This script tests that the application is running correctly

echo "🧪 Testing Vaporform Encore Application"
echo "======================================="

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl not found. Please install curl to run tests."
    exit 1
fi

echo "⏳ Waiting for application to start..."
sleep 3

echo "🔍 Testing health endpoint..."
if curl -f -s http://localhost:4000/health > /dev/null; then
    echo "✅ Health endpoint is responding"
    echo "📊 Health check response:"
    curl -s http://localhost:4000/health | head -c 200
    echo ""
else
    echo "❌ Health endpoint is not responding"
    echo "   Make sure the app is running with: npm run dev"
fi

echo ""
echo "🔍 Testing hello endpoint..."
if curl -f -s http://localhost:4000/hello/Test > /dev/null; then
    echo "✅ Hello endpoint is responding"
    echo "📊 Hello endpoint response:"
    curl -s http://localhost:4000/hello/Test | head -c 200
    echo ""
else
    echo "❌ Hello endpoint is not responding"
    echo "   Make sure the app is running with: npm run dev"
fi

echo ""
echo "🎯 If endpoints are working, your app is available at:"
echo "   📊 Dashboard: http://localhost:9400/vaporform"
echo "   🌐 API: http://localhost:4000"
echo ""
echo "🔗 Test URLs:"
echo "   curl http://localhost:4000/health"
echo "   curl http://localhost:4000/hello/YourName"