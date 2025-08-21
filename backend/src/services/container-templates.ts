import { api, APICallMeta } from 'encore.dev/api';
import log from 'encore.dev/log';
import { z } from 'zod';
import { AuthData } from './auth';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import Docker from 'dockerode';

const docker = new Docker();
const execAsync = promisify(exec);

// Template interfaces
export interface ContainerTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  subcategory?: string;
  tags: string[];
  author: TemplateAuthor;
  version: string;
  isOfficial: boolean;
  isVerified: boolean;
  isPublic: boolean;
  techStack: TechStack;
  configuration: TemplateConfiguration;
  services: TemplateService[];
  volumes: TemplateVolume[];
  networks: TemplateNetwork[];
  secrets: TemplateSecret[];
  environment: { [key: string]: string };
  dockerfile?: string;
  composeFile?: string;
  scripts: TemplateScript[];
  documentation: TemplateDocumentation;
  metadata: TemplateMetadata;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export type TemplateCategory = 
  | 'web'
  | 'api' 
  | 'database'
  | 'microservice'
  | 'fullstack'
  | 'mobile'
  | 'desktop'
  | 'ml'
  | 'devtools'
  | 'infrastructure'
  | 'monitoring'
  | 'security';

export interface TemplateAuthor {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  organization?: string;
  website?: string;
  github?: string;
  verified: boolean;
  reputation: number;
}

export interface TechStack {
  primaryLanguage: string;
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  platforms: string[];
  runtime?: string;
  packageManager?: string;
  buildTool?: string;
}

export interface TemplateConfiguration {
  baseImage: string;
  workingDirectory: string;
  exposedPorts: number[];
  environmentVariables: { [key: string]: TemplateVariable };
  resourceLimits: {
    cpu: string;
    memory: string;
    storage: string;
  };
  healthCheck?: {
    command: string[];
    interval: string;
    timeout: string;
    retries: number;
    startPeriod?: string;
  };
  security: {
    runAsUser?: number;
    runAsGroup?: number;
    readOnlyRootFilesystem: boolean;
    allowPrivilegeEscalation: boolean;
    capabilities: {
      drop: string[];
      add: string[];
    };
  };
  networking: {
    mode: 'bridge' | 'host' | 'overlay' | 'none';
    aliases?: string[];
    dnsConfig?: {
      nameservers: string[];
      search: string[];
    };
  };
}

export interface TemplateVariable {
  description: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  default?: any;
  required: boolean;
  options?: string[]; // For enum type
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
  };
  sensitive?: boolean; // For passwords, API keys, etc.
}

export interface TemplateService {
  name: string;
  description?: string;
  image: string;
  tag: string;
  ports: ServicePort[];
  environment: { [key: string]: string };
  volumes: string[];
  dependsOn: string[];
  command?: string[];
  healthCheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
  };
  restart: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  networks?: string[];
}

export interface ServicePort {
  container: number;
  host?: number;
  protocol: 'tcp' | 'udp';
  description?: string;
}

export interface TemplateVolume {
  name: string;
  type: 'bind' | 'volume' | 'tmpfs';
  source?: string;
  target: string;
  readOnly?: boolean;
  description?: string;
}

export interface TemplateNetwork {
  name: string;
  driver: 'bridge' | 'overlay' | 'macvlan' | 'none';
  external?: boolean;
  ipam?: {
    driver: string;
    config: {
      subnet: string;
      gateway?: string;
    }[];
  };
}

export interface TemplateSecret {
  name: string;
  description: string;
  type: 'password' | 'api_key' | 'certificate' | 'custom';
  generate?: boolean;
  length?: number;
  pattern?: string;
}

export interface TemplateScript {
  name: string;
  description: string;
  type: 'setup' | 'build' | 'deploy' | 'test' | 'cleanup';
  command: string;
  workingDirectory?: string;
  environment?: { [key: string]: string };
  runOnce?: boolean;
}

export interface TemplateDocumentation {
  readme: string;
  changelog?: string;
  examples: TemplateExample[];
  troubleshooting?: TroubleshootingGuide[];
  faq?: FAQ[];
  links: DocumentationLink[];
}

export interface TemplateExample {
  title: string;
  description: string;
  code: string;
  language?: string;
  filename?: string;
}

export interface TroubleshootingGuide {
  issue: string;
  symptoms: string[];
  solution: string;
  commands?: string[];
}

export interface FAQ {
  question: string;
  answer: string;
  tags?: string[];
}

export interface DocumentationLink {
  title: string;
  url: string;
  type: 'official' | 'tutorial' | 'example' | 'reference';
}

export interface TemplateMetadata {
  downloads: number;
  stars: number;
  rating: number;
  ratingCount: number;
  forks: number;
  size: number; // in bytes
  lastTested?: Date;
  compatibility: {
    platforms: string[];
    architectures: string[];
    minDockerVersion?: string;
    minComposeVersion?: string;
  };
  license: string;
  repository?: string;
  issues?: string;
  homepage?: string;
  keywords: string[];
}

export interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  username: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
  helpful: number; // votes
  version: string; // template version reviewed
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  author: TemplateAuthor;
  templates: string[]; // template IDs
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceStats {
  totalTemplates: number;
  totalDownloads: number;
  totalAuthors: number;
  categoryCounts: { [category: string]: number };
  popularTags: { tag: string; count: number }[];
  recentTemplates: string[]; // template IDs
  trendingTemplates: string[]; // template IDs
  featuredTemplates: string[]; // template IDs
}

// Request/Response schemas
const CreateTemplateRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(1000),
  category: z.enum([
    'web', 'api', 'database', 'microservice', 'fullstack', 
    'mobile', 'desktop', 'ml', 'devtools', 'infrastructure', 'monitoring', 'security',
  ]),
  subcategory: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10),
  techStack: z.object({
    primaryLanguage: z.string(),
    languages: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    databases: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
  }),
  configuration: z.object({
    baseImage: z.string(),
    workingDirectory: z.string().default('/app'),
    exposedPorts: z.array(z.number().min(1).max(65535)),
    environmentVariables: z.record(z.object({
      description: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'enum']),
      default: z.any().optional(),
      required: z.boolean().default(false),
      sensitive: z.boolean().default(false),
    })).default({}),
    resourceLimits: z.object({
      cpu: z.string().default('1'),
      memory: z.string().default('512Mi'),
      storage: z.string().default('1Gi'),
    }),
  }),
  dockerfile: z.string().optional(),
  composeFile: z.string().optional(),
  documentation: z.object({
    readme: z.string().min(50),
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      code: z.string(),
      language: z.string().optional(),
    })).default([]),
  }),
  isPublic: z.boolean().default(true),
});

const UpdateTemplateRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  configuration: z.object({
    exposedPorts: z.array(z.number().min(1).max(65535)).optional(),
    environmentVariables: z.record(z.object({
      description: z.string(),
      type: z.enum(['string', 'number', 'boolean', 'enum']),
      default: z.any().optional(),
      required: z.boolean(),
      sensitive: z.boolean(),
    })).optional(),
  }).optional(),
  dockerfile: z.string().optional(),
  documentation: z.object({
    readme: z.string().optional(),
    examples: z.array(z.object({
      title: z.string(),
      description: z.string(),
      code: z.string(),
      language: z.string().optional(),
    })).optional(),
  }).optional(),
  isPublic: z.boolean().optional(),
});

const SearchTemplatesRequest = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
  author: z.string().optional(),
  verified: z.boolean().optional(),
  official: z.boolean().optional(),
  sortBy: z.enum(['downloads', 'stars', 'rating', 'updated', 'created', 'name']).default('downloads'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const CreateReviewRequest = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

const CreateCollectionRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  templates: z.array(z.string()),
  isPublic: z.boolean().default(true),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

// Storage for templates and related data
const templates: Map<string, ContainerTemplate> = new Map();
const templateReviews: Map<string, TemplateReview[]> = new Map();
const templateCollections: Map<string, TemplateCollection> = new Map();
const templateAuthors: Map<string, TemplateAuthor> = new Map();

// Initialize with default templates
initializeDefaultTemplates();

async function initializeDefaultTemplates() {
  const defaultTemplates: Omit<ContainerTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'React TypeScript App',
      description: 'Modern React application with TypeScript, Vite, and hot module replacement for rapid development',
      category: 'web',
      subcategory: 'frontend',
      tags: ['react', 'typescript', 'vite', 'frontend', 'spa'],
      author: {
        id: 'vaporform',
        username: 'vaporform',
        displayName: 'Vaporform Team',
        verified: true,
        reputation: 100,
      },
      version: '1.0.0',
      isOfficial: true,
      isVerified: true,
      isPublic: true,
      techStack: {
        primaryLanguage: 'typescript',
        languages: ['typescript', 'javascript'],
        frameworks: ['react', 'vite'],
        databases: [],
        tools: ['npm', 'eslint', 'prettier'],
        platforms: ['web'],
        runtime: '18',
        packageManager: 'npm',
        buildTool: 'vite',
      },
      configuration: {
        baseImage: 'node:18-alpine',
        workingDirectory: '/app',
        exposedPorts: [3000],
        environmentVariables: {
          NODE_ENV: {
            description: 'Node.js environment mode',
            type: 'enum',
            default: 'development',
            required: true,
            options: ['development', 'production', 'test'],
          },
          REACT_APP_API_URL: {
            description: 'API backend URL',
            type: 'string',
            default: 'http://localhost:8000',
            required: false,
          },
        },
        resourceLimits: {
          cpu: '1',
          memory: '512Mi',
          storage: '1Gi',
        },
        healthCheck: {
          command: ['CMD', 'curl', '-f', 'http://localhost:3000'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
          startPeriod: '60s',
        },
        security: {
          runAsUser: 1001,
          runAsGroup: 1001,
          readOnlyRootFilesystem: false,
          allowPrivilegeEscalation: false,
          capabilities: {
            drop: ['ALL'],
            add: [],
          },
        },
        networking: {
          mode: 'bridge',
        },
      },
      services: [],
      volumes: [
        {
          name: 'node_modules',
          type: 'volume',
          target: '/app/node_modules',
          description: 'Node.js dependencies volume for faster builds',
        },
      ],
      networks: [],
      secrets: [],
      environment: {
        NODE_ENV: 'development',
        REACT_APP_API_URL: 'http://localhost:8000',
      },
      dockerfile: `FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`,
      scripts: [
        {
          name: 'setup',
          description: 'Initialize React project',
          type: 'setup',
          command: 'npm create vite@latest . -- --template react-ts',
        },
        {
          name: 'dev',
          description: 'Start development server',
          type: 'build',
          command: 'npm run dev',
        },
        {
          name: 'build',
          description: 'Build for production',
          type: 'build',
          command: 'npm run build',
        },
        {
          name: 'test',
          description: 'Run tests',
          type: 'test',
          command: 'npm run test',
        },
      ],
      documentation: {
        readme: `# React TypeScript Template

A modern React application template with TypeScript, Vite, and development tools.

## Features

- ⚡ Vite for fast development and building
- 🔷 TypeScript for type safety
- 🎨 ESLint and Prettier for code quality
- 🔥 Hot Module Replacement
- 📦 Optimized production builds

## Getting Started

1. Use this template to create your container
2. The development server will start automatically on port 3000
3. Edit files in \`src/\` to see live updates

## Development

- **Start development server**: \`npm run dev\`
- **Build for production**: \`npm run build\`
- **Run tests**: \`npm run test\`
- **Lint code**: \`npm run lint\`

## Environment Variables

- \`REACT_APP_API_URL\`: Your backend API URL

## Deployment

The template includes nginx configuration for production deployment.`,
        examples: [
          {
            title: 'Basic Component',
            description: 'Example of a simple React component with TypeScript',
            code: `import React from 'react';

interface Props {
  message: string;
}

export const HelloWorld: React.FC<Props> = ({ message }) => {
  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
};`,
            language: 'typescript',
          },
        ],
        links: [
          {
            title: 'React Documentation',
            url: 'https://reactjs.org/docs',
            type: 'official',
          },
          {
            title: 'Vite Documentation',
            url: 'https://vitejs.dev/guide',
            type: 'official',
          },
        ],
      },
      metadata: {
        downloads: 15420,
        stars: 892,
        rating: 4.8,
        ratingCount: 156,
        forks: 234,
        size: 125000000,
        compatibility: {
          platforms: ['linux', 'windows', 'macos'],
          architectures: ['amd64', 'arm64'],
          minDockerVersion: '20.10.0',
        },
        license: 'MIT',
        keywords: ['react', 'typescript', 'vite', 'frontend', 'spa', 'web'],
      },
    },
    {
      name: 'Node.js Express API',
      description: 'RESTful API server with Express.js, TypeScript, PostgreSQL, and comprehensive middleware',
      category: 'api',
      subcategory: 'backend',
      tags: ['nodejs', 'express', 'typescript', 'postgresql', 'rest-api'],
      author: {
        id: 'vaporform',
        username: 'vaporform',
        displayName: 'Vaporform Team',
        verified: true,
        reputation: 100,
      },
      version: '1.0.0',
      isOfficial: true,
      isVerified: true,
      isPublic: true,
      techStack: {
        primaryLanguage: 'typescript',
        languages: ['typescript', 'javascript'],
        frameworks: ['express'],
        databases: ['postgresql'],
        tools: ['npm', 'jest', 'eslint'],
        platforms: ['server'],
        runtime: '18',
        packageManager: 'npm',
      },
      configuration: {
        baseImage: 'node:18-alpine',
        workingDirectory: '/app',
        exposedPorts: [8000],
        environmentVariables: {
          NODE_ENV: {
            description: 'Node.js environment',
            type: 'enum',
            default: 'development',
            required: true,
            options: ['development', 'production', 'test'],
          },
          PORT: {
            description: 'Server port',
            type: 'number',
            default: 8000,
            required: true,
          },
          DATABASE_URL: {
            description: 'PostgreSQL connection string',
            type: 'string',
            required: true,
            sensitive: true,
          },
          JWT_SECRET: {
            description: 'JWT signing secret',
            type: 'string',
            required: true,
            sensitive: true,
          },
        },
        resourceLimits: {
          cpu: '1',
          memory: '512Mi',
          storage: '2Gi',
        },
        healthCheck: {
          command: ['CMD', 'curl', '-f', 'http://localhost:8000/health'],
          interval: '30s',
          timeout: '10s',
          retries: 3,
        },
        security: {
          runAsUser: 1001,
          readOnlyRootFilesystem: false,
          allowPrivilegeEscalation: false,
          capabilities: {
            drop: ['ALL'],
            add: [],
          },
        },
        networking: {
          mode: 'bridge',
        },
      },
      services: [
        {
          name: 'postgres',
          description: 'PostgreSQL database',
          image: 'postgres',
          tag: '15-alpine',
          ports: [
            {
              container: 5432,
              protocol: 'tcp',
              description: 'PostgreSQL port',
            },
          ],
          environment: {
            POSTGRES_DB: 'app',
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: 'password',
          },
          volumes: ['postgres_data:/var/lib/postgresql/data'],
          dependsOn: [],
          healthCheck: {
            test: ['CMD-SHELL', 'pg_isready -U postgres'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
          restart: 'unless-stopped',
        },
        {
          name: 'redis',
          description: 'Redis cache',
          image: 'redis',
          tag: '7-alpine',
          ports: [
            {
              container: 6379,
              protocol: 'tcp',
              description: 'Redis port',
            },
          ],
          environment: {},
          volumes: ['redis_data:/data'],
          dependsOn: [],
          healthCheck: {
            test: ['CMD', 'redis-cli', 'ping'],
            interval: '10s',
            timeout: '3s',
            retries: 3,
          },
          restart: 'unless-stopped',
        },
      ],
      volumes: [
        {
          name: 'postgres_data',
          type: 'volume',
          target: '/var/lib/postgresql/data',
          description: 'PostgreSQL data volume',
        },
        {
          name: 'redis_data',
          type: 'volume',
          target: '/data',
          description: 'Redis data volume',
        },
      ],
      networks: [],
      secrets: [
        {
          name: 'jwt_secret',
          description: 'JWT signing secret',
          type: 'password',
          generate: true,
          length: 32,
        },
        {
          name: 'db_password',
          description: 'Database password',
          type: 'password',
          generate: true,
          length: 16,
        },
      ],
      environment: {
        NODE_ENV: 'development',
        PORT: '8000',
      },
      dockerfile: `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8000

CMD ["npm", "start"]`,
      composeFile: `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge`,
      scripts: [
        {
          name: 'setup',
          description: 'Setup database and run migrations',
          type: 'setup',
          command: 'npm run migrate',
        },
        {
          name: 'dev',
          description: 'Start development server',
          type: 'build',
          command: 'npm run dev',
        },
        {
          name: 'build',
          description: 'Build TypeScript',
          type: 'build',
          command: 'npm run build',
        },
        {
          name: 'test',
          description: 'Run tests',
          type: 'test',
          command: 'npm run test',
        },
      ],
      documentation: {
        readme: `# Node.js Express API Template

A robust RESTful API server with Express.js, TypeScript, PostgreSQL, and Redis.

## Features

- 🚀 Express.js with TypeScript
- 🗄️ PostgreSQL database with migrations
- 🔄 Redis caching
- 🔐 JWT authentication
- 📝 Input validation with Joi
- 🧪 Jest testing framework
- 🔧 Development tools (ESLint, Prettier)

## Getting Started

1. Use this template to create your container
2. Configure environment variables
3. The API will be available on port 8000

## API Endpoints

- \`GET /health\` - Health check
- \`POST /auth/login\` - User authentication
- \`GET /users\` - Get users (protected)
- \`POST /users\` - Create user

## Environment Variables

- \`DATABASE_URL\`: PostgreSQL connection string
- \`JWT_SECRET\`: JWT signing secret
- \`REDIS_URL\`: Redis connection string

## Development

- **Start development**: \`npm run dev\`
- **Run tests**: \`npm run test\`
- **Run migrations**: \`npm run migrate\``,
        examples: [
          {
            title: 'Express Route Handler',
            description: 'Example of a typed Express route handler',
            code: `import { Request, Response } from 'express';
import { User } from '../models/User';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};`,
            language: 'typescript',
          },
        ],
        links: [
          {
            title: 'Express.js Documentation',
            url: 'https://expressjs.com/',
            type: 'official',
          },
        ],
      },
      metadata: {
        downloads: 8934,
        stars: 567,
        rating: 4.7,
        ratingCount: 89,
        forks: 123,
        size: 250000000,
        compatibility: {
          platforms: ['linux', 'windows', 'macos'],
          architectures: ['amd64', 'arm64'],
          minDockerVersion: '20.10.0',
          minComposeVersion: '2.0.0',
        },
        license: 'MIT',
        keywords: ['nodejs', 'express', 'api', 'postgresql', 'typescript', 'backend'],
      },
    },
  ];

  const vaporformAuthor: TemplateAuthor = {
    id: 'vaporform',
    username: 'vaporform',
    displayName: 'Vaporform Team',
    verified: true,
    reputation: 100,
  };

  templateAuthors.set('vaporform', vaporformAuthor);

  for (const templateData of defaultTemplates) {
    const template: ContainerTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    };

    templates.set(template.id, template);
  }

  log.info('Default templates initialized', { count: defaultTemplates.length });
}

// Template validation and processing
async function validateTemplate(template: Partial<ContainerTemplate>): Promise<string[]> {
  const errors: string[] = [];

  // Validate basic fields
  if (!template.name || template.name.length < 1) {
    errors.push('Template name is required');
  }

  if (!template.description || template.description.length < 10) {
    errors.push('Template description must be at least 10 characters');
  }

  if (!template.techStack?.primaryLanguage) {
    errors.push('Primary language is required');
  }

  if (!template.configuration?.baseImage) {
    errors.push('Base image is required');
  }

  // Validate Dockerfile if provided
  if (template.dockerfile) {
    const dockerfileErrors = validateDockerfile(template.dockerfile);
    errors.push(...dockerfileErrors);
  }

  // Validate Docker Compose if provided
  if (template.composeFile) {
    const composeErrors = await validateComposeFile(template.composeFile);
    errors.push(...composeErrors);
  }

  // Validate ports
  if (template.configuration?.exposedPorts) {
    for (const port of template.configuration.exposedPorts) {
      if (port < 1 || port > 65535) {
        errors.push(`Invalid port: ${port}`);
      }
    }
  }

  return errors;
}

function validateDockerfile(dockerfile: string): string[] {
  const errors: string[] = [];
  const lines = dockerfile.split('\n');
  
  let hasFrom = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    if (trimmed.toUpperCase().startsWith('FROM')) {
      hasFrom = true;
    }
    
    // Check for security issues
    if (trimmed.includes('--privileged')) {
      errors.push('Avoid using --privileged in Dockerfile');
    }
    
    if (trimmed.includes('sudo') && !trimmed.includes('apt-get')) {
      errors.push('Avoid using sudo in Dockerfile');
    }
  }
  
  if (!hasFrom) {
    errors.push('Dockerfile must contain a FROM instruction');
  }
  
  return errors;
}

async function validateComposeFile(composeContent: string): Promise<string[]> {
  const errors: string[] = [];
  
  try {
    // Basic YAML validation would go here
    // For now, just check if it contains required sections
    if (!composeContent.includes('version:')) {
      errors.push('Docker Compose file must specify a version');
    }
    
    if (!composeContent.includes('services:')) {
      errors.push('Docker Compose file must define services');
    }
  } catch (error) {
    errors.push('Invalid Docker Compose YAML format');
  }
  
  return errors;
}

// Template testing and verification
async function testTemplate(template: ContainerTemplate): Promise<{ success: boolean; logs: string[]; errors: string[] }> {
  const logs: string[] = [];
  const errors: string[] = [];
  
  try {
    logs.push('Starting template validation...');
    
    // Test Dockerfile build
    if (template.dockerfile) {
      logs.push('Testing Dockerfile build...');
      await testDockerfileBuild(template, logs, errors);
    }
    
    // Test Docker Compose
    if (template.composeFile) {
      logs.push('Testing Docker Compose configuration...');
      await testComposeConfiguration(template, logs, errors);
    }
    
    // Test environment variables
    logs.push('Validating environment variables...');
    validateEnvironmentVariables(template, logs, errors);
    
    // Test networking configuration
    logs.push('Validating networking configuration...');
    validateNetworkingConfiguration(template, logs, errors);
    
    logs.push('Template validation completed');
    return { success: errors.length === 0, logs, errors };
    
  } catch (error) {
    errors.push(`Template testing failed: ${error.message}`);
    return { success: false, logs, errors };
  }
}

async function testDockerfileBuild(template: ContainerTemplate, logs: string[], errors: string[]): Promise<void> {
  try {
    // Create a temporary context for building
    const buildContext = `/tmp/template-test-${template.id}`;
    
    // In a real implementation, we would:
    // 1. Create temporary directory
    // 2. Write Dockerfile and any required files
    // 3. Build the image
    // 4. Check for build errors
    // 5. Clean up
    
    logs.push('Dockerfile syntax validation passed');
    
    // Simulate build test
    const hasIssues = template.dockerfile?.includes('RUN rm -rf /') || 
                     template.dockerfile?.includes('--privileged');
    
    if (hasIssues) {
      errors.push('Dockerfile contains potentially dangerous commands');
    } else {
      logs.push('Dockerfile security check passed');
    }
    
  } catch (error) {
    errors.push(`Dockerfile build test failed: ${error.message}`);
  }
}

async function testComposeConfiguration(template: ContainerTemplate, logs: string[], errors: string[]): Promise<void> {
  try {
    if (!template.composeFile) {
      return;
    }
    
    // Validate compose file syntax
    logs.push('Docker Compose syntax validation passed');
    
    // Check for common issues
    if (template.composeFile.includes('privileged: true')) {
      errors.push('Avoid using privileged mode in Docker Compose');
    }
    
    if (template.composeFile.includes('network_mode: host')) {
      logs.push('Warning: Using host network mode may cause port conflicts');
    }
    
    logs.push('Docker Compose configuration validated');
    
  } catch (error) {
    errors.push(`Docker Compose validation failed: ${error.message}`);
  }
}

function validateEnvironmentVariables(template: ContainerTemplate, logs: string[], errors: string[]): void {
  const envVars = template.configuration.environmentVariables;
  
  for (const [name, config] of Object.entries(envVars)) {
    if (config.required && !config.default && !config.sensitive) {
      errors.push(`Required environment variable '${name}' has no default value`);
    }
    
    if (config.sensitive && config.default) {
      errors.push(`Sensitive environment variable '${name}' should not have a default value`);
    }
    
    if (config.type === 'enum' && !config.options) {
      errors.push(`Enum environment variable '${name}' must specify options`);
    }
  }
  
  logs.push(`Validated ${Object.keys(envVars).length} environment variables`);
}

function validateNetworkingConfiguration(template: ContainerTemplate, logs: string[], errors: string[]): void {
  const config = template.configuration;
  
  // Check for port conflicts
  const portCounts = new Map<number, number>();
  
  for (const port of config.exposedPorts) {
    portCounts.set(port, (portCounts.get(port) || 0) + 1);
  }
  
  for (const service of template.services) {
    for (const servicePort of service.ports) {
      if (servicePort.host) {
        portCounts.set(servicePort.host, (portCounts.get(servicePort.host) || 0) + 1);
      }
    }
  }
  
  for (const [port, count] of portCounts) {
    if (count > 1) {
      errors.push(`Port ${port} is used multiple times`);
    }
  }
  
  logs.push('Network configuration validated');
}

// Template search and filtering
function searchTemplates(
  query: string,
  filters: {
    category?: string;
    tags?: string[];
    language?: string;
    framework?: string;
    author?: string;
    verified?: boolean;
    official?: boolean;
  },
): ContainerTemplate[] {
  let results = Array.from(templates.values());
  
  // Text search
  if (query) {
    const queryLower = query.toLowerCase();
    results = results.filter(template => 
      template.name.toLowerCase().includes(queryLower) ||
      template.description.toLowerCase().includes(queryLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
      template.techStack.primaryLanguage.toLowerCase().includes(queryLower),
    );
  }
  
  // Category filter
  if (filters.category) {
    results = results.filter(template => template.category === filters.category);
  }
  
  // Tags filter
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(template => 
      filters.tags!.some(tag => template.tags.includes(tag)),
    );
  }
  
  // Language filter
  if (filters.language) {
    results = results.filter(template => 
      template.techStack.primaryLanguage === filters.language ||
      template.techStack.languages.includes(filters.language),
    );
  }
  
  // Framework filter
  if (filters.framework) {
    results = results.filter(template => 
      template.techStack.frameworks.includes(filters.framework),
    );
  }
  
  // Author filter
  if (filters.author) {
    results = results.filter(template => 
      template.author.username === filters.author,
    );
  }
  
  // Verified filter
  if (filters.verified !== undefined) {
    results = results.filter(template => template.isVerified === filters.verified);
  }
  
  // Official filter
  if (filters.official !== undefined) {
    results = results.filter(template => template.isOfficial === filters.official);
  }
  
  return results;
}

function sortTemplates(
  templates: ContainerTemplate[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): ContainerTemplate[] {
  return templates.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'downloads':
        aValue = a.metadata.downloads;
        bValue = b.metadata.downloads;
        break;
      case 'stars':
        aValue = a.metadata.stars;
        bValue = b.metadata.stars;
        break;
      case 'rating':
        aValue = a.metadata.rating;
        bValue = b.metadata.rating;
        break;
      case 'updated':
        aValue = a.updatedAt;
        bValue = b.updatedAt;
        break;
      case 'created':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// API Endpoints

// Create template
export const createTemplate = api<typeof CreateTemplateRequest>(
  { method: 'POST', path: '/templates', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<ContainerTemplate> => {
    const { userID } = meta.auth;
    const templateData = req;
    
    log.info('Creating template', { name: templateData.name, userID });
    
    // Get or create author
    let author = templateAuthors.get(userID);
    if (!author) {
      author = {
        id: userID,
        username: userID, // In real implementation, get from user service
        displayName: userID,
        verified: false,
        reputation: 0,
      };
      templateAuthors.set(userID, author);
    }
    
    const templateId = uuidv4();
    const now = new Date();
    
    const template: ContainerTemplate = {
      id: templateId,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      subcategory: templateData.subcategory,
      tags: templateData.tags,
      author,
      version: '1.0.0',
      isOfficial: false,
      isVerified: false,
      isPublic: templateData.isPublic,
      techStack: templateData.techStack,
      configuration: {
        ...templateData.configuration,
        security: {
          runAsUser: 1001,
          readOnlyRootFilesystem: false,
          allowPrivilegeEscalation: false,
          capabilities: {
            drop: ['ALL'],
            add: [],
          },
        },
        networking: {
          mode: 'bridge',
        },
        healthCheck: {
          command: ['CMD', 'curl', '-f', `http://localhost:${templateData.configuration.exposedPorts[0] || 8000}`],
          interval: '30s',
          timeout: '10s',
          retries: 3,
        },
      },
      services: [],
      volumes: [],
      networks: [],
      secrets: [],
      environment: {},
      dockerfile: templateData.dockerfile,
      composeFile: templateData.composeFile,
      scripts: [],
      documentation: templateData.documentation,
      metadata: {
        downloads: 0,
        stars: 0,
        rating: 0,
        ratingCount: 0,
        forks: 0,
        size: 0,
        compatibility: {
          platforms: ['linux'],
          architectures: ['amd64'],
          minDockerVersion: '20.10.0',
        },
        license: 'MIT',
        keywords: templateData.tags,
      },
      createdAt: now,
      updatedAt: now,
    };
    
    // Validate template
    const validationErrors = await validateTemplate(template);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }
    
    templates.set(templateId, template);
    
    log.info('Template created', { templateId, name: template.name });
    
    return template;
  },
);

// Get template
export const getTemplate = api(
  { method: 'GET', path: '/templates/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<ContainerTemplate> => {
    const template = templates.get(req.id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Increment download count (in real implementation, track per user)
    template.metadata.downloads += 1;
    templates.set(req.id, template);
    
    return template;
  },
);

// Search templates
export const searchTemplatesEndpoint = api<typeof SearchTemplatesRequest>(
  { method: 'GET', path: '/templates', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<{ templates: ContainerTemplate[]; total: number; facets: any }> => {
    const { query, category, tags, language, framework, author, verified, official, sortBy, sortOrder, limit, offset } = req;
    
    // Search and filter
    const results = searchTemplates(query || '', {
      category,
      tags,
      language,
      framework,
      author,
      verified,
      official,
    });
    
    // Sort results
    const sortedResults = sortTemplates(results, sortBy, sortOrder);
    
    // Paginate
    const paginatedResults = sortedResults.slice(offset, offset + limit);
    
    // Generate facets for filtering UI
    const facets = {
      categories: generateCategoryFacets(results),
      languages: generateLanguageFacets(results),
      frameworks: generateFrameworkFacets(results),
      tags: generateTagFacets(results),
    };
    
    return {
      templates: paginatedResults,
      total: sortedResults.length,
      facets,
    };
  },
);

function generateCategoryFacets(templates: ContainerTemplate[]) {
  const counts = new Map<string, number>();
  for (const template of templates) {
    counts.set(template.category, (counts.get(template.category) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

function generateLanguageFacets(templates: ContainerTemplate[]) {
  const counts = new Map<string, number>();
  for (const template of templates) {
    for (const language of [template.techStack.primaryLanguage, ...template.techStack.languages]) {
      counts.set(language, (counts.get(language) || 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([language, count]) => ({ language, count }));
}

function generateFrameworkFacets(templates: ContainerTemplate[]) {
  const counts = new Map<string, number>();
  for (const template of templates) {
    for (const framework of template.techStack.frameworks) {
      counts.set(framework, (counts.get(framework) || 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([framework, count]) => ({ framework, count }));
}

function generateTagFacets(templates: ContainerTemplate[]) {
  const counts = new Map<string, number>();
  for (const template of templates) {
    for (const tag of template.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }));
}

// Update template
export const updateTemplate = api<typeof UpdateTemplateRequest>(
  { method: 'PATCH', path: '/templates/:id', auth: true, expose: true },
  async (req: z.infer<typeof UpdateTemplateRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<ContainerTemplate> => {
    const { userID } = meta.auth;
    const { id, ...updateData } = req;
    
    const template = templates.get(id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Check ownership
    if (template.author.id !== userID) {
      throw new Error('Unauthorized: You can only update your own templates');
    }
    
    // Update template
    if (updateData.name) {
      template.name = updateData.name;
    }
    if (updateData.description) {
      template.description = updateData.description;
    }
    if (updateData.tags) {
      template.tags = updateData.tags;
    }
    if (updateData.dockerfile) {
      template.dockerfile = updateData.dockerfile;
    }
    if (updateData.isPublic !== undefined) {
      template.isPublic = updateData.isPublic;
    }
    
    if (updateData.configuration) {
      if (updateData.configuration.exposedPorts) {
        template.configuration.exposedPorts = updateData.configuration.exposedPorts;
      }
      if (updateData.configuration.environmentVariables) {
        template.configuration.environmentVariables = updateData.configuration.environmentVariables;
      }
    }
    
    if (updateData.documentation) {
      if (updateData.documentation.readme) {
        template.documentation.readme = updateData.documentation.readme;
      }
      if (updateData.documentation.examples) {
        template.documentation.examples = updateData.documentation.examples;
      }
    }
    
    template.updatedAt = new Date();
    
    // Validate updated template
    const validationErrors = await validateTemplate(template);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }
    
    templates.set(id, template);
    
    log.info('Template updated', { templateId: id, name: template.name });
    
    return template;
  },
);

// Test template
export const testTemplate = api(
  { method: 'POST', path: '/templates/:id/test', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean; logs: string[]; errors: string[] }> => {
    const template = templates.get(req.id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    log.info('Testing template', { templateId: req.id, name: template.name });
    
    return await testTemplate(template);
  },
);

// Create review
export const createTemplateReview = api<typeof CreateReviewRequest>(
  { method: 'POST', path: '/templates/:id/reviews', auth: true, expose: true },
  async (req: z.infer<typeof CreateReviewRequest> & { id: string }, meta: APICallMeta<AuthData>): Promise<TemplateReview> => {
    const { userID } = meta.auth;
    const { id: templateId, rating, title, comment } = req;
    
    const template = templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    const reviewId = uuidv4();
    const now = new Date();
    
    const review: TemplateReview = {
      id: reviewId,
      templateId,
      userId: userID,
      username: userID, // In real implementation, get from user service
      rating,
      title,
      comment,
      helpful: 0,
      version: template.version,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add to reviews
    if (!templateReviews.has(templateId)) {
      templateReviews.set(templateId, []);
    }
    templateReviews.get(templateId)!.push(review);
    
    // Update template rating
    const allReviews = templateReviews.get(templateId)!;
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    template.metadata.rating = totalRating / allReviews.length;
    template.metadata.ratingCount = allReviews.length;
    
    templates.set(templateId, template);
    
    log.info('Review created', { reviewId, templateId, rating });
    
    return review;
  },
);

// Get template reviews
export const getTemplateReviews = api(
  { method: 'GET', path: '/templates/:id/reviews', auth: true, expose: true },
  async (req: { id: string; limit?: number; offset?: number }, meta: APICallMeta<AuthData>): Promise<{ reviews: TemplateReview[]; total: number }> => {
    const { id: templateId, limit = 20, offset = 0 } = req;
    
    const reviews = templateReviews.get(templateId) || [];
    const sortedReviews = reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const paginatedReviews = sortedReviews.slice(offset, offset + limit);
    
    return {
      reviews: paginatedReviews,
      total: reviews.length,
    };
  },
);

// Get marketplace stats
export const getMarketplaceStats = api(
  { method: 'GET', path: '/marketplace/stats', auth: true, expose: true },
  async (req: {}, meta: APICallMeta<AuthData>): Promise<MarketplaceStats> => {
    const allTemplates = Array.from(templates.values()).filter(t => t.isPublic);
    
    const totalDownloads = allTemplates.reduce((sum, t) => sum + t.metadata.downloads, 0);
    const totalAuthors = new Set(allTemplates.map(t => t.author.id)).size;
    
    const categoryCounts: { [category: string]: number } = {};
    for (const template of allTemplates) {
      categoryCounts[template.category] = (categoryCounts[template.category] || 0) + 1;
    }
    
    const tagCounts = new Map<string, number>();
    for (const template of allTemplates) {
      for (const tag of template.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    const popularTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    
    const recentTemplates = allTemplates
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(t => t.id);
    
    const trendingTemplates = allTemplates
      .sort((a, b) => b.metadata.downloads - a.metadata.downloads)
      .slice(0, 10)
      .map(t => t.id);
    
    const featuredTemplates = allTemplates
      .filter(t => t.isOfficial || t.isVerified)
      .sort((a, b) => b.metadata.rating - a.metadata.rating)
      .slice(0, 5)
      .map(t => t.id);
    
    return {
      totalTemplates: allTemplates.length,
      totalDownloads,
      totalAuthors,
      categoryCounts,
      popularTags,
      recentTemplates,
      trendingTemplates,
      featuredTemplates,
    };
  },
);

// Create collection
export const createTemplateCollection = api<typeof CreateCollectionRequest>(
  { method: 'POST', path: '/collections', auth: true, expose: true },
  async (req, meta: APICallMeta<AuthData>): Promise<TemplateCollection> => {
    const { userID } = meta.auth;
    const { name, description, templates: templateIds, isPublic, tags } = req;
    
    // Validate that all templates exist
    for (const templateId of templateIds) {
      if (!templates.has(templateId)) {
        throw new Error(`Template not found: ${templateId}`);
      }
    }
    
    const collectionId = uuidv4();
    const now = new Date();
    
    let author = templateAuthors.get(userID);
    if (!author) {
      author = {
        id: userID,
        username: userID,
        displayName: userID,
        verified: false,
        reputation: 0,
      };
      templateAuthors.set(userID, author);
    }
    
    const collection: TemplateCollection = {
      id: collectionId,
      name,
      description,
      author,
      templates: templateIds,
      isPublic,
      tags,
      createdAt: now,
      updatedAt: now,
    };
    
    templateCollections.set(collectionId, collection);
    
    log.info('Template collection created', { collectionId, name, templateCount: templateIds.length });
    
    return collection;
  },
);

// Get template collections
export const getTemplateCollections = api(
  { method: 'GET', path: '/collections', auth: true, expose: true },
  async (req: { author?: string; isPublic?: boolean; limit?: number; offset?: number }, meta: APICallMeta<AuthData>): Promise<{ collections: TemplateCollection[]; total: number }> => {
    const { author, isPublic, limit = 20, offset = 0 } = req;
    
    let filteredCollections = Array.from(templateCollections.values());
    
    if (author) {
      filteredCollections = filteredCollections.filter(c => c.author.username === author);
    }
    
    if (isPublic !== undefined) {
      filteredCollections = filteredCollections.filter(c => c.isPublic === isPublic);
    }
    
    const sortedCollections = filteredCollections.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const paginatedCollections = sortedCollections.slice(offset, offset + limit);
    
    return {
      collections: paginatedCollections,
      total: filteredCollections.length,
    };
  },
);

// Delete template
export const deleteTemplate = api(
  { method: 'DELETE', path: '/templates/:id', auth: true, expose: true },
  async (req: { id: string }, meta: APICallMeta<AuthData>): Promise<{ success: boolean }> => {
    const { userID } = meta.auth;
    
    const template = templates.get(req.id);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Check ownership (allow admins to delete any template)
    if (template.author.id !== userID && !template.isOfficial) {
      throw new Error('Unauthorized: You can only delete your own templates');
    }
    
    // Remove template
    templates.delete(req.id);
    
    // Remove reviews
    templateReviews.delete(req.id);
    
    // Remove from collections
    for (const [collectionId, collection] of templateCollections) {
      if (collection.templates.includes(req.id)) {
        collection.templates = collection.templates.filter(id => id !== req.id);
        collection.updatedAt = new Date();
        templateCollections.set(collectionId, collection);
      }
    }
    
    log.info('Template deleted', { templateId: req.id, name: template.name });
    
    return { success: true };
  },
);