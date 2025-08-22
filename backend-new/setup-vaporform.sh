#!/bin/bash
set -e

# Vaporform Encore TypeScript Application Setup
# This script creates and configures a properly named Encore app

echo "🚀 Vaporform Encore TypeScript Application Setup"
echo "================================================="

# Check if Encore CLI is available
export PATH="/home/scott-sitzer/.encore/bin:$PATH"

if ! command -v encore &> /dev/null; then
    echo "❌ Encore CLI not found. Please install Encore first."
    echo "   Visit: https://encore.dev/docs/install"
    exit 1
fi

echo "✅ Encore CLI found: $(encore version)"

# Remove existing vaporform directory if it exists
if [ -d "vaporform" ]; then
    echo "📁 Removing existing vaporform directory..."
    rm -rf vaporform
fi

echo "📁 Creating project directory..."
mkdir -p vaporform
cd vaporform

echo "📦 Creating encore.app configuration..."
cat > encore.app << 'EOF'
{
	"id":   "vaporform",
	"lang": "typescript"
}
EOF

echo "📝 Creating package.json..."
cat > package.json << 'EOF'
{
  "name": "vaporform",
  "private": true,
  "version": "1.0.0", 
  "description": "Vaporform AI-powered development environment - Encore TypeScript Backend",
  "license": "MIT",
  "type": "module",
  "scripts": {
    "dev": "encore run",
    "build": "encore build", 
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "start": "encore run",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.5.7",
    "typescript": "^5.2.2",
    "vitest": "^1.5.0"
  },
  "dependencies": {
    "encore.dev": "^1.49.0"
  },
  "optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "^4.13.0"
  },
  "keywords": [
    "vaporform",
    "ai", 
    "development",
    "encore",
    "typescript"
  ],
  "author": "Vaporform Team",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "⚙️ Creating TypeScript configuration..."
cat > tsconfig.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "lib": ["ES2022"],
    "target": "ES2022",
    "module": "ES2022", 
    "types": ["node"],
    "paths": {
      "~encore/*": ["./encore.gen/*"]
    },
    "composite": true,
    "strict": true,
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "sourceMap": true,
    "declaration": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
EOF

echo "🔧 Creating health service..."
mkdir -p health

cat > health/health.ts << 'EOF'
import { api } from "encore.dev/api";

// Health check endpoint for monitoring and status verification
export const health = api(
  { expose: true, method: "GET", path: "/health" },
  async (): Promise<HealthResponse> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(), 
      service: "vaporform",
      version: "1.0.0",
      uptime: process.uptime()
    };
  }
);

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
}
EOF

cat > health/encore.service.ts << 'EOF'
import { Service } from "encore.dev/service";

export default new Service("health");
EOF

echo "👋 Creating hello service..."
mkdir -p hello

cat > hello/hello.ts << 'EOF'
import { api } from "encore.dev/api";

// Welcome to Vaporform!
// This is a simple "Hello World" endpoint to verify the setup.
//
// To call it, run in your terminal:
//
//	curl http://localhost:4000/hello/Vaporform
//
export const get = api(
  { expose: true, method: "GET", path: "/hello/:name" },
  async ({ name }: { name: string }): Promise<Response> => {
    const msg = `Hello ${name}! Welcome to Vaporform - AI-powered development environment.`;
    return { message: msg };
  }
);

interface Response {
  message: string;
}
EOF

cat > hello/encore.service.ts << 'EOF'
import { Service } from "encore.dev/service";

export default new Service("hello");
EOF

cat > hello/hello.test.ts << 'EOF'
import { describe, expect, it } from "vitest";
import { get } from "./hello";

describe("hello service", () => {
  it("should return a greeting message", async () => {
    const result = await get({ name: "Vaporform" });
    expect(result.message).toBe("Hello Vaporform! Welcome to Vaporform - AI-powered development environment.");
  });

  it("should handle different names", async () => {
    const result = await get({ name: "Developer" });
    expect(result.message).toBe("Hello Developer! Welcome to Vaporform - AI-powered development environment.");
  });
});
EOF

echo "📄 Creating README..."
cat > README.md << 'EOF'
# Vaporform Backend

Vaporform AI-powered development environment backend built with Encore TypeScript.

## Features

- **Clean App ID**: Uses "vaporform" instead of random ID
- **Local Development**: No cloud platform integration required  
- **Type Safety**: Full TypeScript support with Encore.ts
- **Health Monitoring**: Built-in health check endpoint
- **Testing**: Vitest for fast unit testing

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode  
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Dashboard & API

- **Dashboard**: http://localhost:9400/vaporform
- **API Base**: http://localhost:4000

## Available Endpoints

- `GET /health` - Health check and system status
- `GET /hello/:name` - Welcome greeting endpoint

## Services

- **health** - Health monitoring and system status checks
- **hello** - Welcome service for testing and verification

## Development

1. The app uses the clean ID "vaporform" for easier identification
2. Dashboard will show `http://localhost:9400/vaporform` 
3. All endpoints are accessible via `http://localhost:4000`
4. Built with Encore.ts for type-safe backend development

## Architecture

- **Framework**: Encore.ts - Type-safe backend development
- **Language**: TypeScript with strict type checking
- **Testing**: Vitest for fast unit testing  
- **Development**: Hot reload with Encore dev server

## Next Steps

1. Add authentication services
2. Implement database integration
3. Add more business logic services
4. Set up monitoring and logging
5. Configure deployment pipeline
EOF

echo "📦 Installing dependencies..."
npm install

echo "🔍 Validating application structure..."
encore check

echo ""
echo "✅ Vaporform Encore TypeScript application setup complete!"
echo ""
echo "🎯 Your app is now available at:"
echo "   📊 Dashboard: http://localhost:9400/vaporform"  
echo "   🌐 API: http://localhost:4000"
echo ""
echo "🚀 To start the application:"
echo "   cd vaporform"
echo "   npm run dev"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
echo "📊 Available endpoints:"
echo "   GET /health - Health check and system status"
echo "   GET /hello/:name - Welcome greeting"
echo ""
echo "🔧 Key features:"
echo "   ✓ Clean app ID: 'vaporform' (not random)"
echo "   ✓ Local development (no cloud integration)"
echo "   ✓ TypeScript with strict type checking"  
echo "   ✓ Built-in health monitoring"
echo "   ✓ Hot reload development server"
echo ""