import { api } from 'encore.dev/api';

export type ProjectFiles = Record<string, string>;

export interface TemplateConfig {
  templateId: string;
  projectName: string;
  variables: Record<string, any>;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: number;
  features: string[];
  techStack: {
    frontend: string;
    backend: string;
    database: string;
    deployment: string[];
  };
  files: ProjectFiles;
  variables: {
    name: string;
    type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
    description: string;
    default?: any;
    options?: string[];
    required: boolean;
  }[];
  prerequisites: string[];
  setupInstructions: string[];
}

class ProjectTemplatesService {
  private readonly templates: Map<string, Template> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // React + Express + PostgreSQL Template
    this.addTemplate({
      id: 'react-express-postgresql',
      name: 'React Full-Stack App',
      description: 'Complete full-stack application with React frontend, Express.js backend, and PostgreSQL database',
      category: 'full-stack',
      tags: ['react', 'express', 'postgresql', 'typescript', 'rest-api'],
      complexity: 3,
      features: [
        'User authentication',
        'CRUD operations',
        'Responsive design',
        'API documentation',
        'Database migrations',
        'TypeScript support',
      ],
      techStack: {
        frontend: 'react',
        backend: 'express',
        database: 'postgresql',
        deployment: ['vercel', 'railway'],
      },
      files: this.getReactExpressPostgreSQLFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'description',
          type: 'string',
          description: 'Project description',
          required: true,
        },
        {
          name: 'authProvider',
          type: 'select',
          description: 'Authentication provider',
          options: ['local', 'auth0', 'firebase', 'supabase'],
          default: 'local',
          required: true,
        },
        {
          name: 'includeAdmin',
          type: 'boolean',
          description: 'Include admin dashboard',
          default: false,
          required: false,
        },
      ],
      prerequisites: ['Node.js 18+', 'PostgreSQL 14+', 'Docker'],
      setupInstructions: [
        'Clone the repository',
        'Install dependencies: npm install',
        'Set up environment variables',
        'Run database migrations',
        'Start development server: npm run dev',
      ],
    });

    // Vue + FastAPI + MongoDB Template
    this.addTemplate({
      id: 'vue-fastapi-mongodb',
      name: 'Vue + FastAPI App',
      description: 'Modern web application with Vue.js frontend, FastAPI backend, and MongoDB database',
      category: 'full-stack',
      tags: ['vue', 'fastapi', 'mongodb', 'python', 'rest-api'],
      complexity: 3,
      features: [
        'Vue 3 Composition API',
        'FastAPI automatic docs',
        'MongoDB with Pydantic',
        'JWT authentication',
        'Real-time updates',
        'API validation',
      ],
      techStack: {
        frontend: 'vue',
        backend: 'fastapi',
        database: 'mongodb',
        deployment: ['netlify', 'railway'],
      },
      files: this.getVueFastAPIMongoDBFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'apiPrefix',
          type: 'string',
          description: 'API prefix',
          default: '/api/v1',
          required: true,
        },
        {
          name: 'enableCORS',
          type: 'boolean',
          description: 'Enable CORS',
          default: true,
          required: false,
        },
      ],
      prerequisites: ['Python 3.9+', 'Node.js 18+', 'MongoDB'],
      setupInstructions: [
        'Install Python dependencies: pip install -r requirements.txt',
        'Install Node.js dependencies: npm install',
        'Configure MongoDB connection',
        'Start backend: uvicorn main:app --reload',
        'Start frontend: npm run dev',
      ],
    });

    // Angular + NestJS + PostgreSQL Template
    this.addTemplate({
      id: 'angular-nestjs-postgresql',
      name: 'Enterprise Angular App',
      description: 'Enterprise-grade application with Angular frontend, NestJS backend, and PostgreSQL',
      category: 'enterprise',
      tags: ['angular', 'nestjs', 'postgresql', 'typescript', 'enterprise'],
      complexity: 4,
      features: [
        'Angular Material UI',
        'NestJS with decorators',
        'TypeORM with PostgreSQL',
        'JWT + Role-based auth',
        'Swagger documentation',
        'Unit and E2E tests',
      ],
      techStack: {
        frontend: 'angular',
        backend: 'nestjs',
        database: 'postgresql',
        deployment: ['aws', 'azure'],
      },
      files: this.getAngularNestJSPostgreSQLFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'useGraphQL',
          type: 'boolean',
          description: 'Use GraphQL instead of REST',
          default: false,
          required: false,
        },
        {
          name: 'includeTests',
          type: 'boolean',
          description: 'Include test setup',
          default: true,
          required: false,
        },
      ],
      prerequisites: ['Node.js 18+', 'Angular CLI', 'PostgreSQL', 'Docker'],
      setupInstructions: [
        'Install dependencies: npm install',
        'Configure database connection',
        'Run migrations: npm run migration:run',
        'Start backend: npm run start:dev',
        'Start frontend: ng serve',
      ],
    });

    // Svelte + SvelteKit Template
    this.addTemplate({
      id: 'sveltekit-app',
      name: 'SvelteKit Application',
      description: 'Modern web application built with SvelteKit',
      category: 'frontend',
      tags: ['svelte', 'sveltekit', 'typescript', 'ssr'],
      complexity: 2,
      features: [
        'SvelteKit framework',
        'Server-side rendering',
        'File-based routing',
        'TypeScript support',
        'Tailwind CSS',
        'Progressive enhancement',
      ],
      techStack: {
        frontend: 'svelte',
        backend: 'sveltekit',
        database: '',
        deployment: ['vercel', 'netlify'],
      },
      files: this.getSvelteKitFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'useTailwind',
          type: 'boolean',
          description: 'Include Tailwind CSS',
          default: true,
          required: false,
        },
      ],
      prerequisites: ['Node.js 18+'],
      setupInstructions: [
        'Install dependencies: npm install',
        'Start development server: npm run dev',
      ],
    });

    // Express API Template
    this.addTemplate({
      id: 'express-api',
      name: 'Express REST API',
      description: 'RESTful API built with Express.js and TypeScript',
      category: 'backend',
      tags: ['express', 'typescript', 'rest-api', 'swagger'],
      complexity: 2,
      features: [
        'Express.js with TypeScript',
        'JWT authentication',
        'Input validation',
        'Error handling',
        'Swagger documentation',
        'Rate limiting',
      ],
      techStack: {
        frontend: '',
        backend: 'express',
        database: 'postgresql',
        deployment: ['railway', 'heroku'],
      },
      files: this.getExpressAPIFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'includeAuth',
          type: 'boolean',
          description: 'Include authentication',
          default: true,
          required: false,
        },
      ],
      prerequisites: ['Node.js 18+'],
      setupInstructions: [
        'Install dependencies: npm install',
        'Configure environment variables',
        'Start development server: npm run dev',
      ],
    });

    // Microservices Template
    this.addTemplate({
      id: 'microservices-starter',
      name: 'Microservices Architecture',
      description: 'Microservices setup with API Gateway, service discovery, and monitoring',
      category: 'microservices',
      tags: ['microservices', 'docker', 'kubernetes', 'api-gateway'],
      complexity: 5,
      features: [
        'API Gateway',
        'Service discovery',
        'Inter-service communication',
        'Centralized logging',
        'Health checks',
        'Circuit breaker pattern',
      ],
      techStack: {
        frontend: 'react',
        backend: 'multiple',
        database: 'multiple',
        deployment: ['kubernetes', 'docker-swarm'],
      },
      files: this.getMicroservicesFiles(),
      variables: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project name',
          required: true,
        },
        {
          name: 'serviceCount',
          type: 'number',
          description: 'Number of services',
          default: 3,
          required: true,
        },
      ],
      prerequisites: ['Docker', 'Kubernetes CLI', 'Node.js 18+'],
      setupInstructions: [
        'Install dependencies for all services',
        'Build Docker images',
        'Deploy to Kubernetes cluster',
        'Configure service mesh',
      ],
    });
  }

  private addTemplate(template: Template): void {
    this.templates.set(template.id, template);
  }

  async getTemplate(templateId: string): Promise<Template | null> {
    return this.templates.get(templateId) || null;
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => template.category === category);
  }

  async getTemplatesByTechStack(
    frontend?: string, 
    backend?: string, 
    database?: string,
  ): Promise<Template[]> {
    return Array.from(this.templates.values())
      .filter(template => {
        return (!frontend || template.techStack.frontend === frontend) &&
               (!backend || template.techStack.backend === backend) &&
               (!database || template.techStack.database === database);
      });
  }

  async generateProjectFromTemplate(config: TemplateConfig): Promise<ProjectFiles> {
    const template = await this.getTemplate(config.templateId);
    if (!template) {
      throw new Error(`Template ${config.templateId} not found`);
    }

    const projectFiles: ProjectFiles = {};

    // Process each file in the template
    for (const [filePath, content] of Object.entries(template.files)) {
      const processedPath = this.processTemplate(filePath, config.variables);
      const processedContent = this.processTemplate(content, config.variables);
      projectFiles[processedPath] = processedContent;
    }

    return projectFiles;
  }

  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(regex, String(value));
    }

    // Handle conditional blocks
    processed = this.processConditionals(processed, variables);

    // Handle loops
    processed = this.processLoops(processed, variables);

    return processed;
  }

  private processConditionals(template: string, variables: Record<string, any>): string {
    // Process {{#if variable}} ... {{/if}} blocks
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    return template.replace(ifRegex, (match, varName, content) => {
      return variables[varName] ? content : '';
    });
  }

  private processLoops(template: string, variables: Record<string, any>): string {
    // Process {{#each items}} ... {{/each}} blocks
    const eachRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;
    return template.replace(eachRegex, (match, varName, content) => {
      const items = variables[varName];
      if (!Array.isArray(items)) {
        return '';
      }
      
      return items.map(item => {
        return this.processTemplate(content, { ...variables, item });
      }).join('');
    });
  }

  // Template file definitions
  private getReactExpressPostgreSQLFiles(): ProjectFiles {
    return {
      'package.json': JSON.stringify({
        name: '{{projectName}}',
        description: '{{description}}',
        version: '1.0.0',
        scripts: {
          dev: 'concurrently "npm run dev:backend" "npm run dev:frontend"',
          'dev:frontend': 'cd frontend && npm run dev',
          'dev:backend': 'cd backend && npm run dev',
          build: 'npm run build:frontend && npm run build:backend',
          'build:frontend': 'cd frontend && npm run build',
          'build:backend': 'cd backend && npm run build',
        },
        devDependencies: {
          concurrently: '^8.2.0',
        },
      }, null, 2),

      'frontend/package.json': JSON.stringify({
        name: '{{projectName}}-frontend',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-router-dom': '^6.8.0',
          '@tanstack/react-query': '^4.24.0',
          axios: '^1.3.0',
        },
        devDependencies: {
          '@types/react': '^18.0.27',
          '@types/react-dom': '^18.0.10',
          '@vitejs/plugin-react': '^3.1.0',
          typescript: '^4.9.3',
          vite: '^4.1.0',
        },
      }, null, 2),

      'frontend/src/App.tsx': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
{{#if includeAdmin}}
import AdminPage from './pages/AdminPage';
{{/if}}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
{{#if includeAdmin}}
            <Route path="/admin" element={<AdminPage />} />
{{/if}}
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;`,

      'backend/package.json': JSON.stringify({
        name: '{{projectName}}-backend',
        version: '1.0.0',
        scripts: {
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: {
          express: '^4.18.0',
          cors: '^2.8.5',
          helmet: '^6.0.0',
          dotenv: '^16.0.0',
          'express-rate-limit': '^6.7.0',
          pg: '^8.8.0',
        },
        devDependencies: {
          '@types/express': '^4.17.0',
          '@types/cors': '^2.8.0',
          '@types/node': '^18.0.0',
          '@types/pg': '^8.6.0',
          nodemon: '^2.0.0',
          'ts-node': '^10.9.0',
          typescript: '^4.9.0',
        },
      }, null, 2),

      'backend/src/index.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '{{projectName}} API is running' });
});

{{#if authProvider === 'local'}}
// Authentication routes
app.post('/api/auth/login', (req, res) => {
  // Login logic here
  res.json({ message: 'Login endpoint' });
});

app.post('/api/auth/register', (req, res) => {
  // Registration logic here
  res.json({ message: 'Register endpoint' });
});
{{/if}}

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,

      'docker-compose.yml': `version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/{{projectName}}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB={{projectName}}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,

      'README.md': `# {{projectName}}

{{description}}

## Quick Start

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Start development servers: \`npm run dev\`
4. Open http://localhost:3000

## Project Structure

- \`frontend/\` - React application
- \`backend/\` - Express.js API
- \`docker-compose.yml\` - Container configuration

## Features

- React 18 with TypeScript
- Express.js REST API
- PostgreSQL database
- Docker containerization
{{#if authProvider === 'local'}}
- Local authentication
{{/if}}
{{#if includeAdmin}}
- Admin dashboard
{{/if}}

## Development

### Frontend
\`\`\`bash
cd frontend
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd backend
npm run dev
\`\`\`

### Docker
\`\`\`bash
docker-compose up -d
\`\`\`

## License

MIT`,
    };
  }

  private getVueFastAPIMongoDBFiles(): ProjectFiles {
    return {
      'frontend/package.json': JSON.stringify({
        name: '{{projectName}}-frontend',
        private: true,
        version: '0.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vue-tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          vue: '^3.2.0',
          'vue-router': '^4.1.0',
          pinia: '^2.0.0',
          axios: '^1.3.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^4.0.0',
          'vue-tsc': '^1.0.0',
          typescript: '^4.9.0',
          vite: '^4.1.0',
        },
      }, null, 2),

      'backend/requirements.txt': `fastapi==0.95.0
uvicorn[standard]==0.21.0
motor==3.1.0
pydantic==1.10.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.0
python-multipart==0.0.6`,

      'backend/main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os

app = FastAPI(title="{{projectName}}", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGODB_URL)
database = client.{{projectName}}

@app.get("{{apiPrefix}}/health")
async def health_check():
    return {"status": "OK", "message": "{{projectName}} API is running"}

@app.get("{{apiPrefix}}/")
async def root():
    return {"message": "Welcome to {{projectName}}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,

      'docker-compose.yml': `version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongo:27017
    volumes:
      - ./backend:/app
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:`,
    };
  }

  private getAngularNestJSPostgreSQLFiles(): ProjectFiles {
    return {
      'frontend/package.json': JSON.stringify({
        name: '{{projectName}}-frontend',
        version: '0.0.0',
        scripts: {
          'ng': 'ng',
          'start': 'ng serve',
          'build': 'ng build',
          'test': 'ng test',
          'lint': 'ng lint',
          'e2e': 'ng e2e',
        },
        dependencies: {
          '@angular/animations': '^15.0.0',
          '@angular/common': '^15.0.0',
          '@angular/compiler': '^15.0.0',
          '@angular/core': '^15.0.0',
          '@angular/forms': '^15.0.0',
          '@angular/material': '^15.0.0',
          '@angular/platform-browser': '^15.0.0',
          '@angular/platform-browser-dynamic': '^15.0.0',
          '@angular/router': '^15.0.0',
          'rxjs': '~7.5.0',
          'tslib': '^2.3.0',
          'zone.js': '~0.12.0',
        },
        devDependencies: {
          '@angular-devkit/build-angular': '^15.0.0',
          '@angular/cli': '~15.0.0',
          '@angular/compiler-cli': '^15.0.0',
          '@types/jasmine': '~4.3.0',
          '@types/node': '^18.7.0',
          'jasmine-core': '~4.4.0',
          'karma': '~6.4.0',
          'karma-chrome-launcher': '~3.1.0',
          'karma-coverage': '~2.2.0',
          'karma-jasmine': '~5.1.0',
          'karma-jasmine-html-reporter': '~2.0.0',
          'typescript': '~4.8.0',
        },
      }, null, 2),

      'backend/package.json': JSON.stringify({
        name: '{{projectName}}-backend',
        version: '0.0.1',
        scripts: {
          'prebuild': 'rimraf dist',
          'build': 'nest build',
          'format': 'prettier --write "src/**/*.ts" "test/**/*.ts"',
          'start': 'nest start',
          'start:dev': 'nest start --watch',
          'start:debug': 'nest start --debug --watch',
          'start:prod': 'node dist/main',
          'lint': 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
          'test': 'jest',
          'test:watch': 'jest --watch',
          'test:cov': 'jest --coverage',
          'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
          'test:e2e': 'jest --config ./test/jest-e2e.json',
        },
        dependencies: {
          '@nestjs/common': '^9.0.0',
          '@nestjs/core': '^9.0.0',
          '@nestjs/platform-express': '^9.0.0',
          '@nestjs/typeorm': '^9.0.0',
          '@nestjs/swagger': '^6.0.0',
          'typeorm': '^0.3.0',
          'pg': '^8.8.0',
          'class-validator': '^0.14.0',
          'class-transformer': '^0.5.0',
          'reflect-metadata': '^0.1.13',
          'rimraf': '^3.0.2',
          'rxjs': '^7.2.0',
        },
        devDependencies: {
          '@nestjs/cli': '^9.0.0',
          '@nestjs/schematics': '^9.0.0',
          '@nestjs/testing': '^9.0.0',
          '@types/express': '^4.17.13',
          '@types/jest': '29.2.4',
          '@types/node': '18.11.18',
          '@types/supertest': '^2.0.11',
          '@typescript-eslint/eslint-plugin': '^5.0.0',
          '@typescript-eslint/parser': '^5.0.0',
          'eslint': '^8.0.1',
          'eslint-config-prettier': '^8.3.0',
          'eslint-plugin-prettier': '^4.0.0',
          'jest': '29.3.1',
          'prettier': '^2.3.2',
          'source-map-support': '^0.5.20',
          'supertest': '^6.1.3',
          'ts-jest': '29.0.3',
          'ts-loader': '^9.2.3',
          'ts-node': '^10.0.0',
          'tsconfig-paths': '4.1.1',
          'typescript': '^4.7.4',
        },
      }, null, 2),
    };
  }

  private getSvelteKitFiles(): ProjectFiles {
    return {
      'package.json': JSON.stringify({
        name: '{{projectName}}',
        version: '0.0.1',
        private: true,
        scripts: {
          dev: 'vite dev',
          build: 'vite build',
          preview: 'vite preview',
          check: 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json',
          'check:watch': 'svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch',
        },
        devDependencies: {
          '@sveltejs/adapter-auto': '^2.0.0',
          '@sveltejs/kit': '^1.20.4',
          'svelte': '^4.0.5',
          'svelte-check': '^3.4.3',
          typescript: '^5.0.0',
          vite: '^4.4.2',
        },
        type: 'module',
      }, null, 2),

      'src/app.html': `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>`,

      'src/routes/+page.svelte': `<script lang="ts">
	let name = '{{projectName}}';
</script>

<svelte:head>
	<title>{name}</title>
	<meta name="description" content="{{description}}" />
</svelte:head>

<section>
	<h1>Welcome to {name}!</h1>
	<p>{{description}}</p>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
</style>`,
    };
  }

  private getExpressAPIFiles(): ProjectFiles {
    return {
      'package.json': JSON.stringify({
        name: '{{projectName}}',
        version: '1.0.0',
        description: '{{description}}',
        main: 'dist/index.js',
        scripts: {
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
          test: 'jest',
        },
        dependencies: {
          express: '^4.18.0',
          cors: '^2.8.5',
          helmet: '^6.0.0',
          dotenv: '^16.0.0',
          'express-rate-limit': '^6.7.0',
          'express-validator': '^6.14.0',
        },
        devDependencies: {
          '@types/express': '^4.17.0',
          '@types/cors': '^2.8.0',
          '@types/node': '^18.0.0',
          '@types/jest': '^29.0.0',
          nodemon: '^2.0.0',
          'ts-node': '^10.9.0',
          typescript: '^4.9.0',
          jest: '^29.0.0',
          'ts-jest': '^29.0.0',
        },
      }, null, 2),

      'src/index.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '{{projectName}} API is running' });
});

{{#if includeAuth}}
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Register endpoint' });
});
{{/if}}

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
    };
  }

  private getMicroservicesFiles(): ProjectFiles {
    return {
      'docker-compose.yml': `version: '3.8'

services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "3000:3000"
    environment:
      - USER_SERVICE_URL=http://user-service:8001
      - ORDER_SERVICE_URL=http://order-service:8002
      - PRODUCT_SERVICE_URL=http://product-service:8003
    depends_on:
      - user-service
      - order-service
      - product-service

  user-service:
    build: ./services/user-service
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/users
    depends_on:
      - postgres

  order-service:
    build: ./services/order-service
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/orders
    depends_on:
      - postgres

  product-service:
    build: ./services/product-service
    ports:
      - "8003:8003"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/products
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_MULTIPLE_DATABASES=users,orders,products
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`,

      'api-gateway/package.json': JSON.stringify({
        name: '{{projectName}}-api-gateway',
        version: '1.0.0',
        scripts: {
          dev: 'nodemon src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
        },
        dependencies: {
          express: '^4.18.0',
          'http-proxy-middleware': '^2.0.0',
          cors: '^2.8.5',
          helmet: '^6.0.0',
        },
        devDependencies: {
          '@types/express': '^4.17.0',
          nodemon: '^2.0.0',
          'ts-node': '^10.9.0',
          typescript: '^4.9.0',
        },
      }, null, 2),
    };
  }
}

export const projectTemplates = new ProjectTemplatesService();

// API endpoints
export const getAllTemplates = api(
  { method: 'GET', path: '/templates' },
  async (): Promise<Template[]> => {
    return await projectTemplates.getAllTemplates();
  },
);

export const getTemplate = api(
  { method: 'GET', path: '/templates/:templateId' },
  async ({ templateId }: { templateId: string }): Promise<Template | null> => {
    return await projectTemplates.getTemplate(templateId);
  },
);

export const getTemplatesByCategory = api(
  { method: 'GET', path: '/templates/category/:category' },
  async ({ category }: { category: string }): Promise<Template[]> => {
    return await projectTemplates.getTemplatesByCategory(category);
  },
);

export const generateProject = api(
  { method: 'POST', path: '/templates/generate' },
  async (config: TemplateConfig): Promise<ProjectFiles> => {
    return await projectTemplates.generateProjectFromTemplate(config);
  },
);