#!/bin/bash
set -e

# Create Vaporform Encore TypeScript Application
# This script creates a properly named Encore app without cloud integration

echo "🚀 Creating Vaporform Encore TypeScript Application..."

# Remove existing vaporform directory if it exists
if [ -d "vaporform" ]; then
    echo "📁 Removing existing vaporform directory..."
    rm -rf vaporform
fi

# Create the project directory
mkdir -p vaporform

# Change to the project directory
cd vaporform

echo "📦 Creating encore.app configuration..."
# Create the encore.app file with a clean app ID
cat > encore.app << 'EOF'
{
	"id":   "vaporform",
	"lang": "typescript"
}
EOF

echo "📝 Creating package.json..."
# Create package.json
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
# Create tsconfig.json
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
# Create health service directory
mkdir -p health

# Create health service
cat > health/health.ts << 'EOF'
import { api } from "encore.dev/api";

// Health check endpoint
export const health = api(
  { expose: true, method: "GET", path: "/health" },
  async (): Promise<HealthResponse> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "vaporform",
      version: "1.0.0"
    };
  }
);

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}
EOF

# Create health service configuration
cat > health/encore.service.ts << 'EOF'
import { Service } from "encore.dev/service";

export default new Service("health");
EOF

echo "👋 Creating hello service..."
# Create hello service directory  
mkdir -p hello

# Create hello service
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

# Create hello service configuration
cat > hello/encore.service.ts << 'EOF'
import { Service } from "encore.dev/service";

export default new Service("hello");
EOF

# Create hello tests
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
# Create README
cat > README.md << 'EOF'
# Vaporform Backend

Vaporform AI-powered development environment backend built with Encore TypeScript.

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

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /hello/:name` - Welcome greeting endpoint

## Development

Visit the Encore development dashboard at:
- http://localhost:9400/vaporform

## Services

- **health** - Health monitoring and system status
- **hello** - Welcome service for testing setup

## Architecture

This backend is built using:
- **Encore.ts** - Type-safe backend development framework
- **TypeScript** - Type safety and modern JavaScript features
- **Vitest** - Fast unit testing

## Next Steps

1. Add more services as needed
2. Implement authentication
3. Add database integration
4. Set up monitoring and logging
EOF

echo "📦 Installing dependencies..."
# Install dependencies
npm install

echo "✅ Vaporform Encore TypeScript application created successfully!"
echo ""
echo "🎯 Your app is now available at:"
echo "   Dashboard: http://localhost:9400/vaporform"
echo "   API: http://localhost:4000"
echo ""
echo "🚀 To start the application:"
echo "   cd vaporform"
echo "   npm run dev"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
echo "📊 Available endpoints:"
echo "   GET /health - Health check"
echo "   GET /hello/:name - Welcome greeting"