# Vaporform API Documentation

## Overview

Vaporform provides a comprehensive REST API and WebSocket interface for managing AI-powered development environments. The API is built using Encore.ts and follows RESTful conventions with strong type safety.

## Base URL

```
Production: https://api.vaporform.dev
Development: http://localhost:4000
```

## Authentication

All API endpoints require authentication via JWT tokens, except for login and registration.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## API Services

### 1. Authentication Service (`/auth`)

#### POST `/auth/login`
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

#### POST `/auth/register`
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com", 
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

#### GET `/auth/me`
Get current user information.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "createdAt": "2023-01-01T00:00:00Z",
  "lastLogin": "2023-01-01T12:00:00Z"
}
```

### 2. Projects Service (`/projects`)

#### POST `/projects`
Create a new project.

**Request:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "type": "web",
  "language": "typescript",
  "framework": "react",
  "aiFeatures": {
    "codeGeneration": true,
    "codeReview": true,
    "debugging": true,
    "testing": true
  }
}
```

#### GET `/projects`
List user's projects.

**Query Parameters:**
- `limit` (optional): Number of projects to return (default: 20)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "projects": [...],
  "total": 42
}
```

#### GET `/projects/:id`
Get specific project details.

#### PUT `/projects/:id`
Update project settings.

#### DELETE `/projects/:id`
Delete a project.

### 3. AI Service (`/ai`)

#### POST `/ai/generate`
Generate code using AI.

**Request:**
```json
{
  "prompt": "Create a React component for user login",
  "language": "typescript",
  "framework": "react",
  "context": "This is for a user authentication system",
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "result": "// Generated code here",
  "suggestions": ["Add error handling", "Add unit tests"],
  "confidence": 0.85,
  "metadata": {
    "model": "claude-3-5-sonnet-20241022",
    "language": "typescript",
    "framework": "react"
  }
}
```

#### POST `/ai/review`
Get AI code review.

**Request:**
```json
{
  "code": "function example() { ... }",
  "language": "typescript",
  "focus": ["security", "performance"],
  "projectId": "uuid"
}
```

#### POST `/ai/debug`
Get AI debugging assistance.

**Request:**
```json
{
  "code": "function buggy() { ... }",
  "error": "TypeError: Cannot read property 'x' of undefined",
  "language": "typescript",
  "context": "This happens when user clicks submit",
  "projectId": "uuid"
}
```

#### POST `/ai/tests`
Generate tests using AI.

**Request:**
```json
{
  "code": "function calculate() { ... }",
  "language": "typescript",
  "testType": "unit",
  "framework": "jest",
  "projectId": "uuid"
}
```

### 4. Container Management Service (`/containers`)

#### POST `/containers`
Create and start a new container.

**Request:**
```json
{
  "projectId": "uuid",
  "name": "web-server",
  "image": "node:18-alpine",
  "ports": [
    {
      "internal": 3000,
      "external": 8080,
      "protocol": "tcp"
    }
  ],
  "environment": {
    "NODE_ENV": "development",
    "PORT": "3000"
  },
  "volumes": [
    {
      "hostPath": "/tmp/project",
      "containerPath": "/app",
      "readOnly": false
    }
  ],
  "resources": {
    "cpuLimit": 1.0,
    "memoryLimit": 512,
    "storageLimit": 1024
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "dockerContainerId": "docker_id",
  "status": "running",
  "ports": [...],
  "createdAt": "2023-01-01T00:00:00Z"
}
```

#### GET `/containers`
List containers.

**Query Parameters:**
- `projectId` (optional): Filter by project
- `status` (optional): Filter by status

#### GET `/containers/:id`
Get container details.

#### POST `/containers/:id/actions`
Perform container actions (start, stop, restart, pause, unpause).

**Request:**
```json
{
  "action": "restart"
}
```

#### GET `/containers/:id/logs`
Get container logs.

**Query Parameters:**
- `tail` (optional): Number of lines to retrieve (default: 100)
- `since` (optional): Timestamp to start from

#### GET `/containers/:id/stats`
Get container performance statistics.

#### DELETE `/containers/:id`
Stop and remove container.

### 5. File System Service (`/files`)

#### POST `/files`
Create a new file or directory.

**Request:**
```json
{
  "projectId": "uuid",
  "path": "/src/components",
  "name": "Button.tsx",
  "type": "file",
  "content": "import React from 'react';...",
  "encoding": "utf-8",
  "permissions": {
    "mode": 644,
    "readable": true,
    "writable": true,
    "executable": false
  }
}
```

#### GET `/files`
List files in a project.

**Query Parameters:**
- `projectId` (required): Project ID
- `path` (optional): Filter by path
- `recursive` (optional): Include subdirectories
- `includeHidden` (optional): Include hidden files
- `type` (optional): Filter by file type

#### GET `/files/:id`
Get file details.

**Query Parameters:**
- `includeContent` (optional): Include file content

#### PUT `/files/:id`
Update file content or metadata.

**Request:**
```json
{
  "content": "Updated file content",
  "message": "Fix bug in component"
}
```

#### DELETE `/files/:id`
Delete a file or directory.

#### POST `/files/search`
Search files by content or name.

**Request:**
```json
{
  "projectId": "uuid",
  "query": "function handleClick",
  "type": "content",
  "fileTypes": [".ts", ".tsx"],
  "maxResults": 20,
  "caseSensitive": false,
  "useRegex": false
}
```

#### POST `/files/:id/operations`
Perform file operations (copy, move, rename).

**Request:**
```json
{
  "operation": "copy",
  "destination": "/src/backup",
  "newName": "Button.backup.tsx"
}
```

#### GET `/files/:id/diff`
Get file differences between versions.

**Query Parameters:**
- `fromVersion` (optional): Starting version
- `toVersion` (optional): Ending version

### 6. WebSocket Service (`/ws`)

#### POST `/ws/sessions`
Create a collaboration session.

**Request:**
```json
{
  "projectId": "uuid",
  "documentId": "file_uuid",
  "sessionName": "Design Review Session"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "wsUrl": "ws://localhost:4000/ws/connect?sessionId=uuid&token=jwt"
}
```

#### POST `/ws/sessions/:sessionId/join`
Join an existing collaboration session.

**Request:**
```json
{
  "clientType": "vscode",
  "clientVersion": "1.0.0",
  "capabilities": ["cursor_tracking", "real_time_editing"]
}
```

#### GET `/ws/sessions/:sessionId`
Get session details.

#### GET `/ws/sessions/:sessionId/chat`
Get chat message history.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `offset` (optional): Pagination offset

#### GET `/ws/sessions`
List user's active sessions.

#### POST `/ws/sessions/:sessionId/leave`
Leave a collaboration session.

## WebSocket Protocol

### Connection
Connect to: `ws://host/ws/connect?sessionId=<id>&token=<jwt>`

### Message Format
```json
{
  "id": "message_uuid",
  "type": "cursor_move",
  "payload": {
    "fileId": "uuid",
    "line": 42,
    "column": 15
  },
  "timestamp": "2023-01-01T12:00:00Z",
  "userId": "uuid",
  "sessionId": "uuid"
}
```

### Message Types

#### Client to Server
- `cursor_move`: Update cursor position
- `text_change`: Text edit operation
- `selection_change`: Text selection change
- `file_open`: Open file for editing
- `file_close`: Close file
- `chat_message`: Send chat message
- `ping`: Heartbeat

#### Server to Client
- `cursor_move`: Other user's cursor movement
- `text_change`: Other user's text changes
- `selection_change`: Other user's selection
- `user_join`: User joined session
- `user_leave`: User left session
- `chat_message`: Chat message received
- `pong`: Heartbeat response
- `error`: Error message
- `sync_response`: State synchronization

### Real-time Collaboration

#### Cursor Movement
```json
{
  "type": "cursor_move",
  "payload": {
    "fileId": "uuid",
    "line": 42,
    "column": 15
  }
}
```

#### Text Changes (Operational Transform)
```json
{
  "type": "text_change",
  "payload": {
    "fileId": "uuid",
    "operation": {
      "type": "insert",
      "position": 150,
      "content": "Hello World"
    }
  }
}
```

#### Chat Messages
```json
{
  "type": "chat_message",
  "payload": {
    "content": "Let's review this function",
    "type": "text",
    "mentions": ["user2_id"]
  }
}
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `422`: Validation Error
- `500`: Internal Server Error

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

## Rate Limiting

All endpoints are rate-limited:
- Authentication: 5 requests per minute
- AI Services: 100 requests per hour
- File Operations: 1000 requests per hour
- General API: 10000 requests per hour

Rate limit headers:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { VaporformClient } from '@vaporform/sdk';

const client = new VaporformClient({
  apiUrl: 'http://localhost:4000',
  token: 'your-jwt-token'
});

// Create project
const project = await client.projects.create({
  name: 'My App',
  type: 'web',
  language: 'typescript'
});

// Generate code
const code = await client.ai.generate({
  prompt: 'Create a login form',
  language: 'typescript',
  framework: 'react'
});

// Start collaboration session
const session = await client.websocket.createSession({
  projectId: project.id
});
```

### Python
```python
from vaporform import VaporformClient

client = VaporformClient(
    api_url='http://localhost:4000',
    token='your-jwt-token'
)

# Create container
container = client.containers.create(
    project_id='uuid',
    name='web-server',
    image='node:18-alpine'
)

# Search files
results = client.files.search(
    project_id='uuid',
    query='function handleSubmit',
    type='content'
)
```

## Webhook Events

Vaporform can send webhooks for various events:

### Container Events
- `container.created`
- `container.started`
- `container.stopped`
- `container.error`

### File Events
- `file.created`
- `file.modified`
- `file.deleted`

### Collaboration Events
- `session.started`
- `user.joined`
- `user.left`

### Webhook Payload
```json
{
  "event": "container.started",
  "timestamp": "2023-01-01T12:00:00Z",
  "data": {
    "containerId": "uuid",
    "projectId": "uuid",
    "status": "running"
  }
}
```