# Encore TypeScript Framework - Comprehensive Knowledge Base

This document contains a complete knowledge base extracted from the official Encore TypeScript documentation, systematically scraped from https://encore.dev/docs/ts.

## Table of Contents

1. [Setup and Installation Guide](#setup-and-installation-guide)
2. [Quick Start Guide](#quick-start-guide)
3. [Application Architecture and Model](#application-architecture-and-model)
4. [Service Development Patterns](#service-development-patterns)
5. [API Development Patterns](#api-development-patterns)
6. [Database Integration](#database-integration)
7. [Authentication and Security](#authentication-and-security)
8. [Background Processing (Cron Jobs and Pub/Sub)](#background-processing)
9. [Object Storage](#object-storage)
10. [Testing Patterns](#testing-patterns)
11. [Configuration and Secrets Management](#configuration-and-secrets-management)
12. [Advanced Tutorials](#advanced-tutorials)
13. [Troubleshooting and FAQ](#troubleshooting-and-faq)
14. [Working Code Examples](#working-code-examples)

---

## Setup and Installation Guide

### System Requirements
- **Node.js** (required for Encore.ts apps)
- **Docker** (required for local database setup)

### Installation Methods

#### macOS/Homebrew (Recommended)
```bash
brew install encoredev/tap/encore
```

#### Build from Source
Follow instructions in Encore's GitHub CONTRIBUTING.md

### Version Management
```bash
# Check current version
encore version

# Update to latest version
encore version update
```

### Optional LLM Tool Setup
1. Download `ts_llm_instructions.txt` from Encore documentation
2. For Cursor: Rename to `.cursorrules`
3. For GitHub Copilot: Paste in `.github/copilot-instructions.md`

### Verification
After installation, verify Encore CLI is working:
```bash
encore version
```

---

## Quick Start Guide

### Create Your First Application
```bash
# Create a new Encore application
encore app create

# Select "Hello World" template when prompted
# Optional: Create a free Encore account for cloud features
```

### Project Structure
A basic Encore.ts application has this structure:
```
my-app/
├── package.json
├── hello/
│   ├── encore.service.ts    # Service definition
│   └── hello.ts            # API endpoints
└── migrations/             # Database migrations (if using databases)
```

### Basic API Endpoint Example
File: `hello/hello.ts`
```typescript
import { api } from "encore.dev/api";

export const world = api(
  { method: "GET", path: "/hello/:name", expose: true },
  async ({ name }: { name: string }): Promise<Response> => {
    return { message: `Hello ${name}!` };
  }
);

interface Response {
  message: string;
}
```

### Service Definition
File: `hello/encore.service.ts`
```typescript
import { Service } from "encore.dev/service";
export default new Service("hello");
```

### Development Workflow
```bash
# Start local development server
encore run

# Access local dashboard at http://localhost:9400
# Features: API explorer, tracing, service catalog
```

### Deployment Options

#### Docker Build
```bash
encore build docker MY-IMAGE:TAG
```

#### Encore Cloud Deployment
```bash
git add -A .
git commit -m 'Initial commit'
git push encore
```

---

## Application Architecture and Model

### Core Philosophy
Encore uses **static analysis** to understand application structure and creates a comprehensive graph representing:
- Services and their relationships
- System interactions
- Data communication patterns
- Infrastructure connections

### Key Principles
- **Zero Boilerplate**: Framework handles routing, validation, authentication automatically
- **Standardization**: Reduces decision fatigue through opinionated conventions
- **Business Logic Focus**: Developers focus on core functionality instead of infrastructure
- **Automatic Generation**: Creates architecture diagrams, API docs, and cloud infrastructure

### Application Representation
Applications are represented as "boxes and arrows" showing:
- **Services**: Logical units of functionality
- **APIs**: Communication interfaces between services
- **Databases**: Data storage and relationships
- **External Dependencies**: Third-party integrations

---

## Service Development Patterns

### Service Definition
Every service requires an `encore.service.ts` file:

```typescript
import { Service } from "encore.dev/service";
export default new Service("my-service");
```

### Service Organization
- Each directory with `encore.service.ts` becomes a service
- All subdirectories are part of the same service
- Services can contain multiple API endpoints
- Services can have their own databases and resources

### Multi-Service Architecture
```
my-app/
├── user-service/
│   ├── encore.service.ts
│   ├── auth.ts
│   └── profile.ts
├── order-service/
│   ├── encore.service.ts
│   ├── orders.ts
│   └── payments.ts
└── notification-service/
    ├── encore.service.ts
    └── email.ts
```

---

## API Development Patterns

### Basic API Definition
```typescript
import { api } from "encore.dev/api";

interface RequestParams {
  name: string;
}

interface ResponseData {
  message: string;
}

export const myEndpoint = api(
  { method: "POST", expose: true },
  async (params: RequestParams): Promise<ResponseData> => {
    return { message: `Hello ${params.name}!` };
  }
);
```

### API Configuration Options
```typescript
export const endpoint = api(
  {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    path: "/custom/path/:param",     // Custom path with parameters
    expose: true,                    // Public API (default: false)
    auth: true,                      // Requires authentication
  },
  async (params) => {
    // Implementation
  }
);
```

### Parameter Types

#### Path Parameters
```typescript
// URL: /users/:userID/posts/:postID
export const getPost = api(
  { method: "GET", path: "/users/:userID/posts/:postID" },
  async ({ userID, postID }: { userID: string; postID: string }) => {
    // Implementation
  }
);
```

#### Query Parameters
```typescript
import { Query } from "encore.dev/api";

interface Params {
  filter: Query<string>;
  limit: Query<number>;
}

export const searchUsers = api(
  { method: "GET", path: "/users" },
  async ({ filter, limit }: Params) => {
    // Implementation
  }
);
```

#### Header Parameters
```typescript
import { Header } from "encore.dev/api";

interface Params {
  userAgent: Header<"User-Agent">;
  authorization: Header<"Authorization">;
}
```

#### Cookie Parameters
```typescript
import { Cookie } from "encore.dev/api";

interface Params {
  sessionId: Cookie<"session-id">;
}
```

### Custom HTTP Status Codes
```typescript
import { api, HttpStatus } from "encore.dev/api";

interface Response {
  data: any;
  status: HttpStatus;
}

export const createUser = api(
  { method: "POST", path: "/users" },
  async (params): Promise<Response> => {
    // Create user logic
    return { 
      data: { id: "user-123" }, 
      status: HttpStatus.Created 
    };
  }
);
```

### Raw Endpoints (Advanced)
For low-level HTTP handling:
```typescript
import { api, RawRequest, RawResponse } from "encore.dev/api";

export const rawEndpoint = api.raw(
  { method: "POST", path: "/webhook" },
  async (req: RawRequest, resp: RawResponse) => {
    const body = await req.json();
    resp.writeHead(200, { "Content-Type": "application/json" });
    resp.end(JSON.stringify({ received: true }));
  }
);
```

---

## Database Integration

### Database Setup
```typescript
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create a database with migrations
const db = new SQLDatabase("my-database", {
  migrations: "./migrations",
});
```

### Migration Management
Create migration files in the `migrations` directory:

**File: `migrations/1_create_users.up.sql`**
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**File: `migrations/2_create_posts.up.sql`**
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Database Querying

#### Query Methods
```typescript
// Query single row
const user = await db.queryRow`
  SELECT * FROM users WHERE id = ${userId}
`;

// Query multiple rows
const users = await db.queryAll`
  SELECT * FROM users WHERE active = true
`;

// Async iterator for large result sets
for await (const user of db.query`SELECT * FROM users`) {
  console.log(user);
}
```

#### Inserting Data
```typescript
const userId = await db.queryRow`
  INSERT INTO users (email, name)
  VALUES (${email}, ${name})
  RETURNING id
`;
```

#### Executing Statements
```typescript
await db.exec`
  UPDATE users SET last_login = NOW() WHERE id = ${userId}
`;
```

### Transactions
```typescript
const tx = await db.begin();
try {
  await tx.exec`INSERT INTO users (email, name) VALUES (${email}, ${name})`;
  await tx.exec`INSERT INTO audit_log (action) VALUES ('user_created')`;
  await tx.commit();
} catch (error) {
  await tx.rollback();
  throw error;
}
```

### CLI Database Commands
```bash
# Open database shell
encore db shell my-database

# Get connection URI
encore db conn-uri my-database

# Set up connection proxy
encore db proxy
```

### ORM Integration
Encore works with popular ORMs:

#### Prisma Example
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
}
```

#### Drizzle Example
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});
```

---

## Authentication and Security

### Authentication Handler Setup
```typescript
import { authHandler, APIError } from "encore.dev/auth";

interface AuthParams {
  authorization: Header<"Authorization">;
}

interface AuthData {
  userID: string;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    // Extract token from Authorization header
    const token = authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw APIError.unauthenticated("Missing token");
    }

    // Validate token (implement your logic)
    const user = await validateToken(token);
    
    if (!user) {
      throw APIError.unauthenticated("Invalid token");
    }

    return { userID: user.id, email: user.email };
  }
);
```

### Protected Endpoints
```typescript
export const getProfile = api(
  { method: "GET", path: "/profile", auth: true },
  async (): Promise<UserProfile> => {
    // Access auth data
    const authData = getAuthData();
    
    return await getUserProfile(authData.userID);
  }
);
```

### JWT Token Example
```typescript
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWT_SECRET");

export const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    const token = authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw APIError.unauthenticated("Missing token");
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as any;
      return { userID: payload.sub, email: payload.email };
    } catch (error) {
      throw APIError.unauthenticated("Invalid token");
    }
  }
);
```

### Testing Authentication
```typescript
import { getAuthData } from "encore.dev/auth";

// Mock auth data for testing
const mockAuthData = { userID: "test-user", email: "test@example.com" };

// Override auth data for specific calls
const result = await myService.getProfile.call(mockAuthData);
```

---

## Background Processing

### Cron Jobs

#### Basic Cron Job Setup
```typescript
import { CronJob } from "encore.dev/cron";

// Run every 2 hours
const welcomeEmailJob = new CronJob("welcome-email", {
  title: "Send welcome emails",
  every: "2h",
  endpoint: sendWelcomeEmails,
});

async function sendWelcomeEmails() {
  // Implementation
}
```

#### Advanced Scheduling with Cron Expressions
```typescript
// Run monthly at 4am on the 15th
const monthlyReport = new CronJob("monthly-report", {
  title: "Generate monthly reports",
  schedule: "0 4 15 * *",  // Standard cron expression
  endpoint: generateMonthlyReport,
});
```

#### Important Cron Job Considerations
- API endpoints must be **idempotent**
- Endpoints must have **no request parameters**
- Free tier limited to "once every hour"
- Does not run during local development or preview environments

### Pub/Sub Messaging

#### Topic Creation
```typescript
import { Topic } from "encore.dev/pubsub";

export interface UserSignupEvent {
  userID: string;
  email: string;
  timestamp: Date;
}

export const userSignups = new Topic<UserSignupEvent>("user-signups", {
  deliveryGuarantee: "at-least-once",
});
```

#### Publishing Events
```typescript
// Publish an event
const messageID = await userSignups.publish({
  userID: user.id,
  email: user.email,
  timestamp: new Date(),
});
```

#### Subscribing to Events
```typescript
import { Subscription } from "encore.dev/pubsub";

// Welcome email subscription
const welcomeEmailSub = new Subscription(userSignups, "send-welcome-email", {
  handler: async (event: UserSignupEvent) => {
    await sendWelcomeEmail(event.email, event.userID);
  },
});

// Analytics subscription
const analyticsSub = new Subscription(userSignups, "track-signup", {
  handler: async (event: UserSignupEvent) => {
    await trackUserSignup(event.userID, event.timestamp);
  },
});
```

#### Delivery Guarantees

**At-least-once (Default)**
```typescript
const topic = new Topic<EventType>("my-topic", {
  deliveryGuarantee: "at-least-once",
});
```

**Exactly-once**
```typescript
const topic = new Topic<EventType>("my-topic", {
  deliveryGuarantee: "exactly-once",
});
```

#### Ordered Topics
```typescript
export interface OrderEvent {
  orderID: string;
  userID: string;
  status: string;
}

const orderEvents = new Topic<OrderEvent>("order-events", {
  deliveryGuarantee: "at-least-once",
  orderingAttribute: "orderID",  // Orders processed in sequence per orderID
});
```

---

## Object Storage

### Bucket Creation
```typescript
import { Bucket } from "encore.dev/storage/objects";

export const profilePictures = new Bucket("profile-pictures", {
  versioned: false,
});

export const documentStorage = new Bucket("documents", {
  versioned: true,  // Enable versioning
});
```

### File Operations

#### Upload Files
```typescript
// Upload from buffer
const imageData = Buffer.from(base64Image, 'base64');
await profilePictures.upload("user-123/avatar.jpg", imageData, {
  contentType: "image/jpeg",
});

// Upload from stream
import fs from 'fs';
const fileStream = fs.createReadStream('local-file.pdf');
await documentStorage.upload("docs/file.pdf", fileStream, {
  contentType: "application/pdf",
});
```

#### Download Files
```typescript
// Download as buffer
const imageData = await profilePictures.download("user-123/avatar.jpg");

// Check if file exists and download
try {
  const data = await profilePictures.download("user-123/avatar.jpg");
  // File exists and downloaded
} catch (error) {
  // File doesn't exist or other error
}
```

#### List Objects
```typescript
// List all objects
for await (const entry of profilePictures.list({})) {
  console.log(`File: ${entry.name}, Size: ${entry.size}`);
}

// List with prefix
for await (const entry of profilePictures.list({ prefix: "user-123/" })) {
  console.log(entry.name);
}
```

#### Delete Objects
```typescript
// Delete single object
await profilePictures.remove("user-123/old-avatar.jpg");

// Delete multiple objects
await profilePictures.remove([
  "user-123/temp1.jpg",
  "user-123/temp2.jpg"
]);
```

### Public Buckets and Signed URLs
```typescript
// Public bucket configuration
export const publicAssets = new Bucket("public-assets", {
  public: true,
});

// Generate signed upload URL
const uploadURL = await profilePictures.signUploadURL("user-123/avatar.jpg", {
  contentType: "image/jpeg",
  expiresIn: "1h",
});

// Generate signed download URL
const downloadURL = await profilePictures.signDownloadURL("user-123/avatar.jpg", {
  expiresIn: "24h",
});
```

---

## Testing Patterns

### Vitest Setup

#### Configuration File: `vite.config.ts`
```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~encore": path.resolve(__dirname, "./encore.gen"),
    },
  },
  test: {
    environment: "node",
  },
});
```

#### Package.json Configuration
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

### Test Environment Benefits
- **Automatic test databases**: Separate database instances for tests
- **Optimized performance**: 
  - Skips `fsync` for faster I/O
  - Uses in-memory filesystems
  - Removes durability overhead
- **Isolation**: Each test gets clean state

### Example Integration Tests
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { userService } from "~encore/user.service";

describe("User Service", () => {
  beforeEach(async () => {
    // Reset database state
    await cleanupTestData();
  });

  it("should create a new user", async () => {
    const userData = {
      email: "test@example.com",
      name: "Test User",
    };

    const result = await userService.createUser(userData);
    
    expect(result.id).toBeDefined();
    expect(result.email).toBe(userData.email);
    expect(result.name).toBe(userData.name);
  });

  it("should not create duplicate users", async () => {
    const userData = {
      email: "test@example.com",
      name: "Test User",
    };

    await userService.createUser(userData);
    
    await expect(
      userService.createUser(userData)
    ).rejects.toThrow("User already exists");
  });
});
```

### Testing with Authentication
```typescript
import { describe, it, expect } from "vitest";
import { getAuthData } from "encore.dev/auth";

describe("Protected Endpoints", () => {
  it("should get user profile", async () => {
    const mockAuth = { userID: "test-user", email: "test@example.com" };
    
    const profile = await userService.getProfile.call(mockAuth);
    
    expect(profile.email).toBe("test@example.com");
  });
});
```

### Running Tests
```bash
# Run tests with Encore
encore test

# Run specific test file
encore test user.test.ts

# Run tests in watch mode
encore test --watch
```

### VS Code Integration
Add to `.vscode/settings.json`:
```json
{
  "vitest.commandLine": "encore test"
}
```

---

## Configuration and Secrets Management

### Defining Secrets
```typescript
import { secret } from "encore.dev/config";

// Define secrets
const databasePassword = secret("DATABASE_PASSWORD");
const apiKey = secret("THIRD_PARTY_API_KEY");
const jwtSecret = secret("JWT_SECRET");
```

### Using Secrets
```typescript
// Access secret values in code
async function connectToExternalAPI() {
  const response = await fetch("https://api.example.com/data", {
    headers: {
      "Authorization": `Bearer ${apiKey()}`,
    },
  });
  
  return response.json();
}
```

### Setting Secrets

#### Via CLI
```bash
# Set secret for production
encore secret set --type prod DATABASE_PASSWORD

# Set secret for development
encore secret set --type dev API_KEY

# Set secret for all environments
encore secret set JWT_SECRET
```

#### Via Encore Cloud Dashboard
1. Navigate to your app in the Encore Cloud Dashboard
2. Go to Settings > Secrets
3. Add/edit secrets for each environment

#### Local Development Override
Create `.secrets.local.cue` in application root:
```cue
DATABASE_PASSWORD: "local-dev-password"
API_KEY: "local-dev-api-key"
```

### Secret Security Features
- Encrypted using Google Cloud Platform's Key Management Service
- Automatically synced across development environments
- Compiler validates secret configuration before deployment
- Secrets are globally unique across the entire application

### Environment-Specific Configuration
```typescript
import { config } from "encore.dev/config";

// Environment-specific values
const apiBaseURL = config("API_BASE_URL", {
  production: "https://api.myapp.com",
  staging: "https://staging-api.myapp.com",
  development: "http://localhost:3000",
});
```

---

## Advanced Tutorials

### REST API with Database (URL Shortener)

#### Complete Implementation
```typescript
// File: url/encore.service.ts
import { Service } from "encore.dev/service";
export default new Service("url");
```

```typescript
// File: url/url.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Database setup
const db = new SQLDatabase("url", {
  migrations: "./migrations",
});

// Types
interface URL {
  id: string;
  url: string;
}

interface ShortenParams {
  url: string;
}

// Shorten URL endpoint
export const shorten = api(
  { method: "POST", path: "/url" },
  async ({ url }: ShortenParams): Promise<URL> => {
    const id = generateID();
    
    await db.exec`
      INSERT INTO url (id, original_url)
      VALUES (${id}, ${url})
    `;
    
    return { id, url: `https://short.ly/${id}` };
  }
);

// Get original URL endpoint
export const get = api(
  { method: "GET", path: "/url/:id" },
  async ({ id }: { id: string }): Promise<URL> => {
    const row = await db.queryRow`
      SELECT original_url FROM url WHERE id = ${id}
    `;
    
    if (!row) {
      throw APIError.notFound("URL not found");
    }
    
    return { id, url: row.original_url };
  }
);

// Helper function
function generateID(): string {
  return Math.random().toString(36).substring(2, 8);
}
```

#### Database Migration
```sql
-- File: url/migrations/1_create_url_table.up.sql
CREATE TABLE url (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Uptime Monitor (Microservices + Pub/Sub)

#### Site Service
```typescript
// File: site/site.ts
import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("site", {
  migrations: "./migrations",
});

export interface Site {
  id: number;
  url: string;
}

export const add = api(
  { method: "POST", path: "/site" },
  async ({ url }: { url: string }): Promise<Site> => {
    const site = await db.queryRow`
      INSERT INTO site (url) VALUES (${url})
      RETURNING id, url
    `;
    return site!;
  }
);

export const list = api(
  { method: "GET", path: "/site" },
  async (): Promise<{ sites: Site[] }> => {
    const sites = await db.queryAll`SELECT id, url FROM site`;
    return { sites };
  }
);
```

#### Monitor Service with Pub/Sub
```typescript
// File: monitor/monitor.ts
import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import { Topic } from "encore.dev/pubsub";
import { site } from "~encore/site.service";

// Event types
export interface TransitionEvent {
  site: site.Site;
  up: boolean;
}

// Pub/Sub topic
export const transitions = new Topic<TransitionEvent>("transition", {
  deliveryGuarantee: "at-least-once",
});

// Ping endpoint
export const ping = api(
  { method: "POST", path: "/ping" },
  async ({ url }: { url: string }): Promise<{ up: boolean }> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      return { up: response.ok };
    } catch {
      return { up: false };
    }
  }
);

// Cron job to check all sites
const checkAllSites = new CronJob("check-all", {
  title: "Check all sites",
  every: "1m",
  endpoint: checkAll,
});

async function checkAll(): Promise<void> {
  const { sites } = await site.list();
  
  // Check all sites in parallel
  await Promise.all(
    sites.map(async (s) => {
      const { up } = await ping({ url: s.url });
      
      // Publish transition event
      await transitions.publish({
        site: s,
        up,
      });
    })
  );
}
```

#### Slack Notification Service
```typescript
// File: slack/slack.ts
import { Subscription } from "encore.dev/pubsub";
import { secret } from "encore.dev/config";
import { monitor } from "~encore/monitor.service";

const webhookURL = secret("SLACK_WEBHOOK_URL");

// Subscribe to site transitions
const _ = new Subscription(monitor.transitions, "slack-notify", {
  handler: async (event: monitor.TransitionEvent) => {
    const text = `Site ${event.site.url} is ${event.up ? "up" : "down"}`;
    
    await fetch(webhookURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  },
});
```

### GraphQL API Integration

#### GraphQL Service Setup
```typescript
// File: graphql/graphql.ts
import { api } from "encore.dev/api";
import { ApolloServer } from "@apollo/server";
import { startServerAndCreateLambdaHandler } from "@apollo/server/integrations/aws-lambda";

const typeDefs = `
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }

  type Mutation {
    addBook(title: String!, author: String!): Book
  }
`;

const resolvers = {
  Query: {
    books: () => books,
  },
  Mutation: {
    addBook: (_, { title, author }) => {
      const book = { title, author };
      books.push(book);
      return book;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Raw API endpoint for GraphQL
export const graphql = api.raw(
  { expose: true, method: "POST", path: "/graphql" },
  async (req, res) => {
    const handler = startServerAndCreateLambdaHandler(server);
    await handler(req, res);
  }
);
```

### Slack Bot with Webhook Security

#### Secure Webhook Handler
```typescript
// File: slack/bot.ts
import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import crypto from "crypto";

const signingSecret = secret("SLACK_SIGNING_SECRET");

export const webhook = api.raw(
  { expose: true, method: "POST", path: "/slack/events" },
  async (req, res) => {
    // Verify Slack request
    const body = await req.text();
    const timestamp = req.headers["x-slack-request-timestamp"];
    const signature = req.headers["x-slack-signature"];
    
    if (!verifySlackRequest(body, timestamp, signature)) {
      throw APIError.unauthenticated("Invalid signature");
    }

    // Process Slack event
    const event = JSON.parse(body);
    
    if (event.type === "url_verification") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(event.challenge);
      return;
    }

    // Handle other events
    const response = await processSlackCommand(event);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response));
  }
);

function verifySlackRequest(body: string, timestamp: string, signature: string): boolean {
  const time = Math.floor(new Date().getTime() / 1000);
  
  // Request must be within 5 minutes
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    return false;
  }

  // Verify signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${crypto
    .createHmac("sha256", signingSecret())
    .update(sigBasestring)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}
```

---

## Troubleshooting and FAQ

### Common Issues and Solutions

#### Windows Symlink Issues
**Problem**: Symlink-related errors on Windows
**Solution**: Enable "Developer Mode" in Windows settings

#### Node.js Related Errors
**Problem**: Node-related runtime errors
**Solution**: Restart the Encore daemon
```bash
encore daemon
```

#### Database Connection Issues
**Problem**: Cannot connect to local database
**Solution**: 
1. Ensure Docker is running
2. Run `encore run` to start local development environment
3. Check database status with `encore db shell <db-name>`

#### Migration Errors
**Problem**: Database migrations failing
**Solution**:
1. Check migration file syntax
2. Ensure migrations are numbered sequentially
3. Verify migration files end with `.up.sql`
4. Check for conflicting schema changes

### Platform Support

#### Supported Technologies
- **Languages**: Go and TypeScript (Python coming Q1 2025)
- **Runtimes**: Node.js (official), Bun (experimental), Deno (coming soon)
- **Databases**: PostgreSQL (built-in), MongoDB/MySQL (manual integration)
- **Cloud Providers**: AWS, Google Cloud Platform
- **Self-hosting**: Azure, Digital Ocean (via Docker)

#### Runtime Limitations
- Cannot mix TypeScript and Go in one application
- AWS Lambda not currently supported
- AWS Fargate and EKS supported

#### Experimental Features
Enable Bun runtime by adding to `encore.app`:
```json
{
  "experiments": ["bun-runtime"]
}
```

### IDE Support
- **GoLand/IntelliJ**: Official plugin available
- **VS Code**: Plugin "coming soon"
- **General**: Works with any editor supporting TypeScript

### Performance Considerations

#### Free Tier Limitations
- Cron jobs limited to "once every hour"
- Pub/Sub throughput limits vary by cloud provider

#### Pub/Sub Throughput
- **At-least-once**: Higher throughput
- **Exactly-once**: Limited to 300 msgs/sec (AWS), 3000 msgs/sec (GCP)

### Getting Help
- **Discord Community**: Active developer community
- **GitHub**: Open source project with issue tracking
- **Documentation**: Comprehensive guides at encore.dev/docs
- **Examples**: Sample applications available

### Best Practices

#### Development Workflow
1. Use `encore run` for local development
2. Leverage the local dashboard at `localhost:9400`
3. Write integration tests over unit tests
4. Use migrations for all database changes
5. Keep services focused and cohesive

#### Security
1. Never commit secrets to source code
2. Use Encore's secret management system
3. Implement proper authentication for protected endpoints
4. Verify webhook signatures for external integrations

#### Performance
1. Design handlers to be idempotent
2. Use appropriate delivery guarantees for Pub/Sub
3. Optimize database queries and use transactions when needed
4. Consider caching for frequently accessed data

---

## Working Code Examples

### Complete URL Shortener Service

#### Project Structure
```
url-shortener/
├── package.json
├── url/
│   ├── encore.service.ts
│   ├── url.ts
│   └── migrations/
│       └── 1_create_url_table.up.sql
└── tests/
    └── url.test.ts
```

#### Service Implementation
```typescript
// url/encore.service.ts
import { Service } from "encore.dev/service";
export default new Service("url");

// url/url.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("url", {
  migrations: "./migrations",
});

interface URL {
  id: string;
  url: string;
}

interface ShortenParams {
  url: string;
}

export const shorten = api(
  { method: "POST", path: "/url", expose: true },
  async ({ url }: ShortenParams): Promise<URL> => {
    const id = randomID();
    await db.exec`
      INSERT INTO url (id, original_url) VALUES (${id}, ${url})
    `;
    return { id, url: `${baseURL()}/${id}` };
  }
);

export const get = api(
  { method: "GET", path: "/url/:id", expose: true },
  async ({ id }: { id: string }): Promise<{ url: string }> => {
    const row = await db.queryRow`
      SELECT original_url FROM url WHERE id = ${id}
    `;
    if (!row) throw APIError.notFound("URL not found");
    return { url: row.original_url };
  }
);

function randomID(): string {
  return Math.random().toString(36).substring(2, 8);
}

function baseURL(): string {
  return "https://short.ly";
}
```

#### Database Migration
```sql
-- url/migrations/1_create_url_table.up.sql
CREATE TABLE url (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### Tests
```typescript
// tests/url.test.ts
import { describe, it, expect } from "vitest";
import { url } from "~encore/url.service";

describe("URL Shortener", () => {
  it("should shorten and retrieve URLs", async () => {
    const originalUrl = "https://example.com";
    
    // Shorten URL
    const shortened = await url.shorten({ url: originalUrl });
    expect(shortened.id).toBeDefined();
    expect(shortened.url).toContain(shortened.id);
    
    // Retrieve original URL
    const retrieved = await url.get({ id: shortened.id });
    expect(retrieved.url).toBe(originalUrl);
  });
});
```

### Complete E-commerce API

#### User Service
```typescript
// user/user.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import bcrypt from "bcrypt";

const db = new SQLDatabase("user", {
  migrations: "./migrations",
});

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

interface CreateUserParams {
  email: string;
  name: string;
  password: string;
}

export const createUser = api(
  { method: "POST", path: "/users", expose: true },
  async ({ email, name, password }: CreateUserParams): Promise<User> => {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.queryRow`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${hashedPassword})
      RETURNING id, email, name, created_at
    `;
    
    return user!;
  }
);

export const getUser = api(
  { method: "GET", path: "/users/:id", auth: true },
  async ({ id }: { id: string }): Promise<User> => {
    const user = await db.queryRow`
      SELECT id, email, name, created_at FROM users WHERE id = ${id}
    `;
    
    if (!user) throw APIError.notFound("User not found");
    return user;
  }
);
```

#### Product Service
```typescript
// product/product.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("product", {
  migrations: "./migrations",
});

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  inventory: number;
}

interface CreateProductParams {
  name: string;
  description: string;
  price: number;
  inventory: number;
}

export const createProduct = api(
  { method: "POST", path: "/products", auth: true },
  async (params: CreateProductParams): Promise<Product> => {
    const product = await db.queryRow`
      INSERT INTO products (name, description, price, inventory)
      VALUES (${params.name}, ${params.description}, ${params.price}, ${params.inventory})
      RETURNING *
    `;
    
    return product!;
  }
);

export const listProducts = api(
  { method: "GET", path: "/products", expose: true },
  async (): Promise<{ products: Product[] }> => {
    const products = await db.queryAll`
      SELECT * FROM products WHERE inventory > 0
    `;
    
    return { products };
  }
);
```

### Authentication Implementation

#### Auth Handler
```typescript
// auth/auth.ts
import { authHandler, APIError } from "encore.dev/auth";
import { Header } from "encore.dev/api";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWT_SECRET");

interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string;
}

export const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }) => {
    const token = authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw APIError.unauthenticated("Missing authorization token");
    }

    try {
      const payload = jwt.verify(token, jwtSecret()) as any;
      return {
        userID: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw APIError.unauthenticated("Invalid token");
    }
  }
);
```

#### Login Endpoint
```typescript
// auth/login.ts
import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const db = new SQLDatabase("user", {
  migrations: "./migrations",
});

const jwtSecret = secret("JWT_SECRET");

interface LoginParams {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async ({ email, password }: LoginParams): Promise<LoginResponse> => {
    const user = await db.queryRow`
      SELECT id, email, name, password_hash FROM users WHERE email = ${email}
    `;
    
    if (!user) {
      throw APIError.unauthenticated("Invalid credentials");
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw APIError.unauthenticated("Invalid credentials");
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email },
      jwtSecret(),
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
);
```

This comprehensive knowledge base provides complete documentation for building production-ready applications with Encore TypeScript, extracted from the entire official documentation site.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Complete sitemap discovery and page identification", "status": "completed"}, {"id": "2", "content": "Scrape installation and setup documentation", "status": "completed"}, {"id": "3", "content": "Extract quick start and getting started guides", "status": "completed"}, {"id": "4", "content": "Document application model and architecture patterns", "status": "completed"}, {"id": "5", "content": "Scrape Hello World and basic examples", "status": "completed"}, {"id": "6", "content": "Extract REST API tutorial with database patterns", "status": "completed"}, {"id": "7", "content": "Document uptime monitor tutorial (microservices + pub/sub)", "status": "completed"}, {"id": "8", "content": "Extract all primitives documentation (services, APIs, databases, etc.)", "status": "completed"}, {"id": "9", "content": "Document authentication and security patterns", "status": "completed"}, {"id": "10", "content": "Extract testing documentation and patterns", "status": "completed"}, {"id": "11", "content": "Document advanced tutorials (GraphQL, Slack bot)", "status": "completed"}, {"id": "12", "content": "Extract FAQ and troubleshooting information", "status": "completed"}, {"id": "13", "content": "Organize comprehensive knowledge base document", "status": "completed"}]